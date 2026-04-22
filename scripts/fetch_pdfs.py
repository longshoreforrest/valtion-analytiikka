#!/usr/bin/env python3
"""
Lataa valtiovarainministeriön ja valtioneuvoston talousarvioon liittyviä
PDF-julkaisuja Valto-julkaisuarkistosta (julkaisut.valtioneuvosto.fi).

Käyttää DSpace 7 REST API:a. Hakee aihepiirit:
 - Budjettikatsaus (VM:n selkokielinen vuosikatsaus, syksy & tammikuu)
 - Julkisen talouden suunnitelma (JTS, kehyspäätös)
 - Yleisperustelut ja muut talousarvio-julkaisut

Lopputulos: public/pdfs/*.pdf + public/pdfs/index.json (metadata)

Ajo:
    scripts/.venv/bin/python scripts/fetch_pdfs.py
    scripts/.venv/bin/python scripts/fetch_pdfs.py --refresh
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "public" / "pdfs"
OUT_INDEX = OUT_DIR / "index.json"

VALTO = "https://julkaisut.valtioneuvosto.fi"
UA = "Mozilla/5.0 (valtion-budjetti-etl/0.1)"

# Hakusanat ja niihin liittyvät "tyyppi"-tagit jotka päätyvät indeksiin.
# Kutakin hakua käsitellään erikseen ja tulokset suodatetaan VM-ministeriöön
# (tai kuvailutietoihin "budjet"/"talousarvio"/"julkisen talouden").
QUERIES = [
    ("Budjettikatsaus", "budjettikatsaus"),
    ("Julkisen talouden suunnitelma", "jts"),
    ("talousarvioehdotus", "talousarvioehdotus"),
    ("taloudellinen katsaus", "taloudellinen_katsaus"),
    ("valtion tilinpäätös", "tilinpaatos"),
]

YEAR_RE = re.compile(r"(19|20)\d{2}")


def fetch_json(url: str, retries: int = 3) -> dict | None:
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for attempt in range(retries):
        try:
            with urlopen(req, timeout=30) as resp:
                return json.loads(resp.read())
        except HTTPError as e:
            sys.stderr.write(f"  [{e.code}] {url}\n")
            if 500 <= e.code < 600:
                time.sleep(1.5 * (2 ** attempt))
                continue
            return None
        except URLError as e:
            sys.stderr.write(f"  [verkkovirhe] {url}: {e}\n")
            time.sleep(1.5 * (2 ** attempt))
    return None


def download(url: str, dest: Path) -> bool:
    req = Request(url, headers={"User-Agent": UA})
    try:
        with urlopen(req, timeout=120) as resp:
            data = resp.read()
        dest.write_bytes(data)
        return True
    except (HTTPError, URLError) as e:
        sys.stderr.write(f"  [lataus epäonnistui] {url}: {e}\n")
        return False


def item_matches(item: dict) -> bool:
    meta = item.get("metadata", {})
    orgs = [x.get("value", "").lower() for x in meta.get("dc.contributor.groupauthor", [])]
    title = item.get("name", "").lower()
    if any("valtiovarainministeri" in o or "budjettiosasto" in o for o in orgs):
        return True
    if "talousarvio" in title or "budjettikatsaus" in title or "julkisen talouden" in title:
        return True
    return False


def get_year(item: dict) -> int | None:
    meta = item.get("metadata", {})
    # issued date
    d = meta.get("dc.date.issued", [])
    if d:
        year_str = d[0].get("value", "")[:4]
        try:
            return int(year_str)
        except ValueError:
            pass
    # fallback: title
    m = YEAR_RE.search(item.get("name", ""))
    if m:
        try:
            return int(m.group(0))
        except ValueError:
            pass
    return None


def list_bitstreams(item_uuid: str) -> list[dict]:
    bundles = fetch_json(f"{VALTO}/server/api/core/items/{item_uuid}/bundles")
    if not bundles:
        return []
    out: list[dict] = []
    for b in bundles.get("_embedded", {}).get("bundles", []):
        if b.get("name") != "ORIGINAL":
            continue
        bs_link = b.get("_links", {}).get("bitstreams", {}).get("href")
        if not bs_link:
            continue
        bs = fetch_json(bs_link)
        if not bs:
            continue
        for s in bs.get("_embedded", {}).get("bitstreams", []):
            if s.get("name", "").lower().endswith(".pdf"):
                out.append(s)
    return out


def safe_filename(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9äöå_\-\s]", "", s)
    s = re.sub(r"\s+", "_", s).strip("_")
    return s[:120]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="lataa uudelleen vaikka tiedosto olisi jo kansiossa")
    ap.add_argument("--limit-per-query", type=int, default=20)
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    seen_items: set[str] = set()
    index: list[dict] = []

    for query, tag in QUERIES:
        print(f"=== Haku: {query} ===", file=sys.stderr)
        url = f"{VALTO}/server/api/discover/search/objects?" + urllib.parse.urlencode({
            "query": query,
            "page": 0,
            "size": args.limit_per_query,
            "sort": "dc.date.issued,desc",
            "dsoType": "item",
        })
        data = fetch_json(url)
        if not data:
            continue
        objs = data.get("_embedded", {}).get("searchResult", {}).get("_embedded", {}).get("objects", [])

        for o in objs:
            item = o.get("_embedded", {}).get("indexableObject", {})
            if not item_matches(item):
                continue
            uuid = item.get("uuid", "")
            if not uuid or uuid in seen_items:
                continue
            seen_items.add(uuid)

            title = item.get("name", "")
            year = get_year(item)
            abstract_list = item.get("metadata", {}).get("dc.description.abstract", [])
            abstract = abstract_list[0].get("value", "") if abstract_list else ""
            issued_list = item.get("metadata", {}).get("dc.date.issued", [])
            issued = issued_list[0].get("value", "")[:10] if issued_list else ""
            org_list = item.get("metadata", {}).get("dc.contributor.groupauthor", [])
            org = org_list[0].get("value", "") if org_list else ""

            bitstreams = list_bitstreams(uuid)
            if not bitstreams:
                continue

            # Otetaan isoin PDF (yleensä "koko teos")
            bitstreams.sort(key=lambda b: int(b.get("sizeBytes", 0)), reverse=True)
            bs = bitstreams[0]
            bs_uuid = bs["uuid"]
            size_kb = int(bs.get("sizeBytes", 0)) // 1024
            if size_kb == 0:
                continue

            local_name = f"{year or 'x'}_{tag}_{safe_filename(title)}_{bs_uuid[:8]}.pdf"
            local_path = OUT_DIR / local_name
            download_url = f"{VALTO}/bitstreams/{bs_uuid}/download"
            handle_url = f"{VALTO}/handle/{item.get('handle', '')}"

            if local_path.exists() and not args.refresh:
                print(f"  [cache] {local_name} ({size_kb} kB)", file=sys.stderr)
            else:
                print(f"  [lataa] {local_name} ({size_kb} kB)", file=sys.stderr)
                ok = download(download_url, local_path)
                if not ok:
                    continue
                time.sleep(0.3)

            index.append({
                "tag": tag,
                "tagLabel": query,
                "title": title,
                "year": year,
                "issued": issued,
                "organization": org,
                "abstract": abstract[:600],
                "filename": local_name,
                "local_path": f"/pdfs/{local_name}",
                "size_kb": size_kb,
                "valto_item_url": handle_url,
                "valto_download_url": download_url,
                "item_uuid": uuid,
                "bitstream_uuid": bs_uuid,
            })

    # Järjestä vuodet ja tyypit
    index.sort(key=lambda x: (-(x["year"] or 0), x["tag"], x["title"]))
    OUT_INDEX.write_text(json.dumps({
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(index),
        "total_kb": sum(x["size_kb"] for x in index),
        "source": "julkaisut.valtioneuvosto.fi (DSpace 7 REST API)",
        "license": "CC BY 4.0 (pääsääntöisesti; tarkista yksittäisen julkaisun metatieto)",
        "items": index,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    total_kb = sum(x["size_kb"] for x in index)
    print(
        f"\nValmista: {len(index)} PDF:ää ({total_kb / 1024:.1f} MB), indeksi {OUT_INDEX}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
