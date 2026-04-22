# Arkkitehtuuri

Tämä dokumentti kuvaa sovelluksen rakenteen ja komponenttien välisen
vuorovaikutuksen. Kohdeyleisö on kehittäjä, joka aikoo lisätä uuden
datalähteen, visualisoinnin tai näkymän.

## Yleiskuva

```
┌─────────────────────────────────┐
│            Selain                │
│                                  │
│  ┌────────────────────────────┐  │
│  │  React + React Router      │  │
│  │  ├── Layout                 │  │
│  │  ├── Overview (SQL-kyselyt) │  │
│  │  ├── Sources                │  │
│  │  ├── Methodology            │  │
│  │  └── About                  │  │
│  └──────────┬─────────────────┘  │
│             │ useQuery(...)      │
│  ┌──────────▼─────────────────┐  │
│  │  TanStack Query cache      │  │
│  └──────────┬─────────────────┘  │
│             │ query(sql)         │
│  ┌──────────▼─────────────────┐  │
│  │  DuckDB-Wasm (Web Worker)  │  │
│  │  VIEW budget ← Parquet/HTTP│  │
│  └──────────┬─────────────────┘  │
└─────────────┼────────────────────┘
              │ HTTP
              ▼
        /data/budget.parquet
        /data/build_meta.json
              ▲
              │ (pre-generated)
┌─────────────┴────────────────────┐
│   Python ETL (local)             │
│   scripts/build_data.py          │
│   ├── fetch VM CSV               │
│   ├── normalize                  │
│   └── write Parquet + meta       │
└──────────────────────────────────┘
```

## Kerrokset yksityiskohtaisesti

### 1. ETL (Python)
- **Tiedosto:** `scripts/build_data.py`
- **Vastuu:** Lataa raakadatan kaikista määritellyistä lähteistä, normalisoi
  yhteiseen skeemaan ja kirjoittaa Parquet-tiedoston sekä
  `build_meta.json`-metatiedoston.
- **Idempotenssi:** Raaka-CSV:t cachetetaan `scripts/cache/`-kansioon. Sama
  komento voidaan ajaa uudelleen ilman verkkoliikennettä. `--refresh`
  pakottaa uudelleenhaun.
- **Ulostulo:** `public/data/budget.parquet` (zstd) ja `build_meta.json`.

Ks. [`DATA-PIPELINE.md`](DATA-PIPELINE.md) tarkempi kuvaus.

### 2. Staattinen datakerros
- Vite palvelee `public/`-kansion sellaisenaan. Parquet-tiedostoa ei
  bundlata — DuckDB-Wasm lataa sen selaimessa HTTP:n yli.
- Tiedostot ovat versioitavia, joten tuotantoon julkaiseminen on
  push-and-deploy.

### 3. DuckDB-Wasm -moottori
- **Tiedosto:** `src/data/duckdb.ts`
- **Elinkaari:** Singleton — ensimmäinen kutsu `getConnection()`
  instantioi Web Workerin, lataa DuckDB-Wasm-bundlen jsDelivrin CDN:stä,
  rekisteröi Parquet-tiedoston HTTP-protokollan kautta ja luo näkymän
  `budget`. Seuraavat kutsut käyttävät samaa yhteyttä.
- **API:** `query<T>(sql): Promise<T[]>` — muuntaa Arrow-vastauksen
  tavallisiksi JS-objekteiksi ja konvertoi `bigint` → `number`.

### 4. TanStack Query
- **Tiedosto:** `src/main.tsx` (provider) + jokainen sivu.
- **Vastuu:** Cachettaa SQL-kyselyjen tulokset (oletuksena 1 h
  `staleTime`). Estää samanaikaiset samat kyselyt. Poistaa samasta
  näkymästä eri parametreilla tehtyjen kyselyjen manuaalisen
  orkestroinnin.

### 5. Visualisoinnit
- **Tiedostot:** `src/components/BudgetTreemap.tsx`, uusille
  visualisoinneille oma tiedosto.
