#!/usr/bin/env python3
"""
Datapipeline: Valtion talousarvioesitykset -> Parquet.

Lataa Valtiovarainministeriön avoimesta datasta (budjetti.vm.fi) CSV-muotoiset
hallituksen talousarvioesitykset halutuilta vuosilta ja kokoaa niistä yhden
normalisoidun Parquet-tiedoston public/data/budget.parquet, jonka selainfrontend
lukee DuckDB-Wasm:lla.

Lähde:   https://budjetti.vm.fi/opendata/
Lisenssi: CC BY 4.0  (https://creativecommons.org/licenses/by/4.0/deed.fi)

Skripti on idempotentti: raakadata cachetetaan hakemistoon scripts/cache/ ja
ladataan uudelleen vain jos --refresh tai tiedostoa ei ole.

Ajo:
    python3 scripts/build_data.py
    python3 scripts/build_data.py --years 2024 2025 2026
    python3 scripts/build_data.py --refresh
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

try:
    import pyarrow as pa
    import pyarrow.parquet as pq
except ImportError:
    sys.stderr.write(
        "pyarrow puuttuu. Asenna: pip install -r scripts/requirements.txt\n"
    )
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = REPO_ROOT / "scripts" / "cache"
OUT_PARQUET = REPO_ROOT / "public" / "data" / "budget.parquet"
OUT_META = REPO_ROOT / "public" / "data" / "build_meta.json"
OUT_PF_PARQUET = REPO_ROOT / "public" / "data" / "public_finance.parquet"
OUT_PF_META = REPO_ROOT / "public" / "data" / "public_finance_meta.json"
OUT_EU_PARQUET = REPO_ROOT / "public" / "data" / "eurostat_cofog.parquet"
OUT_EU_META = REPO_ROOT / "public" / "data" / "eurostat_cofog_meta.json"

VM_BASE = "https://budjetti.vm.fi/indox/opendata"

DOC_TYPES = {
    "hallituksenEsitys": "Hallituksen esitys",
    "valtiovarainministerionKanta": "Valtiovarainministeriön ehdotus",
    "eduskunnanKirjelma": "Eduskunnan kirjelmä",
}

# Valtion talousarvion pääluokat (ministeriöt + erityiserät). Lataamme nämä
# erikseen ja yhdistämme. 404-vastaukset ohitetaan hiljaa: kaikki pääluokat
# eivät ole olemassa joka vuosi (esim. tasavallan presidentin erä 22 voi puuttua).
MAIN_CLASSES = list(range(21, 37))  # 21..36

DEFAULT_YEARS = [2022, 2023, 2024, 2025, 2026]
DEFAULT_DOCS = ["hallituksenEsitys"]


@dataclass
class Row:
    vuosi: int
    dokumentti: str
    paaluokka_num: int
    paaluokka_nimi: str
    luku_num: str
    luku_nimi: str
    momentti_num: str
    momentti_nimi: str
    info: str
    maararaha_eur: int | None
    aiemmin_budjetoitu_eur: int | None
    toteutuma_edellinen_eur: int | None
    toteutuma_kaksi_vuotta_sitten_eur: int | None


def build_url(year: int, doc_type: str, paaluokka: int) -> str:
    return f"{VM_BASE}/{year}/tae/{doc_type}/{year}-tae-{doc_type}-{paaluokka}.csv"


def cache_path(year: int, doc_type: str, paaluokka: int) -> Path:
    return CACHE_DIR / f"{year}-{doc_type}-{paaluokka}.csv"


def fetch(url: str, retries: int = 4) -> bytes | None:
    """Lataa URL. Palauttaa None jos 404. Yrittää uudelleen 5xx-virheissä."""
    req = Request(url, headers={"User-Agent": "valtion-budjetti-etl/0.1"})
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urlopen(req, timeout=30) as resp:
                return resp.read()
        except HTTPError as e:
            if e.code == 404:
                return None
            if 500 <= e.code < 600:
                last_err = e
                wait = 1.5 * (2 ** attempt)
                sys.stderr.write(f"  [{e.code}] {url} — uudelleenyritys {attempt+1}/{retries} {wait:.1f}s päästä\n")
                time.sleep(wait)
                continue
            raise
        except URLError as e:
            last_err = e
            wait = 1.5 * (2 ** attempt)
            sys.stderr.write(f"  [verkkovirhe] {url}: {e} — uudelleenyritys {attempt+1}/{retries}\n")
            time.sleep(wait)
            continue
    sys.stderr.write(f"  [luovuttaa] {url}: {last_err}\n")
    return None


def load_csv_bytes(year: int, doc_type: str, paaluokka: int, refresh: bool) -> bytes | None:
    cp = cache_path(year, doc_type, paaluokka)
    if cp.exists() and not refresh:
        return cp.read_bytes()
    url = build_url(year, doc_type, paaluokka)
    data = fetch(url)
    if data is None:
        return None
    cp.parent.mkdir(parents=True, exist_ok=True)
    cp.write_bytes(data)
    return data


def decode(raw: bytes) -> str:
    # VM:n CSV:t ovat Windows-1252 / ISO-8859-15. Fallback varmuuden vuoksi.
    for enc in ("cp1252", "iso-8859-15", "utf-8"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("cp1252", errors="replace")


def parse_int(s: str | None) -> int | None:
    if s is None:
        return None
    s = s.strip().replace("\xa0", "").replace(" ", "")
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        try:
            return int(float(s.replace(",", ".")))
        except ValueError:
            return None


def get_col(row: dict, *names: str) -> str:
    for n in names:
        if n in row and row[n] is not None:
            return row[n]
        for k in row.keys():
            if k.strip().lower() == n.strip().lower():
                return row[k] or ""
    return ""


def col_for_prefix(row: dict, prefix: str) -> tuple[str | None, str]:
    """Etsii sarakkeen jonka nimi alkaa prefixillä (case-insensitive).
    Palauttaa (arvo, sarakenimi) tai (None, '')."""
    p = prefix.strip().lower()
    for k, v in row.items():
        if k and k.strip().lower().startswith(p):
            return v, k
    return None, ""


def parse_csv(raw: bytes, year: int, doc_type: str) -> list[Row]:
    text = decode(raw)
    # Joissain tiedostoissa on BOM; poistetaan
    if text.startswith("﻿"):
        text = text[1:]
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    rows: list[Row] = []
    for raw_row in reader:
        paa_num = parse_int(get_col(raw_row, "Pääluokan numero", "Paaluokan numero"))
        if paa_num is None:
            continue
        paa_nimi = get_col(raw_row, "Pääluokan nimi", "Paaluokan nimi").strip().strip('"')
        luku_num = get_col(raw_row, "Menoluvun numero", "Luvun numero").strip()
        luku_nimi = get_col(raw_row, "Menoluvun nimi", "Luvun nimi").strip().strip('"')
        mom_num = get_col(raw_row, "Menomomentin numero", "Momentin numero").strip()
        mom_nimi = get_col(raw_row, "Menomomentin nimi", "Momentin nimi").strip().strip('"')
        info = get_col(raw_row, "Menomomentin info-osa", "Momentin info-osa").strip()

        maar = parse_int(get_col(raw_row, "Määräraha", "Maararaha"))

        aiemmin_val, _ = col_for_prefix(raw_row, "Aiemmin budjetoitu")
        aiemmin = parse_int(aiemmin_val)

        # Kaksi uusinta toteutumavuotta: nimi on "Toteutuma YYYY"
        toteutumat: list[tuple[int, int | None]] = []
        for k, v in raw_row.items():
            if k and k.strip().lower().startswith("toteutuma"):
                # nimessä on vuosi perässä
                parts = k.strip().split()
                if len(parts) >= 2:
                    try:
                        tv = int(parts[-1])
                        toteutumat.append((tv, parse_int(v)))
                    except ValueError:
                        pass
        toteutumat.sort(reverse=True)
        tot_edel = toteutumat[0][1] if len(toteutumat) >= 1 else None
        tot_kaksi = toteutumat[1][1] if len(toteutumat) >= 2 else None

        rows.append(Row(
            vuosi=year,
            dokumentti=DOC_TYPES[doc_type],
            paaluokka_num=paa_num,
            paaluokka_nimi=paa_nimi,
            luku_num=luku_num,
            luku_nimi=luku_nimi,
            momentti_num=mom_num,
            momentti_nimi=mom_nimi,
            info=info,
            maararaha_eur=maar,
            aiemmin_budjetoitu_eur=aiemmin,
            toteutuma_edellinen_eur=tot_edel,
            toteutuma_kaksi_vuotta_sitten_eur=tot_kaksi,
        ))
    return rows


def rows_to_table(rows: list[Row]) -> pa.Table:
    cols = {
        "vuosi": pa.array([r.vuosi for r in rows], type=pa.int32()),
        "dokumentti": pa.array([r.dokumentti for r in rows], type=pa.string()),
        "paaluokka_num": pa.array([r.paaluokka_num for r in rows], type=pa.int32()),
        "paaluokka_nimi": pa.array([r.paaluokka_nimi for r in rows], type=pa.string()),
        "luku_num": pa.array([r.luku_num for r in rows], type=pa.string()),
        "luku_nimi": pa.array([r.luku_nimi for r in rows], type=pa.string()),
        "momentti_num": pa.array([r.momentti_num for r in rows], type=pa.string()),
        "momentti_nimi": pa.array([r.momentti_nimi for r in rows], type=pa.string()),
        "info": pa.array([r.info for r in rows], type=pa.string()),
        "maararaha_eur": pa.array([r.maararaha_eur for r in rows], type=pa.int64()),
        "aiemmin_budjetoitu_eur": pa.array([r.aiemmin_budjetoitu_eur for r in rows], type=pa.int64()),
        "toteutuma_edellinen_eur": pa.array([r.toteutuma_edellinen_eur for r in rows], type=pa.int64()),
        "toteutuma_kaksi_vuotta_sitten_eur": pa.array(
            [r.toteutuma_kaksi_vuotta_sitten_eur for r in rows], type=pa.int64()
        ),
    }
    return pa.table(cols)


# --- StatFin PxWeb -kyselyt --------------------------------------------------
# Kolme taulua jotka kattavat koko julkisen sektorin: valtio + kunnat + ST-rahastot.
# Lähde: pxdata.stat.fi/PXWeb/api/v1/fi/StatFin, CC BY 4.0.

STATFIN_BASE = "https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin"

STATFIN_TABLES = {
    "jali_122g": {
        "path": "jali/statfin_jali_pxt_122g.px",
        "title": "Julkisyhteisöjen EDP-alijäämä ja -velka, vuosittain 1975–2025",
        # tyhjä query → kaikki arvot (51 × 5 × 4 = 1020)
        "query": [],
    },
    "jmete_12a6": {
        "path": "jmete/statfin_jmete_pxt_12a6.px",
        "title": "Julkisyhteisöjen menot tehtävittäin, vuosittain 1990–2024",
        # Rajataan: Taloustoimi=OTEU, tehtävä=pääluokat (SSS+G01..G10) → ~9k arvoa
        "query": [
            {"code": "Taloustoimi", "selection": {"filter": "item", "values": ["OTEU"]}},
            {"code": "Tehtävä", "selection": {"filter": "item",
                "values": ["SSS", "G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08", "G09", "G10"]}},
        ],
    },
    "jtume_11zf": {
        "path": "jtume/statfin_jtume_pxt_11zf.px",
        "title": "Julkisyhteisöjen tulot ja menot, neljännesvuosittain 1999Q1–2025Q4",
        # Keskeiset aggregaatit sektoreittain (7 × 6 × 107 × 7 ≈ 31k arvoa)
        "query": [
            {"code": "Taloustoimi", "selection": {"filter": "item",
                "values": ["OTRU", "OTEU", "B9", "D1K", "P3K", "D62K"]}},
        ],
    },
}


def pxweb_post(path: str, query_obj: dict) -> dict | None:
    """Suorittaa POST-pyynnön PxWeb-taulun URL:iin ja palauttaa JSON-stat2-vastauksen."""
    url = f"{STATFIN_BASE}/{path}"
    data = json.dumps(query_obj).encode("utf-8")
    req = Request(
        url, data=data,
        headers={"Content-Type": "application/json",
                 "Accept": "application/json",
                 "User-Agent": "valtion-budjetti-etl/0.1"},
    )
    for attempt in range(3):
        try:
            with urlopen(req, timeout=60) as resp:
                return json.loads(resp.read())
        except HTTPError as e:
            sys.stderr.write(f"  [{e.code}] {url} — PxWeb-virhe: {e.read()[:200]!r}\n")
            if 500 <= e.code < 600:
                time.sleep(1.5 * (2 ** attempt))
                continue
            return None
        except URLError as e:
            sys.stderr.write(f"  [verkkovirhe] {url}: {e}\n")
            time.sleep(1.5 * (2 ** attempt))
    return None


def parse_jsonstat2(obj: dict) -> list[dict]:
    """JSON-stat2 → long-format rivilista.
    Jokainen rivi on dict jossa on dimensiokoodi → (arvon koodi, arvon label),
    ja kenttä _value joka sisältää numeerisen arvon."""
    ids: list[str] = obj["id"]
    sizes: list[int] = obj["size"]
    dims = obj["dimension"]
    values = obj["value"]

    indices: list[list[str]] = []
    labels: list[dict[str, str]] = []
    for d in ids:
        cat = dims[d]["category"]
        idx = cat["index"]
        if isinstance(idx, dict):
            ordered_codes = sorted(idx.keys(), key=lambda k: idx[k])
        else:
            ordered_codes = list(idx)
        indices.append(ordered_codes)
        labels.append(cat.get("label", {c: c for c in ordered_codes}))

    stride = [1] * len(sizes)
    for i in range(len(sizes) - 2, -1, -1):
        stride[i] = stride[i + 1] * sizes[i + 1]

    rows: list[dict] = []
    for k, v in enumerate(values):
        if v is None:
            continue
        row: dict = {}
        rem = k
        for i, d in enumerate(ids):
            pos = rem // stride[i]
            rem = rem % stride[i]
            code = indices[i][pos]
            row[d] = (code, labels[i].get(code, code))
        row["_value"] = float(v) if not isinstance(v, bool) else float(v)
        rows.append(row)
    return rows


def build_public_finance(cache_refresh: bool) -> tuple[pa.Table, dict]:
    """Lataa StatFin-taulut ja rakentaa niistä yhtenäisen long-format Parquet-taulun."""
    unified: list[dict] = []
    meta_sources: list[dict] = []

    for table_key, spec in STATFIN_TABLES.items():
        cache_file = CACHE_DIR / f"statfin_{table_key}.json"
        if cache_file.exists() and not cache_refresh:
            data = json.loads(cache_file.read_text())
            print(f"  [cache] {table_key}", file=sys.stderr)
        else:
            print(f"  [hae] StatFin {table_key}", file=sys.stderr)
            query = {"query": spec["query"], "response": {"format": "json-stat2"}}
            data = pxweb_post(spec["path"], query)
            if data is None:
                sys.stderr.write(f"  [ohitettu] {table_key}\n")
                continue
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            cache_file.write_text(json.dumps(data, ensure_ascii=False))

        rows = parse_jsonstat2(data)
        meta_sources.append({
            "table": table_key,
            "url": f"{STATFIN_BASE}/{spec['path']}",
            "title": spec["title"],
            "rivit": len(rows),
        })

        # Normalisoi yhteiseen skeemaan
        for r in rows:
            vuosi = None
            neljannes = None
            if "Vuosi" in r:
                yr_code = r["Vuosi"][0].rstrip("*")
                try:
                    vuosi = int(yr_code)
                except ValueError:
                    continue
            if "Vuosineljännes" in r:
                q_code = r["Vuosineljännes"][0].rstrip("*")
                if "Q" in q_code:
                    y, q = q_code.split("Q")
                    try:
                        vuosi = int(y)
                        neljannes = f"Q{q}"
                    except ValueError:
                        continue

            sektori_code, sektori_name = r.get("Sektori", ("", ""))
            tieto_code, tieto_name = r.get("Tiedot", ("", ""))
            tehtava_code, tehtava_name = r.get("Tehtävä", ("", ""))
            taloustoimi_code, taloustoimi_name = r.get("Taloustoimi", ("", ""))

            # Yksikkö normalisoidaan
            yksikko = "milj_eur"
            tname = (tieto_name or "").lower()
            if "bkt" in tname or "suhde" in tname:
                yksikko = "osuus_bkt_pct"
            elif "henkeä" in tname or "asukas" in tname:
                yksikko = "eur_per_asukas"
            elif "%" in tname or "muutos" in tname:
                yksikko = "pct"

            indikaattori_koodi = tieto_code
            indikaattori_nimi = tieto_name
            # Lisätietona myös taloustoimi (esim. OTEU=menot yhteensä)
            if taloustoimi_code:
                indikaattori_koodi = f"{tieto_code}|{taloustoimi_code}"
                indikaattori_nimi = f"{tieto_name} · {taloustoimi_name.strip()}"

            unified.append({
                "lahde_taulu": table_key,
                "vuosi": vuosi,
                "neljannes": neljannes,
                "sektori_koodi": sektori_code,
                "sektori_nimi": sektori_name,
                "tehtava_koodi": tehtava_code or None,
                "tehtava_nimi": tehtava_name or None,
                "taloustoimi_koodi": taloustoimi_code or None,
                "taloustoimi_nimi": taloustoimi_name or None,
                "indikaattori_koodi": indikaattori_koodi,
                "indikaattori_nimi": indikaattori_nimi,
                "yksikko": yksikko,
                "arvo": r["_value"],
            })

    if not unified:
        raise RuntimeError("StatFin-data tyhjä; tarkista verkkoyhteys.")

    table = pa.table({
        "lahde_taulu": pa.array([r["lahde_taulu"] for r in unified], type=pa.string()),
        "vuosi": pa.array([r["vuosi"] for r in unified], type=pa.int32()),
        "neljannes": pa.array([r["neljannes"] for r in unified], type=pa.string()),
        "sektori_koodi": pa.array([r["sektori_koodi"] for r in unified], type=pa.string()),
        "sektori_nimi": pa.array([r["sektori_nimi"] for r in unified], type=pa.string()),
        "tehtava_koodi": pa.array([r["tehtava_koodi"] for r in unified], type=pa.string()),
        "tehtava_nimi": pa.array([r["tehtava_nimi"] for r in unified], type=pa.string()),
        "taloustoimi_koodi": pa.array([r["taloustoimi_koodi"] for r in unified], type=pa.string()),
        "taloustoimi_nimi": pa.array([r["taloustoimi_nimi"] for r in unified], type=pa.string()),
        "indikaattori_koodi": pa.array([r["indikaattori_koodi"] for r in unified], type=pa.string()),
        "indikaattori_nimi": pa.array([r["indikaattori_nimi"] for r in unified], type=pa.string()),
        "yksikko": pa.array([r["yksikko"] for r in unified], type=pa.string()),
        "arvo": pa.array([r["arvo"] for r in unified], type=pa.float64()),
    })

    return table, {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "row_count": len(unified),
        "tables": meta_sources,
        "license": "CC BY 4.0",
        "source_base": STATFIN_BASE,
    }


# --- Eurostat COFOG EU-vertailu ---------------------------------------------
# gov_10a_exp: General government expenditure by function (COFOG)
# Dokumentaatio: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/...

EUROSTAT_BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"

EUROSTAT_GEOS = [
    ("FI", "Suomi"),
    ("SE", "Ruotsi"),
    ("NO", "Norja"),
    ("DK", "Tanska"),
    ("IS", "Islanti"),
    ("EU27_2020", "EU27 keskiarvo"),
    ("DE", "Saksa"),
    ("FR", "Ranska"),
    ("NL", "Alankomaat"),
    ("AT", "Itävalta"),
    ("BE", "Belgia"),
    ("IT", "Italia"),
    ("ES", "Espanja"),
]

EUROSTAT_COFOG = [
    ("TOTAL", "Yhteensä"),
    ("GF01", "Yleinen julkishallinto"),
    ("GF02", "Puolustus"),
    ("GF03", "Yleinen järjestys ja turvallisuus"),
    ("GF04", "Elinkeinoelämän edistäminen"),
    ("GF05", "Ympäristönsuojelu"),
    ("GF06", "Asuminen ja yhdyskunnat"),
    ("GF07", "Terveydenhuolto"),
    ("GF08", "Vapaa-aika, kulttuuri ja uskonto"),
    ("GF09", "Koulutus"),
    ("GF10", "Sosiaaliturva"),
]

EUROSTAT_UNITS = [("PC_GDP", "osuus_bkt_pct"), ("EUR_HAB", "eur_per_asukas")]
EUROSTAT_YEARS = list(range(2010, 2024))


def fetch_eurostat_cofog(refresh: bool) -> tuple[pa.Table, dict]:
    cache_file = CACHE_DIR / "eurostat_gov_10a_exp.json"
    if cache_file.exists() and not refresh:
        data = json.loads(cache_file.read_text())
        print("  [cache] Eurostat gov_10a_exp", file=sys.stderr)
    else:
        print("  [hae] Eurostat gov_10a_exp — laajennetaan kysely", file=sys.stderr)
        params: list[tuple[str, str]] = [("format", "JSON")]
        for g, _ in EUROSTAT_GEOS:
            params.append(("geo", g))
        for t in EUROSTAT_YEARS:
            params.append(("time", str(t)))
        for c, _ in EUROSTAT_COFOG:
            params.append(("cofog99", c))
        for u, _ in EUROSTAT_UNITS:
            params.append(("unit", u))
        params.append(("na_item", "TE"))
        params.append(("sector", "S13"))
        url = f"{EUROSTAT_BASE}/gov_10a_exp?" + "&".join(f"{k}={v}" for k, v in params)
        req = Request(url, headers={"User-Agent": "valtion-budjetti-etl/0.1", "Accept": "application/json"})
        try:
            with urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
        except HTTPError as e:
            sys.stderr.write(f"  [Eurostat {e.code}] {e.read()[:200]!r}\n")
            raise
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(json.dumps(data, ensure_ascii=False))

    # Parsi JSON-stat (rakenne sama kuin jsonstat2)
    rows_parsed = parse_jsonstat2(data)
    unified: list[dict] = []
    geo_name = dict(EUROSTAT_GEOS)
    cofog_name = dict(EUROSTAT_COFOG)
    unit_name = dict(EUROSTAT_UNITS)

    for r in rows_parsed:
        geo_code, geo_label = r.get("geo", ("", ""))
        time_code, _ = r.get("time", ("", ""))
        cofog_code, cofog_label = r.get("cofog99", ("", ""))
        unit_code, _ = r.get("unit", ("", ""))
        try:
            vuosi = int(time_code)
        except ValueError:
            continue
        unified.append({
            "vuosi": vuosi,
            "maa_koodi": geo_code,
            "maa_nimi": geo_name.get(geo_code, geo_label),
            "cofog_koodi": cofog_code,
            "cofog_nimi": cofog_name.get(cofog_code, cofog_label),
            "yksikko": unit_name.get(unit_code, unit_code),
            "arvo": r["_value"],
        })

    table = pa.table({
        "vuosi": pa.array([r["vuosi"] for r in unified], type=pa.int32()),
        "maa_koodi": pa.array([r["maa_koodi"] for r in unified], type=pa.string()),
        "maa_nimi": pa.array([r["maa_nimi"] for r in unified], type=pa.string()),
        "cofog_koodi": pa.array([r["cofog_koodi"] for r in unified], type=pa.string()),
        "cofog_nimi": pa.array([r["cofog_nimi"] for r in unified], type=pa.string()),
        "yksikko": pa.array([r["yksikko"] for r in unified], type=pa.string()),
        "arvo": pa.array([r["arvo"] for r in unified], type=pa.float64()),
    })

    meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "row_count": len(unified),
        "countries": [g for g, _ in EUROSTAT_GEOS],
        "years": EUROSTAT_YEARS,
        "cofog": [c for c, _ in EUROSTAT_COFOG],
        "units": [u for u, _ in EUROSTAT_UNITS],
        "source_url": f"{EUROSTAT_BASE}/gov_10a_exp",
        "license": "Eurostat reuse policy (yleensä CC BY 4.0)",
    }
    return table, meta


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--years", nargs="+", type=int, default=DEFAULT_YEARS,
                    help=f"Budjettivuodet (oletus {DEFAULT_YEARS})")
    ap.add_argument("--doc-types", nargs="+", default=DEFAULT_DOCS,
                    choices=list(DOC_TYPES.keys()),
                    help=f"Dokumenttityypit (oletus {DEFAULT_DOCS})")
    ap.add_argument("--refresh", action="store_true",
                    help="Ohita cache ja lataa uudelleen verkosta")
    ap.add_argument("--out", type=Path, default=OUT_PARQUET)
    ap.add_argument("--skip-vm", action="store_true", help="Ohita VM:n CSV-lataus")
    ap.add_argument("--skip-statfin", action="store_true", help="Ohita StatFin-lataus")
    ap.add_argument("--skip-eurostat", action="store_true", help="Ohita Eurostat COFOG -lataus")
    args = ap.parse_args()

    all_rows: list[Row] = []
    sources_fetched: list[dict] = []
    missing: list[dict] = []

    if not args.skip_vm:
        print("=== VM:n talousarvioesitykset ===", file=sys.stderr)
        for year in args.years:
            for doc in args.doc_types:
                for pk in MAIN_CLASSES:
                    raw = load_csv_bytes(year, doc, pk, args.refresh)
                    # pieni viive etteivät peräkkäiset kutsut rasittaisi palvelinta
                    time.sleep(0.15)
                    if raw is None:
                        missing.append({"year": year, "doc": doc, "paaluokka": pk})
                        continue
                    parsed = parse_csv(raw, year, doc)
                    if not parsed:
                        missing.append({"year": year, "doc": doc, "paaluokka": pk, "reason": "tyhjä"})
                        continue
                    all_rows.extend(parsed)
                    sources_fetched.append({
                        "year": year,
                        "doc": doc,
                        "paaluokka": pk,
                        "url": build_url(year, doc, pk),
                        "rivit": len(parsed),
                    })
                    print(f"  {year} {doc} pääluokka {pk}: {len(parsed)} riviä", file=sys.stderr)

    if all_rows:
        table = rows_to_table(all_rows)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        pq.write_table(table, args.out, compression="zstd")
    elif not args.skip_vm:
        sys.stderr.write("Ei yhtään VM-riviä ladattu.\n")

    if all_rows:
        meta = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "row_count": len(all_rows),
            "years": sorted({r.vuosi for r in all_rows}),
            "doc_types": sorted({r.dokumentti for r in all_rows}),
            "paaluokat": sorted({r.paaluokka_num for r in all_rows}),
            "sources_fetched": sources_fetched,
            "missing": missing,
            "source_url": "https://budjetti.vm.fi/opendata/",
            "license": "CC BY 4.0",
            "license_url": "https://creativecommons.org/licenses/by/4.0/deed.fi",
        }
        OUT_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"\nKirjoitettu {args.out} ({len(all_rows)} riviä, "
            f"{len(sources_fetched)} CSV-tiedostoa ladattu, {len(missing)} puuttui)",
            file=sys.stderr,
        )

    if not args.skip_statfin:
        print("\n=== StatFin: julkinen talous ===", file=sys.stderr)
        pf_table, pf_meta = build_public_finance(args.refresh)
        OUT_PF_PARQUET.parent.mkdir(parents=True, exist_ok=True)
        pq.write_table(pf_table, OUT_PF_PARQUET, compression="zstd")
        OUT_PF_META.write_text(json.dumps(pf_meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"Kirjoitettu {OUT_PF_PARQUET} ({pf_meta['row_count']} riviä, "
            f"{len(pf_meta['tables'])} StatFin-taulua ladattu)",
            file=sys.stderr,
        )

    if not args.skip_eurostat:
        print("\n=== Eurostat COFOG: EU-vertailu ===", file=sys.stderr)
        eu_table, eu_meta = fetch_eurostat_cofog(args.refresh)
        OUT_EU_PARQUET.parent.mkdir(parents=True, exist_ok=True)
        pq.write_table(eu_table, OUT_EU_PARQUET, compression="zstd")
        OUT_EU_META.write_text(json.dumps(eu_meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"Kirjoitettu {OUT_EU_PARQUET} ({eu_meta['row_count']} riviä, "
            f"{len(eu_meta['countries'])} maata × {len(eu_meta['years'])} vuotta × "
            f"{len(eu_meta['cofog'])} COFOG × {len(eu_meta['units'])} yksikköä)",
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
