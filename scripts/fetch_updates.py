#!/usr/bin/env python3
"""
Lataa ajankohtaiset "päivityspaketit" (esim. kehysriihen tulokset) sovellukseen.
Jokainen paketti on yksi hakemisto public/updates/<slug>/ joka sisältää:
  - ladatut PDF:t ja niiden markdown-versiot
  - summary.md (ihmisluettava tiivistelmä)
  - sources.md (lähdeviitteet)
  - index.json (metatiedot + tiedostoluettelo)

Paketit on määritelty UPDATES-listassa alla. Skripti on idempotentti ja cachettaa
ladatut tiedostot (ohita --refresh-lipulla).

Yhteenvetoindeksi public/updates/index.json syntyy pakettien päälle ja sitä
sovellus käyttää "Uusimmat päivitykset" -widgetissä.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

try:
    import pdfplumber  # type: ignore
except ImportError:
    pdfplumber = None  # PDF→MD purkaminen ei ole pakollista

REPO_ROOT = Path(__file__).resolve().parent.parent
UPDATES_DIR = REPO_ROOT / "public" / "updates"
UA = "Mozilla/5.0 (valtion-budjetti-etl/0.1)"


@dataclass
class Pdf:
    url: str
    filename: str
    title: str
    published: str
    source: str


@dataclass
class Link:
    url: str
    title: str
    source: str
    note: str = ""


@dataclass
class Update:
    slug: str
    title: str
    subtitle: str
    event_date: str           # ISO-pvm kun tapahtuma pidettiin
    published: str            # ISO-pvm tai aikaleima päätiedotteelle
    category: str             # esim. "kehysriihi", "budjettiesitys", "tilinpäätös"
    summary_md: str           # käsinkirjoitettu markdown-tiivistelmä
    pdfs: list[Pdf] = field(default_factory=list)
    links: list[Link] = field(default_factory=list)
    highlights: list[str] = field(default_factory=list)  # 3–6 olennaisinta luetelmaa


# ------------------------------------------------------------------
# Pakettien määrittelyt
# ------------------------------------------------------------------

KEHYSRIIHI_2026_SUMMARY = """\
# Kehysriihi 22.–23.4.2026 — Julkisen talouden suunnitelma 2027–2030

Pääministeri Petteri Orpon hallitus neuvotteli kehysriihen 22.–23. huhtikuuta 2026
ja sopi Julkisen talouden suunnitelmasta vuosille 2027–2030. Suunnitelma hyväksytään
valtioneuvoston yleisistunnossa **30.4.2026**, jolloin se myös julkaistaan.

## Avainluvut

- **Valtiontalouden alijäämä** keskimäärin **14,9 mrd €/vuosi** 2027–2030
  (2027: arvio 12,6 mrd €; 2030: n. 16,0 mrd €)
- Uusia **säästötoimia** yhteensä **~520 M€ v. 2030 tasolla** — pääosa
  valtionhallintoon
- Tuottavuuteen kannustava **määräraha­vähennys** 60 M€ vuonna 2026 →
  166,5 M€ vuonna 2030
- **Työn verotuksen kevennys** 525 M€ vuonna 2026, 650 M€ vuodesta 2027
- **Yhteisöverokanta 20 % → 18 %** vuoden 2027 alusta
- **T&K-rahoitus** n. 3,2 mrd € v. 2026, yli 3,4 mrd € v. 2027 (tavoite 1,2 % BKT:sta v. 2030)
- **Työmatka­vähennyksen omavastuu** alennetaan 800 €:oon vuodelle 2026
- Nuorten työllistämiseen **500 uutta kesätyö-/harjoittelupaikkaa**

## Mitä päätettiin

- Vastuullinen finanssipolitiikka ja jo sovitut säästöt jatkuvat
- Kohdennetut toimet kasvun ja työllisyyden vahvistamiseksi
- Puolustuksen ja turvallisuuden rahoitus vahvistuu
- Hyvinvointialueiden rahoitus ja toimintaedellytyksien parannus
- T&K-investointien polku vahvistettu R&D-lain mukaisesti

## Dokumentit ja lähteet

Tähän pakettiin on ladattu VM:n ehdotus valtiontalouden kehyspäätökseksi 2027–2030
(26.2.2026) — se muodostaa pohjan riihen päätöksille. Itse JTS 2027–2030
-asiakirja julkaistaan valtioneuvoston sivuilla 30.4.2026.

