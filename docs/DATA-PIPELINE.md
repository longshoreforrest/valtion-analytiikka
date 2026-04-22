# Datapipeline

Tämä dokumentti kuvaa `scripts/build_data.py`-pipelinen toiminnan,
siihen tehtävät laajennukset ja yleisimmät vianetsintätilanteet.

## Tarkoitus

Muuttaa valtiovarainministeriön avoin talousarvioesitysdata analytiikkaan
sopivaksi Parquet-tiedostoksi. Rinnalle kirjoitetaan metatiedosto, joka
dokumentoi täsmälleen mistä ladattiin ja milloin — tämä mahdollistaa
jokaisen datasolun jäljittämisen alkuperäiseen lähteeseen.

## URL-malli

VM:n avoimen datan CSV-tiedostot ovat osoitteessa:

```
https://budjetti.vm.fi/indox/opendata/{vuosi}/tae/{dokumentti}/{vuosi}-tae-{dokumentti}-{paaluokka}.csv
```

Missä:
- `vuosi` = budjettivuosi (esim. 2026)
- `dokumentti` = yksi kolmesta:
  - `hallituksenEsitys` — Hallituksen esitys eduskunnalle
  - `valtiovarainministerionKanta` — VM:n ehdotus (ennen hallituskäsittelyä)
  - `eduskunnanKirjelma` — Eduskunnan hyväksymä lopullinen kirjelmä
- `paaluokka` = hallinnonalan numero 21–36

Esimerkkejä:
```
https://budjetti.vm.fi/indox/opendata/2026/tae/hallituksenEsitys/2026-tae-hallituksenEsitys-33.csv
https://budjetti.vm.fi/indox/opendata/2025/tae/eduskunnanKirjelma/2025-tae-eduskunnanKirjelma-28.csv
```

Pipeline yrittää hakea kaikki yhdistelmät pyydetyille vuosille ja
dokumenteille — 404-vastaukset (pääluokka ei ole olemassa ko.
yhdistelmälle) ohitetaan hiljaa ja kirjataan metatietoihin.

## CSV-formaatti

- **Erotin:** puolipiste `;`
- **Koodaus:** Windows-1252 / ISO-8859-15 (pipeline kokeilee molempia)
- **Otsikko:** rivi 1
- **Sarakkeet** (vähintään):
  - Pääluokan numero, Pääluokan nimi
  - Menoluvun numero, Menoluvun nimi
  - Menomomentin numero, Menomomentin nimi, Menomomentin info-osa
  - Määräraha
  - Aiemmin budjetoitu … lisätalousarvio YYYY (useita)
  - Toteutuma YYYY (yleensä 1–2 edellistä vuotta)

Numerot ovat euroja kokonaislukuina (ei desimaaleja, ei tuhaterottimia
yleensä).

## Ajo

```bash
# Oletukset (viisi viimeisintä vuotta, hallituksen esitys)
scripts/.venv/bin/python scripts/build_data.py

# Yksi vuosi
scripts/.venv/bin/python scripts/build_data.py --years 2026

# Kaikki kolme dokumenttityyppiä
scripts/.venv/bin/python scripts/build_data.py \
    --years 2024 2025 2026 \
    --doc-types hallituksenEsitys valtiovarainministerionKanta eduskunnanKirjelma

# Ohita cache
scripts/.venv/bin/python scripts/build_data.py --refresh

# Toinen ulostulopolku
scripts/.venv/bin/python scripts/build_data.py --out /tmp/budget.parquet
```

## Cache ja metatiedot

- **Raaka-CSV:t:** `scripts/cache/{vuosi}-{dokumentti}-{paaluokka}.csv`.
  Näitä ei committoida (ks. `.gitignore`). Voit poistaa kansion
  pakottaaksesi uudelleenlatauksen.
- **Metatiedot:** `public/data/build_meta.json`. Sisältää aikaleiman,
  rivit per lähde, 404-kadot ja lisenssi-informaation. Sovellus lukee
  tämän ja näyttää `/lahteet`-sivulla "Aineisto päivitetty"-merkinnällä.

## Tietomallin normalisointi

