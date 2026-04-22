# valtion-analytiikka

Suomen valtion budjetin analytiikkasovellus GitHub Pagesilla.

> **Huom:** Tämän repon sisältö generoidaan lähdereposta julkaisuskriptillä.
> Älä muokkaa täällä olevaa koodia suoraan — muutokset hukkuvat seuraavaan
> julkaisuun. Kehitys tapahtuu lähderepossa.

## Julkaisu

- **Sivusto**: https://<käyttäjä>.github.io/valtion-analytiikka/
- **Deploy**: `main`-branchiin pushaus ajaa `.github/workflows/deploy.yml` ja julkaisee sivuston.
- **Data-päivitys**: `.github/workflows/data-refresh.yml` ajaa ETL-pipelinen joka maanantai ja committaa muuttuneet Parquet/PDF/MD-tiedostot.

## Ensimmäinen käyttöönotto

1. Luo repo GitHubiin (`valtion-analytiikka`) ja lisää remote:
   ```bash
   git remote add origin https://github.com/<käyttäjä>/valtion-analytiikka.git
   ```
2. Ensimmäinen commit:
   ```bash
   git add .
   git commit -m "initial commit"
   git branch -M main
   git push -u origin main
   ```
3. GitHubissa: **Settings → Pages → Source: GitHub Actions**.
4. Odota deploy-workflow:n valmistumista (Actions-välilehti).

## Paikallinen ajo

```bash
npm ci
npm run dev           # avaa http://localhost:5173
npm run build         # tuotantopaketti dist/-kansioon
```

## Data uudelleen paikallisesti

```bash
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt pdfplumber
scripts/.venv/bin/python scripts/build_data.py
scripts/.venv/bin/python scripts/fetch_pdfs.py
scripts/.venv/bin/python scripts/extract_pdfs_to_md.py
```

## Mitä generoidaan julkaisuskriptissä

- `public/404.html` — SPA-reititysfallback
- `.github/workflows/*.yml` — deploy + data-refresh
- `.nojekyll` — estää Jekyll-käsittelyn
- `.gitignore`, `README.md`

`index.html`:iin lisätään SPA-decoder joka muuntaa ?p=... -parametrin polkutakaisin.
