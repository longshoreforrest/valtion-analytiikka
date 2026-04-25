# Julkaisuohje — GitHub Pages

Tässä dokumentissa kuvataan miten Valtion Budjetti -sovellus julkaistaan
internetiin GitHub Pagesin kautta. Lähdekoodi kehitetään tässä repossa
(`~/Documents/GitHub/RapidPrototypes/Antigravity/Valtion Budjetti/`),
ja julkaistava versio kopioidaan erilliseen kohderepoon
(`~/Documents/GitHub/valtion-analytiikka/`), joka on yhdistetty
GitHub Pagesiin.

> **Julkaistu osoite:** <https://longshoreforrest.github.io/valtion-analytiikka/>

## TL;DR — yleinen julkaisu

```bash
# 1) (Tarvittaessa) päivitä data — Parquet, PDF:t, päivityspaketit
scripts/.venv/bin/python scripts/build_data.py
scripts/.venv/bin/python scripts/fetch_pdfs.py
scripts/.venv/bin/python scripts/extract_pdfs_to_md.py
scripts/.venv/bin/python scripts/fetch_updates.py

# 2) Aja julkaisuskripti — kopioi koodin ja datan kohderepoon
scripts/publish_to_pages.sh

# 3) Committaa ja pushaa kohderepoon — GitHub Actions hoitaa loput
cd ~/Documents/GitHub/valtion-analytiikka
git add .
git commit -m "publish: <lyhyt kuvaus muutoksesta>"
git push
```

GitHub Actions ajaa `deploy.yml`-workflown, joka rakentaa Vite-paketin ja
julkaisee `dist/`-kansion sisällön Pagesiin. Sivusto päivittyy ~1–2
minuutissa pushista.

## Arkkitehtuuri pähkinänkuoressa

```
┌──────────────────────────┐    publish_to_pages.sh     ┌──────────────────────┐
│ LÄHDEREPO                │ ─────── rsync ────────────▶│ JULKAISUREPO         │
│ /Antigravity/Valtion B./ │                            │ /valtion-analytiikka/│
│                          │                            │                      │
│ • src/                   │                            │ • src/               │
│ • public/                │                            │ • public/            │
│ • scripts/               │                            │ • scripts/           │
│ • CLAUDE.md ✗            │                            │ • .github/workflows/ │
│ • ClaudeCode_Prompts.md ✗│                            │ • README.md          │
│ • specs/ ✗               │                            │ • .nojekyll          │
│ • .claude/ ✗             │                            │ • public/404.html    │
└──────────────────────────┘                            └──────────────────────┘
                                                              │
                                                              │ git push
                                                              ▼
                                                       ┌─────────────────┐
                                                       │ GitHub Actions  │
                                                       │ deploy.yml      │
                                                       │ data-refresh.yml│
                                                       └─────────────────┘
                                                              │
                                                              ▼
                                                       ┌──────────────┐
                                                       │ GitHub Pages │
                                                       └──────────────┘
```

## Esivalmistelut (kerran)

1. **Kohderepo on olemassa**. Sen oletuspolku on
   `~/Documents/GitHub/valtion-analytiikka/`. Skripti vaatii että polku on
   olemassa ja se on git-repo.
2. **Python-virtuaaliympäristö** on luotu data-pipelinea varten:
   ```bash
   python3 -m venv scripts/.venv
   scripts/.venv/bin/pip install -r scripts/requirements.txt pdfplumber
   ```
3. **Node.js ≥ 18** ja `npm ci` ajettu lähderepossa (tarvitaan paikalliseen
   testaukseen ennen julkaisua).
4. **GitHub Pages** käytössä julkaisurepossa: `Settings → Pages → Source: GitHub Actions`.

## Vaiheet

### 1. Päivitä data tarvittaessa

Jos kyse on **vain koodimuutoksista** (UI, komponentit, tyylit), tätä
vaihetta ei tarvitse ajaa. Data päivitetään Parquettiin vain silloin kun:
- VM tai Tilastokeskus on julkaissut uutta dataa
- Sovellukseen on lisätty uusi datalähde
- Halutaan ajaa pakotettu uudelleenlataus