Tiivistelmä perustuu hallituksen tiedotteeseen 22.4.2026 klo 21:14, VM:n aiempaan
kehysehdotukseen sekä median raportointiin.
"""

KEHYSRIIHI_2026 = Update(
    slug="2026-04-kehysriihi",
    title="Kehysriihi 2026 — JTS 2027–2030",
    subtitle="Orpon hallituksen kehysneuvottelut 22.–23. huhtikuuta 2026",
    event_date="2026-04-22",
    published="2026-04-22T21:14:00+03:00",
    category="kehysriihi",
    summary_md=KEHYSRIIHI_2026_SUMMARY,
    pdfs=[
        Pdf(
            url="https://vm.fi/documents/10623/307577/Valtiovarainministeri%C3%B6n%20ehdotus%20valtiontalouden%20kehysp%C3%A4%C3%A4t%C3%B6kseksi%20vuosille%202027-2030.pdf/0bde4730-10cc-6001-a93c-5951cb97d7ae?t=1772097692546",
            filename="VM_kehysehdotus_2027-2030.pdf",
            title="Valtiovarainministeriön ehdotus valtiontalouden kehyspäätökseksi 2027–2030",
            published="2026-02-26",
            source="Valtiovarainministeriö",
        ),
    ],
    links=[
        Link(
            url="https://valtioneuvosto.fi/-/orpon-hallitus-epavarmuuden-ajassa-tarvitaan-luottamusta-ja-kasvua-vahvistavia-toimia-1",
            title="Orpon hallitus: Epävarmuuden ajassa tarvitaan luottamusta ja kasvua vahvistavia toimia",
            source="Valtioneuvosto (suomi)",
            note="Päätiedote, julkaistu 22.4.2026 klo 21:14",
        ),
        Link(
            url="https://valtioneuvosto.fi/en/-/orpo-government-uncertain-times-call-for-measures-to-build-confidence-and-boost-growth-1",
            title="Orpo Government: Uncertain times call for measures to build confidence and boost growth",
            source="Finnish Government (English)",
            note="Same release in English",
        ),
        Link(
            url="https://vm.fi/-/valtiovarainministerion-ehdotus-valtiontalouden-kehyksiksi-vuosille-2027-2030-on-julkaistu",
            title="VM: Valtiovarainministeriön ehdotus valtiontalouden kehyksiksi 2027–2030",
            source="Valtiovarainministeriö",
            note="Julkaistu 26.2.2026 — kehysriihen pohja",
        ),
        Link(
            url="https://vm.fi/kehys-ja-budjettivalmistelun-aikataulut",
            title="Kehys- ja budjettivalmistelun aikataulut",
            source="Valtiovarainministeriö",
            note="JTS 2027–2030 hyväksytään valtioneuvoston yleisistunnossa 30.4.2026",
        ),
    ],
    highlights=[
        "Valtiontalouden alijäämä keskimäärin 14,9 mrd €/vuosi 2027–2030",
        "Uusia säästötoimia ~520 M€ vuoden 2030 tasolla",
        "Yhteisöverokanta 20 % → 18 % vuoden 2027 alusta",
        "Työn verotuksen kevennys 525 M€ (2026) / 650 M€ (2027→)",
        "T&K-rahoitus tavoitteena 1,2 % BKT:sta vuonna 2030",
        "Työmatkavähennyksen omavastuu 800 € vuodelle 2026",
    ],
)

UPDATES: list[Update] = [
    KEHYSRIIHI_2026,
]


# ------------------------------------------------------------------
# Lataus ja PDF→MD
# ------------------------------------------------------------------

def download(url: str, dest: Path) -> bool:
    req = Request(url, headers={"User-Agent": UA})
    try:
        with urlopen(req, timeout=120) as resp:
            dest.write_bytes(resp.read())
        return True
    except (HTTPError, URLError) as e:
        sys.stderr.write(f"  [virhe] {url}: {e}\n")
        return False


def pdf_to_markdown(pdf_path: Path) -> str:
    if pdfplumber is None:
        return f"_pdfplumber puuttuu — asenna: pip install pdfplumber_\n"
    try:
        out: list[str] = [f"# {pdf_path.stem.replace('_', ' ')}\n",
                          f"_Lähde: {pdf_path.name}_\n"]
        with pdfplumber.open(pdf_path) as pdf:
            out.append(f"_Sivumäärä: {len(pdf.pages)}_\n")
            for i, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
                text = re.sub(r"\s+\n", "\n", text)
                if text.strip():
                    out.append(f"\n## Sivu {i}\n\n{text.strip()}\n")
        return "\n".join(out)
    except Exception as e:
        return f"# {pdf_path.stem}\n\n_PDF-parsinta epäonnistui: {e}_\n"


# ------------------------------------------------------------------
# Paketin rakennus
# ------------------------------------------------------------------

def build_update(u: Update, refresh: bool) -> dict:
    dir = UPDATES_DIR / u.slug
    dir.mkdir(parents=True, exist_ok=True)
    print(f"=== {u.title} ===", file=sys.stderr)

    pdf_entries: list[dict] = []
    for p in u.pdfs:
        pdf_path = dir / p.filename
        md_path = pdf_path.with_suffix(".md")
        if pdf_path.exists() and not refresh:
            print(f"  [cache] {p.filename}", file=sys.stderr)
        else:
            print(f"  [lataa] {p.filename}", file=sys.stderr)
            if not download(p.url, pdf_path):
                continue
        if not md_path.exists() or md_path.stat().st_mtime < pdf_path.stat().st_mtime:
            print(f"  [purka] {md_path.name}", file=sys.stderr)
            md_path.write_text(pdf_to_markdown(pdf_path), encoding="utf-8")
        pdf_entries.append({
            "url": p.url,
            "local_path": f"/updates/{u.slug}/{p.filename}",
            "md_path": f"/updates/{u.slug}/{md_path.name}",
            "filename": p.filename,
            "title": p.title,
            "published": p.published,
            "source": p.source,
            "size_kb": pdf_path.stat().st_size // 1024 if pdf_path.exists() else 0,
        })

    # summary.md
    (dir / "summary.md").write_text(u.summary_md, encoding="utf-8")

    # sources.md (lähdeviitteet)
    lines = [f"# Lähteet — {u.title}\n"]
    if u.pdfs:
        lines.append("## Ladatut asiakirjat\n")
        for p in u.pdfs:
            lines.append(f"- [{p.title}]({p.url}) — {p.source}, {p.published}")
    if u.links:
        lines.append("\n## Linkit\n")
        for l in u.links:
            note = f" — {l.note}" if l.note else ""
            lines.append(f"- [{l.title}]({l.url}) ({l.source}){note}")
    lines.append("\n---\n_Tiedot päivitetty: " +
                 datetime.now(timezone.utc).isoformat(timespec="seconds") + "_\n")
    (dir / "sources.md").write_text("\n".join(lines), encoding="utf-8")

    meta = {
        "slug": u.slug,
        "title": u.title,
        "subtitle": u.subtitle,
        "event_date": u.event_date,
        "published": u.published,
        "category": u.category,
        "highlights": u.highlights,
        "pdfs": pdf_entries,
        "links": [{"url": l.url, "title": l.title, "source": l.source, "note": l.note} for l in u.links],
        "summary_path": f"/updates/{u.slug}/summary.md",
        "sources_path": f"/updates/{u.slug}/sources.md",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (dir / "index.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--refresh", action="store_true")
    args = ap.parse_args()

    UPDATES_DIR.mkdir(parents=True, exist_ok=True)

    meta_all: list[dict] = []
    for u in UPDATES:
        meta_all.append(build_update(u, args.refresh))

    # Uusin ensin
    meta_all.sort(key=lambda m: m["event_date"], reverse=True)

    index = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(meta_all),
        "updates": [
            {
                "slug": m["slug"],
                "title": m["title"],
                "subtitle": m["subtitle"],
                "event_date": m["event_date"],
                "published": m["published"],
                "category": m["category"],
                "pdf_count": len(m["pdfs"]),
                "link_count": len(m["links"]),
                "highlights": m["highlights"][:3],
            }
            for m in meta_all
        ],
    }
    (UPDATES_DIR / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\nValmista. {len(meta_all)} pakettia kirjoitettu {UPDATES_DIR}/", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
