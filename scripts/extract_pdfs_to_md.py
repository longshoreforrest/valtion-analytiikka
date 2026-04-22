#!/usr/bin/env python3
"""
Purkaa public/pdfs/*.pdf -tiedostot markdown-muotoon public/pdfs/*.md
ja päivittää public/pdfs/index.json:iin:
  - md_path: polku markdowniin
  - text_excerpt: ensimmäiset ~8000 merkkiä hakua varten
  - text_length: kokonaismerkkimäärä

Tämä mahdollistaa:
  1) Sovelluksen sisäisen haun käymään koko tekstiä läpi (excerpt riittää alkuvaiheessa;
     koko MD voidaan ladata kun käyttäjä avaa tarkastelun)
  2) "Avaa MD" -napin: näyttää PDF:n sisällön puhtaana markdowna kauniisti
     renderöitynä
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.stderr.write("pdfplumber puuttuu. Asenna: scripts/.venv/bin/pip install pdfplumber\n")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = REPO_ROOT / "public" / "pdfs"
INDEX = PDF_DIR / "index.json"


def pdf_to_markdown(pdf_path: Path) -> str:
    """Yksinkertainen PDF→MD -muunnos: jokainen sivu on oma luku."""
    out: list[str] = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            out.append(f"# {pdf_path.stem.replace('_', ' ')}\n")
            out.append(f"_Lähde: {pdf_path.name} · {len(pdf.pages)} sivua_\n")
            for i, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                text = normalize_text(text)
                if not text.strip():
                    continue
                out.append(f"\n## Sivu {i}\n")
                out.append(text)
    except Exception as e:
        out.append(f"\n> PDF-parsinta epäonnistui: {e}\n")
    return "\n".join(out).strip() + "\n"


_WS_LINE = re.compile(r"[ \t]+")
_BLANK_LINES = re.compile(r"\n\s*\n\s*\n+")
_HYPHEN_LINEBREAK = re.compile(r"(\w)-\n(\w)")


def normalize_text(s: str) -> str:
    # yhdistä tavutetut rivinvaihdot (esim. "talous-\narvio" → "talousarvio")
    s = _HYPHEN_LINEBREAK.sub(r"\1\2", s)
    # poista ylimääräiset välilyönnit
    s = _WS_LINE.sub(" ", s)
    # poista yli-tyhjät rivit
    s = _BLANK_LINES.sub("\n\n", s)
    return s.strip()


def main() -> int:
    if not INDEX.exists():
        sys.stderr.write("public/pdfs/index.json puuttuu. Aja ensin scripts/fetch_pdfs.py.\n")
        return 1

    meta = json.loads(INDEX.read_text(encoding="utf-8"))
    items = meta.get("items", [])

    updated = 0
    for item in items:
        pdf_path = PDF_DIR / item["filename"]
        if not pdf_path.exists():
            continue
        md_path = pdf_path.with_suffix(".md")

        if md_path.exists() and md_path.stat().st_mtime >= pdf_path.stat().st_mtime:
            md_text = md_path.read_text(encoding="utf-8")
            print(f"  [cache] {md_path.name}", file=sys.stderr)
        else:
            print(f"  [purka] {pdf_path.name}", file=sys.stderr)
            md_text = pdf_to_markdown(pdf_path)
            md_path.write_text(md_text, encoding="utf-8")
            updated += 1

        item["md_path"] = f"/pdfs/{md_path.name}"
        item["text_length"] = len(md_text)
        item["text_excerpt"] = md_text[:8000]

    INDEX.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"\nValmista: {updated} PDF purettu markdowniin, indeksi päivitetty {INDEX}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