```bash
# Vakiopäivitys (cache hyödyntäen)
scripts/.venv/bin/python scripts/build_data.py

# Pakota uudelleenlataus
scripts/.venv/bin/python scripts/build_data.py --refresh

# Voi rajata yhteen lähteeseen
scripts/.venv/bin/python scripts/build_data.py --skip-eurostat
```

PDF:t ja päivityspaketit:
```bash
scripts/.venv/bin/python scripts/fetch_pdfs.py
scripts/.venv/bin/python scripts/extract_pdfs_to_md.py
scripts/.venv/bin/python scripts/fetch_updates.py
```

### 2. Testaa lokaalisti

```bash
npm run build       # tarkista että TypeScript ja Vite menevät läpi
npm run preview     # avaa http://localhost:4173 ja silmäile
```

### 3. Aja julkaisuskripti

```bash
scripts/publish_to_pages.sh
```

Oletuksena kohde on `~/Documents/GitHub/valtion-analytiikka/`. Voit antaa
oman polun ja repo-nimen:
```bash
scripts/publish_to_pages.sh /polku/repo repo-nimi
```

Skripti:
- **rsync**aa lähderepon kohteeseen — `--delete` poistaa kohteesta
  tiedostot joita lähteessä ei enää ole
- **Sulkee pois** seuraavat polut:
  - `node_modules/`, `dist/`, `.vite/`, `scripts/.venv/`, `scripts/cache/`
  - `.git/`, `.github/`, `.claude/`, `specs/`
  - `CLAUDE.md`, `ClaudeCode_Prompts.md` — sisäisiä, ei julkaista
  - `scripts/publish_to_pages.sh` — itse skripti
- Varmistaa kohderepossa:
  - `.gitignore` (oikea minimimäärä)
  - `.nojekyll` (estää GitHub Pagesin Jekyll-käsittelyn)
  - `public/404.html` — SPA-fallback
  - `index.html`-päivitys SPA-decoderilla
  - `.github/workflows/deploy.yml` — build + deploy
  - `.github/workflows/data-refresh.yml` — viikoittainen data-päivitys
  - `README.md` julkaisurepoon

Skripti **ei** itse committoi eikä pushaa.

### 4. Committaa ja pushaa kohderepoon

```bash
cd ~/Documents/GitHub/valtion-analytiikka
git status                         # tarkista mitä muuttui
git add .
git commit -m "publish: <kuvaus>"
git push
```

GitHub Actions käynnistää `deploy.yml`:n automaattisesti kun `main`-branch
saa uuden commitin. Voit seurata Actions-välilehdeltä.

## Tarkistuslista uudesta julkaisusta

- [ ] `npm run build` menee läpi virheittä
- [ ] Lokaali `npm run preview` näyttää uuden sisällön oikein
- [ ] `scripts/publish_to_pages.sh` ajettu
- [ ] `git status` kohderepossa näyttää vain odotetut tiedostot
- [ ] **Ei mukana** `CLAUDE.md` tai `ClaudeCode_Prompts.md`
- [ ] **Ei mukana** `.claude/` tai `specs/`
- [ ] Commitin viesti kuvaa muutoksen
- [ ] Pushattu `main`:iin
- [ ] GitHub Actions: deploy.yml päättyy vihreällä
- [ ] Selaimessa <https://longshoreforrest.github.io/valtion-analytiikka/>
  näyttää uuden sisällön (cache-tyhjennys tarvittaessa: Cmd+Shift+R)

## Päivityspaketit (uutiset etusivulle)

Etusivun yläosassa oleva **Latest Updates Banner** lukee
`public/updates/index.json`:in ja näyttää sen ensimmäisen merkinnän.
Uuden uutisen lisääminen:

1. Luo kansio `public/updates/<YYYY-MM-slug>/`
2. Kirjoita `index.json` paketin metadatasta (slug, title, subtitle,
   event_date, published, category, highlights, pdfs, links,
   summary_path, sources_path, generated_at)