- **Pino:** Observable Plot (korkeatasoiset merkinnät) + D3 (hierarkia-,
  layout- ja skaala-laskenta). Plot renderöi SVG:n, joka työnnetään
  React-refin kautta DOM:iin.
- **Lähdemerkintä:** Jokaisen visualisoinnin lopussa käytetään
  `<DataAttribution sourceId="..."/>`-komponenttia, joka linkittää
  `/lahteet#<id>`-anchoriin.

### 6. Tietolähteiden rekisteri
- **Tiedosto:** `src/data/sources.ts`
- Yksi taulukko (`SOURCES: DataSource[]`) kaikille käytetyille ja
  suunnitelluille datalähteille. Sisältää kuvauksen, URL:n, lisenssin,
  rajapinnan ja käyttökohteet. `/lahteet`-sivu ja `<DataAttribution>`
  lukevat tätä — uutta lähdettä lisätessäsi muokkaa vain tätä tiedostoa.

## Uuden datalähteen lisääminen

1. **Lähteen rekisteröinti** — lisää merkintä `src/data/sources.ts`
   -tiedoston `SOURCES`-taulukkoon. Status aluksi `"suunniteltu"` jos data
   ei vielä ole pipelinessä.

2. **ETL-laajennus** — `scripts/build_data.py` on tällä hetkellä
   VM-CSV-keskeinen. Kun lisäät uutta lähdettä:
   - Luo uusi Parquet-tiedosto omalla skeemallaan, esim.
     `public/data/realized.parquet`.
   - Lisää moduuli `scripts/pipelines/<name>.py` ja kutsu sitä
     päärutiinista.
   - Vaihtoehto: jos data täsmää samaan skeemaan (kuten toteutuma
     samoille momentteille), liitä samaan `budget.parquet`-tiedostoon
     erottavalla sarakkeella (esim. uusi arvo `dokumentti`-kenttään).

3. **DuckDB-rekisteröinti** — `src/data/duckdb.ts`: lisää
   `db.registerFileURL("<name>.parquet", ...)` ja vastaava
   `CREATE VIEW`.

4. **Visualisointi** — lisää sivu tai komponentti, jossa on kyselyt ja
   `<DataAttribution sourceId="<id>">`.

5. **Päivitä status** — kun näkymät ovat käytössä, muuta statuksi
   `"käytössä"` `sources.ts`-tiedostossa.

## Suorituskyky

- Parquet zstd:llä pakattuna — testiajo 5 vuoden datalla 30 kB.
- DuckDB-Wasm lataa Parquetin lazyna HTTP-rangeilla, joten alkuunkäynnistys
  on nopea vaikka tiedosto kasvaisi megoihin.
- TanStack Query: samoja SQL-kyselyjä ei ajeta kaksi kertaa saman session
  aikana.
- Jos datamäärä kasvaa satoihin MB:ihin: harkitse Parquet-tiedoston
  partitointia (esim. vuosittain) ja vain tarvittavan palasen lataamista.

## Selainkäyttöliittymä

- **Routing:** `react-router-dom`, client-side navigointi.
- **CSS:** käsinkirjoitettu `src/styles.css`, ei CSS-frameworkia. Teema
  tumma + ohkaiset rajat.
- **Tyylit:** Custom properties (`--bg`, `--fg`, …) juuressa. Vaihtelu
  helposti.

## Deploy-skenaariot

- **GitHub Pages:** `npm run build` → push `dist/`-kansio gh-pages-haaraan
  (tai käytä GitHub Actions). Aseta Vitelle `base: "/<repo>/"` tarvittaessa.
- **Netlify / Cloudflare Pages / Vercel:** build-komento `npm run build`,
  publish-kansio `dist`.
- **Omahostaus:** `npm run build` ja kopioi `dist/` staattiselle
  web-palvelimelle. Muista että `.parquet` vaatii
  `application/octet-stream` Content-Typen (useimmat palvelimet tekevät
  tämän oikein).