Pipeline tekee seuraavat muunnokset:

1. **Merkkien koodaus**: CP1252 → UTF-8.
2. **Lainausmerkit poistettu** nimikenttien ympäriltä.
3. **Numerokentät**: tyhjä → `NULL`, muuten `int64`. Pilkut ja välilyönnit
   siivotaan.
4. **Tyyppirenominta**: `Pääluokan numero` → `paaluokka_num` jne. Kaikki
   sarakenimet snake_case-muotoon ja ilman ä/ö-merkkejä, jotta
   SQL-kyselyt ovat turvallisia.
5. **Toteutumat**: dynaamiset sarakkeet "Toteutuma YYYY" kerätään ja
   järjestetään uusimmasta vanhimpaan; kaksi uusinta säilyvät omina
   sarakkeinaan.
6. **Dokumentin nimi**: ETL muuntaa `hallituksenEsitys` →
   `"Hallituksen esitys"` luettavuuden vuoksi.

## Uuden pääluokkarajan lisääminen

Jos VM julkaisee uusia pääluokkia (esim. 37, 38), muokkaa
`MAIN_CLASSES`-listaa:

```python
MAIN_CLASSES = list(range(21, 39))  # aiemmin 21..37
```

## Uuden datalähteen integrointi

Pidemmällä aikavälillä pipelineen tulee lisää moduuleita.
Suositeltu rakenne:

```
scripts/
├── build_data.py              # orkestraattori
├── pipelines/
│   ├── __init__.py
│   ├── vm_tae.py              # tämänhetkinen logiikka siirretty tänne
│   ├── valtiokonttori.py
│   ├── statfin.py
│   └── eurostat.py
└── schema/
    └── common.py              # jaetut tyypit ja kolonnistandardit
```

Vaiheet:

1. Luo uusi moduuli `scripts/pipelines/<lähde>.py`, joka vie funktion
   `fetch_and_normalize(years) -> pa.Table`.
2. Lisää `build_data.py`-orkestroijaan kutsu, joka yhdistää osatulokset
   oikeiksi Parquet-tiedostoiksi.
3. Päätä: yhteinen tiedosto vai oma? Yleissääntö: jos skeema on sama
   kuin budjettirivien (momenttitaso, vuosi), yhdistä samaan tiedostoon
   erottavalla `lahde`-sarakkeella. Muuten oma tiedosto, oma DuckDB-
   näkymä.
4. Päivitä `src/data/sources.ts` statuksella `"käytössä"`.

## Vianetsintä

**"HTTP Error 503"**
- VM:n palvelin ruuhkautuu ajoittain. Pipelinessä on neljän yrityksen
  exponentiaalinen backoff; jos silti kaatuu, odota hetki ja aja
  uudestaan. Cache säilyttää aiemmat lataukset.

**"UnicodeDecodeError"**
- Jokin CSV on koodattu poikkeuksellisesti. `decode()`-funktio
  fallbackaa UTF-8:iin ja lopulta `cp1252` with errors="replace".
  Katso `scripts/cache/`-tiedostoa hex-editorilla ja lisää uusi
  encoding `decode`-funktion listalle jos tarpeen.

**"Ei yhtään riviä ladattu"**
- Todennäköisesti virheellinen vuosi (ennen 2014) tai dokumenttityyppi
  (esim. eduskunnanKirjelma ennen kuin se on julkaistu). Katso
  `missing`-lista `build_meta.json`-tiedostosta.

**"pyarrow puuttuu"**
- Aja:
  ```bash
  python3 -m venv scripts/.venv
  scripts/.venv/bin/pip install -r scripts/requirements.txt
  ```

## Aikataulutus (tulevaisuus)

Pipeline ajetaan tällä hetkellä käsin. Ehdotettu automaatio:

- **GitHub Actions cron** joka aamu klo 06:00 Suomen aikaa:
  1. Aja pipeline.
  2. Jos `budget.parquet` muuttui, commit + push.
  3. GitHub Pages rebuild automaattisesti.

Tämä vaatii workflow-tiedoston `.github/workflows/data.yml`, joka on
luonnosvaiheessa — ei vielä commitoitu.