3. Kirjoita `summary.md` — pitkä tiivistelmä Markdownina
4. Kirjoita `sources.md` — lähdeviitteet
5. Lisää tai päivitä juurihakemiston `public/updates/index.json` siten,
   että uusi paketti on listan **ensimmäinen** (jolloin se näkyy
   bannerissa)
6. Käytä luokkaa `category`. Tunnetut: `kehysriihi`, `budjettiesitys`,
   `tilinpaatos`, `ominaisuus`, `muu`. Uudet luokat lisätään
   `CATEGORY_LABEL`-rakenteisiin tiedostoissa
   `src/pages/Updates.tsx` ja `src/components/LatestUpdatesBanner.tsx`.

> Esimerkkejä: `public/updates/2026-04-kehysriihi/`,
> `public/updates/2026-04-poliittinen-analysaattori/`.

## Automatisoitu data-päivitys

`.github/workflows/data-refresh.yml` ajaa joka maanantai klo 04:15 UTC:
- `build_data.py` — Parquet-data
- `fetch_pdfs.py` — VM:n PDF:t
- `extract_pdfs_to_md.py` — Markdown-versiot
- `fetch_updates.py` — päivityspaketit (kehysriihi yms.)

Jos data muuttui, workflow committoi muutokset `main`-branchiin, mikä
laukaisee `deploy.yml`:n uudelleen.

**Manuaalinen päivitys**: GitHub → Actions → "Refresh data weekly" →
Run workflow → tarvittaessa `refresh: true` pakottaa cachen ohittamisen.

## Vianetsintä

| Oire | Korjaus |
|---|---|
| `Kohdehakemistoa ei ole` | Luo se ensin: `git clone <url> ~/Documents/GitHub/valtion-analytiikka` |
| `public/data/budget.parquet puuttuu` | Aja `scripts/.venv/bin/python scripts/build_data.py` |
| `npm run build` epäonnistuu TypeScript-virheeseen | Korjaa virhe lähdekoodissa ennen kopiointia |
| Sivusto näyttää vanhaa sisältöä julkaisun jälkeen | Cmd+Shift+R selaimessa; tarkista Actions-välilehdeltä että deploy on päättynyt |
| Suora linkki `/paivitykset/...` antaa 404 julkaistulla sivustolla | Tarkista että `public/404.html` ja `index.html`:n SPA-decoder ovat kohderepossa (julkaisuskripti tekee nämä) |
| Data-refresh -workflow epäonnistuu | Katso Actionsin loki — yleensä syy on muuttunut endpoint VM/StatFin/Eurostat-puolella |
| `CLAUDE.md` näkyy julkaistussa repossa | Skriptin pitäisi sulkea pois — varmista että käytät tuoreinta `publish_to_pages.sh`-versiota; manuaalinen `rm` jos tarpeen |

## Mikä jää lähderepoon, mitä ei

| Tiedosto/kansio | Lähderepo | Kohderepo (julkaistaan) |
|---|---|---|
| `src/`, `public/`, `scripts/`, `docs/`, `index.html`, `package.json`, jne. | ✓ | ✓ |
| `CLAUDE.md` | ✓ | ✗ — sisäinen ohje agentille |
| `ClaudeCode_Prompts.md` | ✓ | ✗ — sisäinen lokitus |
| `specs/` | ✓ | ✗ — suunnittelumuistiot |
| `.claude/` | ✓ | ✗ — Claude Code -konfiguraatio |
| `scripts/publish_to_pages.sh` | ✓ | ✗ — käytetään vain lähdepuolella |
| `.github/workflows/` | (ei meillä) | ✓ — generoidaan julkaisuskriptissä |
| `node_modules/`, `dist/`, `scripts/.venv/`, `scripts/cache/` | (ohitetaan) | (ohitetaan) |

## Kysymyksiä?

Jos jokin vaihe ei toimi tai olet lisäämässä uutta julkaisukohdetta
(esim. Cloudflare Pages tai Netlify), tämän ohjeen pohjalta on luontevaa
laajentaa skripti tai luoda rinnakkainen julkaisuvaihtoehto.
