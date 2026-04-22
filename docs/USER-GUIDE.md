# Käyttöohje

Tiivis referenssi sovelluksen näkymistä ja toiminnoista. Sovelluksen sisältä
sama ohje löytyy sivulta **`/ohje`** — se on ajantasaisempi ja sisältää
interaktiivisia esimerkkejä.

## Pikaopas (3 min)

1. **Aloita yleiskuvasta** — klikkaa treemapin laatikkoa tai taulukkorivin
   "Avaa →" mennäksesi pääluokka → luku → momentti → aikasarja.
2. **Käytä yläpalkin hakua** — rajaa jokaista näkymää reaaliajassa; osumat
   keltaisella. Esim. "terveys", "eläke", "maatalous".
3. **Julkinen talous** — valtio + kunnat + ST-rahastot yhdessä näkymässä
   (EDP-velka 1975→, COFOG, kvartaalit).
4. **Vuosivertailu** — valitse 2+ vuotta, näe suurimmat muutokset pylväinä /
   hajontakuviona / muutospylväinä. Klikkaa riviä porautuaksesi.
5. **Taulukko** — rivitasoinen suodatus ja **Excel-vienti**.

## Sivut

| Reitti | Sisältö |
|---|---|
| `/` | Yleiskuva — porautuva treemap, hierarkian minimap, aikasarja, pääluokkataulukko |
| `/julkinen-talous` | EDP-velka 1975→, COFOG-menot 1990→, kvartaalit 1999→; sektorit S13/S1311/S1313/S1314 |
| `/vertailu` | Vuosivertailu — pylväät/hajonta/muutospylväät, abs/rel, top N, drill-down |
| `/taulukko` | Rivit kaikilla dokumenttityypeillä, chip-filtterit, lajittelu, XLSX-vienti |
| `/tiivistelma` | Aineiston profiili — rivit, sarakkeet, NULL-osuudet, top-10 momentit |
| `/dokumentit` | PDF-julkaisut, avautuvat iframena sovelluksen sisällä + markdown-näkymä |
| `/lahteet` | Tietolähderekisteri + toteutettavuuskuvaukset suunnitelluille |
| `/ohje` | Tämä ohje, laajempi versio |
| `/metodologia` | ETL-ketju, Parquet-skeema, laskentaperiaatteet |
| `/tietoja` | Tekninen pino, lisenssit, jatkokehityssuunnitelma |

## Koko sovelluksen tasoiset ominaisuudet

### Avoin tekstihaku
Yläpalkin `⌕`-kenttä suodattaa kaikilla sivuilla. Osumat **keltaisella**
korostuksella. Tyhjennä `×`-napista.

### Drill-down
Yleiskuva ja Vuosivertailu tukevat syventävää navigointia:
pääluokka → luku → momentti. Polku näkyy **breadcrumbissa** (klikattavissa)
ja Yleiskuvan **hierarkian minimapissa** (vaakarivistö, leveys = osuus).

### Lähteistetty visualisointi
Jokaisen graafin alla näkyy `Lähde: {nimi}` — klikkaus vie
`/lahteet#{id}`-ankkuriin.

### Vaalea moderni teema
Valkoiset paneelit pehmeillä varjoilla, pyöristetyt kulmat, Inter-tyyppinen
typografia. Responsiivinen alle 960 px leveydellä.

## Datan päivittäminen

```bash
# Kerran: venv ja riippuvuudet
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt pdfplumber

# VM-CSV + StatFin PxWeb
scripts/.venv/bin/python scripts/build_data.py
# --refresh pakottaa uudelleenlatauksen verkosta
# --skip-vm / --skip-statfin rajaa yhteen osaan

# Valto-julkaisuarkiston PDF:t
scripts/.venv/bin/python scripts/fetch_pdfs.py

# PDF → Markdown (mahdollistaa haun ja kauniin lukunäkymän)
scripts/.venv/bin/python scripts/extract_pdfs_to_md.py
```

Tulokset: `public/data/*.parquet`, `public/pdfs/*.pdf`, `public/pdfs/*.md`,
`public/pdfs/index.json`. Sovellus lukee nämä staattisesti — selaimen reload
tuo tuoreet tiedot.

## Ongelmatilanteet

| Oire | Syy ja korjaus |
|---|---|
| "Datan lataus epäonnistui" | Parquet puuttuu → aja `npm run data` |
| "Failed to construct Worker" | Tarkista että ajat `localhost:5173`:ssa (ei tiedostosta) |
| PDF ei aukea iframessa | Käytä "Avaa uudessa välilehdessä ↗" |
| Treemap tyhjä | Hakusana rajaa kaiken pois — tyhjennä haku |
| VM 503 | Palvelin ruuhkassa — pipeline retry yrittää 4×, odota ja aja uudestaan |

## Mikä puuttuu (suunniteltuja laajennuksia)

`/lahteet` näyttää täyden listan + arvion työmäärästä:

- Valtiokonttori Talous-API — toteutuma momenttitasolla (1–2 h)
- Valtiokonttori Valtionvelka-API — lainakoostumus (~1 h)
- Tutkihankintoja.fi — ostolaskut (3–6 h aggregaatteina)
- Eurostat gov_10a_exp — EU-vertailu (2–3 h)
- Kela Kelasto — etuuksien maksut (4–8 h valituille)
- THL sosiaali- ja terveysmenot (2–3 h)
- Eduskunnan HE-PDF:t — hallituksen talousarvioesityksen koko teos

Kerro `/lahteet`-sivulla, minkä haluat toteutettavaksi seuraavaksi.
