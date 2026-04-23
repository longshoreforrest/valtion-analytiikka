import { useMemo, useState, useEffect, useRef } from "react";
import { useSearch } from "../data/search";

/**
 * Yhdistetty opas: käyttöohje + metodologia + tietoja + hakutoiminto
 * sisällysluettelolla. Kaikki osiot ovat yhdellä pitkällä sivulla, jolloin
 * Command-F ja globaali haku toimivat luonnollisesti. Vasemmalle ankkuroituu
 * sisällysluettelo joka korostaa nykyisen osion.
 */

interface Section {
  id: string;
  title: string;
  subsections?: Array<{ id: string; title: string }>;
  /** Renderöi osiota. Sisältää tekstin jolle haku voi osua. */
  render: () => JSX.Element;
}

const SECTIONS: Section[] = [
  {
    id: "miksi",
    title: "Miksi tämä sovellus rakennettiin",
    render: () => (
      <>
        <p style={{ fontSize: 15 }}>
          <b>Why this application was built.</b>
        </p>
        <p>
          Haluan valjastaa <b>agenttisen tekoälyn</b> Suomen valtion talouden
          analysointiin ja <b>tuottavuushyötyjen tunnistamiseen</b>. Julkinen talous
          on iso, hidas ja vaikeasti luettava — silti siinä piilee valtavasti
          mahdollisuuksia, jotka jäävät huomaamatta, koska kukaan ei ehdi koota
          kokonaiskuvaa rivitasoisesta talousarviosta, toteutumasta, ennusteista ja
          kansainvälisistä vertailuista yhdessä paikassa.
        </p>
        <p>
          Tämä sovellus on <b>tutkimusalusta</b> sille kysymykselle: kun
          agenttinen AI rakentaa kokonaisen analytiikkasovelluksen parissa päivässä
          ja lataa sisään kymmeniä tuhansia budjettirivejä, kehyslukuja ja
          EU-vertailudataa, mitä kaikkea ihmisen on yhtäkkiä mahdollista kysyä ja
          tarkistaa? Mitkä <b>politiikkatoimet</b> ovat todellisuudessa
          vaikuttaneet mihinkin menoluokkaan? Missä on ilmeisiä{" "}
          <b>tuottavuusloikkia</b>, joita datasta voi lukea? Mitkä lupaukset ja
          tavoitteet näkyvät numeroissa, mitkä eivät?
        </p>
        <p>
          Sovellus ei anna valmiita vastauksia vaan rakentaa{" "}
          <b>avoimesti jäljitettävän pohjan</b>: kaikki data tulee
          avoimista lähteistä (VM, Valtiokonttori, Tilastokeskus, Eurostat, Valto),
          kaikki laskennat ajetaan selaimessa DuckDB-Wasm:lla eli sama käyttäjä näkee
          saman tuloksen, ja jokainen visualisointi viittaa tarkkaan lähteeseensä.
          Näin sekä ihminen että AI-agentti voivat käyttää samaa pohjaa
          väittämiensä tueksi tai kyseenalaistamiseksi.
        </p>
        <p>
          Pidän kehitystä jatkuvana kokeiluna: mikä toimii, mikä ei, mistä löytyy
          uutta oivallusta. Palautetta ja yhteistyöehdotuksia ottaa mielellään
          vastaan —{" "}
          <a href="https://www.linkedin.com/in/tapio-pitkaranta/" target="_blank" rel="noreferrer">
            tekijä LinkedInissä
          </a>.
        </p>
      </>
    ),
  },
  {
    id: "pikaopas",
    title: "Pikaopas",
    render: () => (
      <>
        <p>
          Valtion Budjetti -sovellus on selainpohjainen analytiikkatyökalu Suomen valtion
          talousarviolle ja laajemmin julkiselle taloudelle. Kaikki laskenta tapahtuu
          selaimessa DuckDB-Wasm:lla; palvelinta ei ole.
        </p>
        <ol className="clean">
          <li>
            <b>Aloita Yleiskuvasta.</b> Treemap-laatikon tai taulukkorivin "Avaa →"
            klikkaus porautuu: <i>pääluokka → luku → momentti → aikasarja</i>.
          </li>
          <li>
            <b>Käytä yläpalkin hakua.</b> Rajaa kaikilla sivuilla reaaliajassa. Osumat
            korostetaan keltaisella.
          </li>
          <li>
            <b>Julkinen talous</b> näyttää valtio + kunnat + sosiaaliturvarahastot
            samaan aikaan (EDP-velka 1975→, COFOG 1990→).
          </li>
          <li>
            <b>Vuosivertailu</b> nostaa suurimmat muutokset. Pylväät / hajonta /
            muutospylväät, drill-down taulukosta.
          </li>
          <li>
            <b>Taulukko</b> → rivitasoinen haku + suodatus + <b>Excel-vienti</b>.
          </li>
          <li>
            <b>Dokumentit</b> → PDF-julkaisut avautuvat iframena, ja jokaisesta on
            kaunis markdown-versio — haku osuu myös dokumenttien sisältöön.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "nakymat",
    title: "Näkymäkohtainen opas",
    subsections: [
      { id: "yleiskuva", title: "Yleiskuva" },
      { id: "julkinen-talous", title: "Julkinen talous" },
      { id: "vertailu", title: "Vuosivertailu" },
      { id: "taulukko", title: "Taulukko" },
      { id: "tiivistelma", title: "Tiivistelmä" },
      { id: "dokumentit", title: "Dokumentit" },
      { id: "lahteet", title: "Tietolähteet" },
    ],
    render: () => (
      <>
        <h3 id="yleiskuva">Yleiskuva</h3>
        <p>
          Porautuva treemap jossa jokainen laatikko on hallinnonala (pääluokka); pinta-ala
          vastaa määrärahaa. Klikkaus → luvut kyseisessä pääluokassa → momentit kyseisessä
          luvussa → yksittäisen momentin <b>aikasarja</b> jossa vertaillaan
          hallituksen esitystä, VM:n ehdotusta ja eduskunnan kirjelmää.
        </p>
        <p>
          <b>Hierarkian minimap</b> (breadcrumbin alla) näyttää koko rakenteen
          pienenä: pääluokat vaakarivinä, valitun alla luvut, sen alla momentit.
          Hover = tooltip, klikkaus = siirrä polun eri haaraan.
        </p>

        <h3 id="julkinen-talous">Julkinen talous</h3>
        <p>
          Koko julkisen sektorin näkymä Tilastokeskuksen kansantalouden tilinpidosta.
          Sektorivalitsin: koko julkinen (S13), valtio (S1311), paikallishallinto (S1313),
          hyvinvointialueet (S13132), sosiaaliturvarahastot (S1314). Yksikkö: miljoonaa €
          tai % BKT:sta.
        </p>
        <p>Näkymä sisältää viisi visualisointia:</p>
        <ul className="clean">
          <li>EDP-velka ja alijäämä, 1975→</li>
          <li>COFOG-pääluokat viimeisimpänä vuonna (10 tehtäväluokkaa)</li>
          <li>COFOG pinottuna aikasarjana 1990→</li>
          <li>Neljännesvuosittaiset tulot ja menot 1999Q1→</li>
          <li>EU-vertailu (kun Eurostat-data on ladattu)</li>
        </ul>

        <h3 id="vertailu">Vuosivertailu</h3>
        <p>
          Valitse 2+ vuotta chip-napeista. Suurimmat muutokset nousevat kärkeen.
          Kolme visualisointia: <b>rinnakkaiset pylväät</b> (trendi), <b>muutospylväät</b>
          (suurin kasvu vs. lasku, värit vihreä/punainen), <b>hajontakuvio</b>
          (45°:een viivalta etäällä olevat pisteet muuttuneet eniten).
        </p>
        <p>
          Klikkaa taulukossa "Avaa →" porautuaksesi: hallinnonala → luku → momentti.
          Breadcrumb näyttää polun ja mahdollistaa palaamisen.
        </p>

        <h3 id="taulukko">Taulukko</h3>
        <p>
          Kaikki 16 000+ talousarviorivit. Chip-filtterit: vuosi, dokumenttityyppi,
          pääluokka. Minimisummakenttä. Lajittelu jokaisesta sarakkeesta. Sivutus
          200 riviä/sivu.
        </p>
        <p>
          Oikeassa yläkulmassa vihreä <b>Vie Excel</b> -nappi Excel-kuvakkeella. Vie
          kaikki suodatetut rivit (ei vain sivun), muotoiltuna XLSX-tiedostoon
          sarakeleveyksien kanssa.
        </p>

        <h3 id="tiivistelma">Tiivistelmä</h3>
        <p>
          Data datasta. Rivien ja sarakkeiden määrät, NULL-osuudet, uniikkien
          momenttien lukumäärä, dokumenttityyppien jakauma, top-10 suurimmat
          yksittäiset momentit, rivit vuosittain ja hallinnonaloittain, lähdematriisi.
        </p>

        <h3 id="dokumentit">Dokumentit</h3>
        <p>
          Valtiovarainministeriön ja valtioneuvoston viralliset talousarvio-julkaisut
          PDF-muodossa. Avautuvat sovelluksen sisällä iframena. Jokaisesta on myös
          <b> markdown-versio</b>, joka renderöidään kauniisti — tätä käytetään myös
          hakuun, joten kirjoitettu sana löytyy vaikka se olisi sivulla 47.
        </p>
        <p>
          Kaksi ikonipainiketta per rivi: <b>PDF</b> (punaisella) ja <b>MD</b>
          (violetilla). Valitulla dokumentilla tab-kytkin PDF/Markdown.
        </p>

        <h3 id="lahteet">Tietolähteet</h3>
        <p>
          Kaikki sovelluksen datalähteet yhdessä listassa. Rivi on tiiviissä
          yhteenvedossa; klikkaus avaa koko kuvauksen. Chip-filtterit tyypille (Budjetti,
          Tilasto, EU-vertailu jne.) ja statukselle (käytössä, suunniteltu, kokeellinen).
        </p>
        <p>
          Suunniteltujen lähteiden paneli näyttää <b>toteutusehdotuksen</b>,{" "}
          <b>mitä tarvitsen sinulta</b> ja <b>työarvion</b>. Vihreä tausta =
          voin tehdä itsenäisesti; keltainen = tarvitsen päätöksen tai selvitystä.
        </p>
      </>
    ),
  },
  {
    id: "globaalit",
    title: "Sovelluksen yleiset ominaisuudet",
    subsections: [
      { id: "haku", title: "Avoin tekstihaku" },
      { id: "drill", title: "Drill-down ja breadcrumb" },
      { id: "attribuutiot", title: "Lähdemerkinnät" },
      { id: "responsiivisuus", title: "Vaalea moderni ulkoasu" },
    ],
    render: () => (
      <>
        <h3 id="haku">Avoin tekstihaku</h3>
        <p>
          Yläpalkin <code>⌕</code>-kenttä suodattaa kaikilla sivuilla. Osumat{" "}
          <span className="highlight">keltaisella</span>. Tyhjennä <code>×</code>-napilla.
          Osuu seuraaviin kenttiin näkymäkohtaisesti:
        </p>
        <ul className="clean">
          <li>Yleiskuva: treemap-solut + taulukkorivit</li>
          <li>Julkinen talous: COFOG-tehtäväluokat + taloustoimet</li>
          <li>Vuosivertailu: pylväät + taulukko</li>
          <li>Taulukko: yhdistyy muihin suodattimiin</li>
          <li>Tietolähteet: nimi, kuvaus, rajapinta</li>
          <li>Dokumentit: otsikko, tiivistelmä, JA PDF-tekstin sisältö (~8 kB excerpt)</li>
        </ul>

        <h3 id="drill">Drill-down ja breadcrumb</h3>
        <p>
          Yleiskuva ja Vuosivertailu tukevat syventävää navigointia: <i>pääluokka → luku
          → momentti</i>. Polku näkyy breadcrumbissa (klikattavissa aiemmasta palatakseen)
          ja Yleiskuvan hierarkian minimapissa graafisesti.
        </p>

        <h3 id="attribuutiot">Lähdemerkinnät</h3>
        <p>
          Jokaisen visualisoinnin alla pieni "Lähde: {"{nimi}"}" — klikkaus vie{" "}
          <a href="/lahteet">Tietolähteet</a>-sivun oikeaan ankkuriin. Kaikki laskennat
          ovat siis jäljitettäviä alkuperäiseen avoimen datan lähteeseen.
        </p>

        <h3 id="responsiivisuus">Vaalea moderni ulkoasu</h3>
        <p>
          Valkoiset paneelit pehmeillä varjoilla, indigo-purppura aksentti,
          Inter-tyyppinen typografia, gradient-otsikot. Responsiivinen: alle 960 px
          leveydellä yläpalkki rivittyy ja ruudukot muuttuvat yksisarakkeisiksi.
        </p>
      </>
    ),
  },
  {
    id: "arkkitehtuuri",
    title: "Arkkitehtuuri",
    render: () => (
      <>
        <p>
          Kolmikerroksinen: <b>Python ETL</b> → <b>staattinen Parquet</b> →{" "}
          <b>selain DuckDB-Wasm</b>. Ei omaa backendiä, julkaisu mihin tahansa
          staattiseen hostiin (GitHub Pages, Netlify, Cloudflare Pages).
        </p>
        <pre>{`┌──────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  VM / Valtiokonttori │     │ Python ETL           │     │ Selain          │
│  StatFin / Eurostat  │ ──▶ │ scripts/build_data.py│ ──▶ │ DuckDB-Wasm     │
│  Valto (PDF)         │     │  → Parquet + meta    │     │  ← React + Plot │
└──────────────────────┘     └──────────────────────┘     └─────────────────┘`}</pre>

        <h3>Teknologiat</h3>
        <ul className="clean">
          <li><b>Frontend</b>: Vite + React 18 + TypeScript 5</li>
          <li><b>Analytiikka</b>: DuckDB-Wasm (Web Worker, SQL selaimessa)</li>
          <li><b>Visualisointi</b>: Observable Plot + D3</li>
          <li><b>State</b>: TanStack Query, React Context hakua varten</li>
          <li><b>Reititys</b>: react-router-dom</li>
          <li><b>ETL</b>: Python 3.10+, PyArrow, pdfplumber</li>
          <li><b>Excel-vienti</b>: SheetJS/xlsx (dynaaminen import)</li>
          <li><b>Markdown</b>: react-markdown + remark-gfm</li>
        </ul>
      </>
    ),
  },
  {
    id: "tietomalli",
    title: "Tietomalli",
    subsections: [
      { id: "budget-schema", title: "budget (VM:n talousarvio)" },
      { id: "pf-schema", title: "public_finance (StatFin)" },
      { id: "eu-schema", title: "eurostat_cofog (EU-vertailu)" },
    ],
    render: () => (
      <>
        <h3 id="budget-schema">Taulukko: budget</h3>
        <p>
          Yksi rivi per momentti per vuosi per dokumenttityyppi. Kattaa
          talousarvioesitykset 2014–2026 kolmessa versiossa (hallituksen esitys,
          VM:n ehdotus, eduskunnan kirjelmä).
        </p>
        <table className="data">
          <thead><tr><th>Sarake</th><th>Tyyppi</th><th>Kuvaus</th></tr></thead>
          <tbody>
            <tr><td><code>vuosi</code></td><td>INT32</td><td>Budjettivuosi</td></tr>
            <tr><td><code>dokumentti</code></td><td>VARCHAR</td><td>Hallituksen esitys / VM:n ehdotus / Eduskunnan kirjelmä</td></tr>
            <tr><td><code>paaluokka_num</code></td><td>INT32</td><td>Hallinnonalan numero 21–36</td></tr>
            <tr><td><code>paaluokka_nimi</code></td><td>VARCHAR</td><td>Hallinnonalan nimi</td></tr>
            <tr><td><code>luku_num</code></td><td>VARCHAR</td><td>Luvun numero pääluokan sisällä</td></tr>
            <tr><td><code>luku_nimi</code></td><td>VARCHAR</td><td>Luvun nimi</td></tr>
            <tr><td><code>momentti_num</code></td><td>VARCHAR</td><td>Momentin numero</td></tr>
            <tr><td><code>momentti_nimi</code></td><td>VARCHAR</td><td>Momentin nimi</td></tr>
            <tr><td><code>info</code></td><td>VARCHAR</td><td>Momentin info-osa (päätösosan lisätiedot)</td></tr>
            <tr><td><code>maararaha_eur</code></td><td>INT64</td><td>Määräraha (€)</td></tr>
            <tr><td><code>toteutuma_edellinen_eur</code></td><td>INT64</td><td>Toteutuma edell. vuodelta (€)</td></tr>
          </tbody>
        </table>

        <h3 id="pf-schema">Taulukko: public_finance</h3>
        <p>
          StatFin-pohjainen julkisen talouden koostepituus. Sisältää EDP-velan/alijäämän
          (jali), COFOG-menot (jmete) ja neljännesvuosittaiset tulot/menot (jtume).
        </p>
        <table className="data">
          <thead><tr><th>Sarake</th><th>Tyyppi</th><th>Kuvaus</th></tr></thead>
          <tbody>
            <tr><td><code>lahde_taulu</code></td><td>VARCHAR</td><td>jali_122g / jmete_12a6 / jtume_11zf</td></tr>
            <tr><td><code>vuosi</code></td><td>INT32</td><td>Vuosi (kvartaalille myös)</td></tr>
            <tr><td><code>neljannes</code></td><td>VARCHAR</td><td>Q1/Q2/Q3/Q4 tai NULL vuosiaineistossa</td></tr>
            <tr><td><code>sektori_koodi</code></td><td>VARCHAR</td><td>S13 / S1311 / S1313 / S1314 + alasektorit</td></tr>
            <tr><td><code>tehtava_koodi</code></td><td>VARCHAR</td><td>COFOG G01..G10 (jmete)</td></tr>
            <tr><td><code>taloustoimi_koodi</code></td><td>VARCHAR</td><td>OTEU, OTRU, B9 jne.</td></tr>
            <tr><td><code>yksikko</code></td><td>VARCHAR</td><td>milj_eur / osuus_bkt_pct / eur_per_asukas / pct</td></tr>
            <tr><td><code>arvo</code></td><td>DOUBLE</td><td>Numeerinen arvo</td></tr>
          </tbody>
        </table>

        <h3 id="eu-schema">Taulukko: eurostat_cofog</h3>
        <p>
          EU-vertailu COFOG-tehtäväluokittain. 13 maata × 14 vuotta × 11 COFOG-luokkaa
          × 2 yksikköä.
        </p>
        <table className="data">
          <thead><tr><th>Sarake</th><th>Tyyppi</th><th>Kuvaus</th></tr></thead>
          <tbody>
            <tr><td><code>vuosi</code></td><td>INT32</td><td>2010–2023</td></tr>
            <tr><td><code>maa_koodi</code></td><td>VARCHAR</td><td>FI, SE, DK, EU27_2020, DE…</td></tr>
            <tr><td><code>maa_nimi</code></td><td>VARCHAR</td><td>Maan nimi suomeksi</td></tr>
            <tr><td><code>cofog_koodi</code></td><td>VARCHAR</td><td>TOTAL, GF01..GF10</td></tr>
            <tr><td><code>cofog_nimi</code></td><td>VARCHAR</td><td>COFOG-luokan nimi</td></tr>
            <tr><td><code>yksikko</code></td><td>VARCHAR</td><td>osuus_bkt_pct / eur_per_asukas</td></tr>
            <tr><td><code>arvo</code></td><td>DOUBLE</td><td>Prosentti tai euro/asukas</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "etl",
    title: "ETL ja datan päivittäminen",
    render: () => (
      <>
        <p>
          Data kootaan kahdesta Python-pipelinestä. Molemmat cachettavat lataukset
          paikallisesti (<code>scripts/cache/</code>), joten uudelleenajo on nopea.
        </p>

        <h3>Komennot</h3>
        <pre>{`# Kerran: virtuaaliympäristön asennus
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt pdfplumber

# Data (VM + StatFin + Eurostat)
scripts/.venv/bin/python scripts/build_data.py
# --refresh: pakota uudelleenlataus
# --skip-vm / --skip-statfin / --skip-eurostat: rajaa yhteen osaan

# PDF-lataus ja MD-purkaminen
scripts/.venv/bin/python scripts/fetch_pdfs.py
scripts/.venv/bin/python scripts/extract_pdfs_to_md.py

# Dev-serveri
npm run dev

# Tuotantobuildi
npm run build`}</pre>

        <h3>Tulostiedostot</h3>
        <ul className="clean">
          <li><code>public/data/budget.parquet</code> + <code>build_meta.json</code></li>
          <li><code>public/data/public_finance.parquet</code> + meta</li>
          <li><code>public/data/eurostat_cofog.parquet</code> + meta</li>
          <li><code>public/pdfs/*.pdf</code> + <code>*.md</code> + <code>index.json</code></li>
        </ul>
      </>
    ),
  },
  {
    id: "ongelmat",
    title: "Ongelmatilanteet",
    render: () => (
      <>
        <dl className="kv">
          <dt>"Datan lataus epäonnistui"</dt>
          <dd>Parquet puuttuu. Aja <code>npm run data</code> tai pipeline käsin.</dd>

          <dt>"Failed to construct Worker"</dt>
          <dd>Tarkista että ajat localhost:5173:ssa (ei <code>file://</code>).</dd>

          <dt>PDF ei aukea iframessa</dt>
          <dd>Käytä "Avaa uudessa välilehdessä ↗".</dd>

          <dt>Treemap tyhjä</dt>
          <dd>Hakusana rajaa kaiken pois — tyhjennä × -napilla.</dd>

          <dt>VM saa 503-virheen</dt>
          <dd>VM:n palvelin ruuhkassa — pipelinessä on retry (4× exponentiaalisella
              backoffilla). Odota hetki ja aja uudestaan; cache säilyttää jo ladatut.</dd>

          <dt>Valtiokonttorin API palauttaa 404</dt>
          <dd>API-portaali uudistunut; endpoint-polut eivät vastaa dokumentoitua.
              Lähteet <code>valtiokonttori-*</code> merkitty "vaatii selvitystä"-
              tilaan — yhteys Valtiokonttoriin tarvitaan oikean polun varmistamiseksi.</dd>
        </dl>
      </>
    ),
  },
  {
    id: "suunnitelma",
    title: "Jatkokehitys",
    render: () => (
      <>
        <p>
          <a href="/lahteet">Tietolähteet</a>-sivulla on täsmällinen arvio
          jokaisesta suunnitellusta lähteestä (työarvio, mitä tarvitsen sinulta).
          Lähimpänä toteutusta:
        </p>
        <ul className="clean">
          <li>
            <b>Tutkihankintoja.fi</b> ostolaskut (aggregaatit) — 3–6 h,
            vaatii päätöksen aggregaatti vs. rivitaso
          </li>
          <li>
            <b>Eduskunnan HE-PDF:t</b> — koko teos -julkaisut
            eduskunta.fi:sta talousarvioesityksistä
          </li>
          <li>
            <b>Kela Kelasto</b> etuuksien maksut — 4–8 h, vaatii
            selvitystä mitkä etuudet kiinnostavat
          </li>
          <li>
            <b>Valtiokonttorin API:t</b> (talous + velka) — vaatii selvityksen
            oikeista endpointeista (nykyiset palauttavat 404)
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "lisenssi",
    title: "Lisenssi ja lähteet",
    render: () => (
      <>
        <p>
          Sovelluksen lähdekoodi on vapaasti käytettävissä. Datan lisenssit
          määräytyvät lähteen mukaan; ks. <a href="/lahteet">Tietolähteet</a>.
          Pääasialliset lähteet (VM, Tilastokeskus, Valtiokonttori, Eurostat)
          käyttävät <b>CC BY 4.0</b> -lisenssiä joka edellyttää lähteen mainitsemista.
          Jokainen visualisointi tekee tämän automaattisesti.
        </p>
        <p>
          Sovellus käyttää seuraavia ulkopuolisia kirjastoja: React, DuckDB-Wasm,
          Observable Plot, D3, TanStack Query, react-markdown, xlsx (SheetJS),
          react-router-dom. ETL-puolella PyArrow ja pdfplumber.
        </p>
      </>
    ),
  },
];

export default function Opas() {
  const { query, matches } = useSearch();
  const [active, setActive] = useState<string>("pikaopas");
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scrollWatcher, setScrollWatcher] = useState(0);

  // Suodatus hakusanan mukaan: osio näkyy jos sen title tai sisältöstring osuu.
  const visibleSections = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    const q = query.toLowerCase();
    return SECTIONS.filter((s) => {
      if (matches(s.title)) return true;
      if (s.subsections?.some((sub) => matches(sub.title))) return true;
      // Renderöidään osio merkkijonoksi ja tarkistetaan
      const el = refs.current[s.id];
      if (el && el.innerText.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, matches, scrollWatcher]);

  // Scroll-spy: aktiivinen osio päivittyy sen mukaan mikä on nähtävissä
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // valitse se, jonka top on lähimpänä viewportin yläosaa
          visible.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
          setActive((visible[0].target as HTMLElement).id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );
    Object.values(refs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // Lasketaan visibleSections uudestaan myös kun skrolataan (rendereistä riippuvainen refs)
  useEffect(() => {
    const h = () => setScrollWatcher((n) => n + 1);
    const t = setTimeout(h, 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="opas-grid">
      <aside className="opas-toc">
        <div className="opas-toc-title">Sisältö</div>
        <ul>
          {SECTIONS.map((s) => {
            const hidden = query.trim() && !visibleSections.includes(s);
            return (
              <li key={s.id} style={{ opacity: hidden ? 0.35 : 1 }}>
                <a
                  href={`#${s.id}`}
                  className={active === s.id ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    refs.current[s.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setActive(s.id);
                  }}
                >
                  {s.title}
                </a>
                {s.subsections ? (
                  <ul>
                    {s.subsections.map((sub) => (
                      <li key={sub.id}>
                        <a href={`#${sub.id}`}>{sub.title}</a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="opas-content">
        <div className="hero" style={{ marginBottom: 20 }}>
          <h1>Opas</h1>
          <p className="lede">
            Koko sovelluksen dokumentaatio yhdellä sivulla: käyttöohje, metodologia,
            tietomalli ja tekniset valinnat. Käytä yläpalkin hakua — osumat
            korostetaan ja osiot joissa ei ole osumaa himmenevät sisällysluettelossa.
          </p>
        </div>

        {query.trim() && visibleSections.length === 0 ? (
          <div className="callout">Ei osumia hakusanalla "{query}".</div>
        ) : null}

        {SECTIONS.map((s) => {
          const hidden = query.trim() && !visibleSections.includes(s);
          if (hidden) return null;
          return (
            <section
              key={s.id}
              id={s.id}
              ref={(el) => { refs.current[s.id] = el as HTMLDivElement | null; }}
              className="panel opas-section"
            >
              <h2 style={{ marginTop: 0 }}>{s.title}</h2>
              {s.render()}
            </section>
          );
        })}
      </div>
    </div>
  );
}
