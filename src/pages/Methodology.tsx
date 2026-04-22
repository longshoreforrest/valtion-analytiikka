export default function Methodology() {
  return (
    <>
      <h1>Metodologia</h1>
      <p className="lede">
        Näkymä siihen, miten raakadata muuttuu visualisoinneiksi. Tavoite on, että jokainen
        luku voidaan jäljittää alkuperäiseen lähteeseen ja kyselylauseeseen asti.
      </p>

      <h2>Kerrokset</h2>
      <ol className="clean">
        <li>
          <b>Haku.</b> Python-skripti <code>scripts/build_data.py</code> lataa
          valtion talousarvioesitysten CSV-tiedostot suoraan VM:n avoimesta datasta
          (<a href="https://budjetti.vm.fi/opendata/">budjetti.vm.fi/opendata/</a>).
          Raaka CSV cachetetaan paikallisesti, joten ajoja voi toistaa ilman verkkokutsuja.
        </li>
        <li>
          <b>Normalisointi.</b> CSV:t yhdistetään yhteiseen skeemaan:
          (vuosi, dokumentti, pääluokan numero/nimi, luvun numero/nimi, momentin numero/nimi,
          info-osa, määräraha €, aiemmin budjetoitu €, toteutuma edelliseltä vuodelta,
          toteutuma kaksi vuotta sitten). Merkkien koodaus muunnetaan
          Windows-1252 → UTF-8.
        </li>
        <li>
          <b>Tallennus.</b> Normalisoitu aineisto kirjoitetaan Parquet-muodossa
          tiedostoon <code>public/data/budget.parquet</code> (zstd-pakkaus).
          Rinnalle syntyy <code>public/data/build_meta.json</code>,
          joka dokumentoi mitä ladattiin ja milloin.
        </li>
        <li>
          <b>Selainajo.</b> Vite-frontend lataa Parquetin staattisena tiedostona.
          DuckDB-Wasm kääritään Web Workeriin ja tiedosto mountataan DuckDB:n
          virtuaalitiedostojärjestelmään HTTP-protokollan kautta, jolloin siihen voi tehdä
          SQL-kyselyitä suoraan selaimessa ilman backendiä.
        </li>
        <li>
          <b>Visualisointi.</b> Komponentit (esim. treemap) tilaavat oman SQL-kyselynsä
          <code> TanStack Query</code>-cachen kautta. Vastaukset muutetaan
          JavaScript-objekteiksi ja annetaan Observable Plot / D3 -visualisoinneille.
        </li>
      </ol>

      <h2>Tietomalli</h2>
      <p>
        Parquet-taulu (DuckDB-näkymänä <code>budget</code>) sisältää yhden rivin per
        talousarvion momentti per vuosi per dokumenttityyppi. Sarakkeet:
      </p>
      <table className="data">
        <thead>
          <tr>
            <th>Sarake</th>
            <th>Tyyppi</th>
            <th>Kuvaus</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["vuosi", "INT32", "Budjettivuosi (esim. 2026)"],
            ["dokumentti", "VARCHAR", "Dokumenttityyppi: Hallituksen esitys, VM:n ehdotus, Eduskunnan kirjelmä"],
            ["paaluokka_num", "INT32", "Hallinnonalan numero (21–36)"],
            ["paaluokka_nimi", "VARCHAR", "Hallinnonalan nimi"],
            ["luku_num", "VARCHAR", "Luvun numero pääluokan sisällä"],
            ["luku_nimi", "VARCHAR", "Luvun kuvaus"],
            ["momentti_num", "VARCHAR", "Momentin numero luvun sisällä"],
            ["momentti_nimi", "VARCHAR", "Momentin kuvaus"],
            ["info", "VARCHAR", "Momentin info-osa (päätösosan lisätiedot)"],
            ["maararaha_eur", "INT64", "Kuluvan vuoden määräraha (€)"],
            ["aiemmin_budjetoitu_eur", "INT64", "Lisätalousarvioissa budjetoitu summa (€)"],
            ["toteutuma_edellinen_eur", "INT64", "Toteutuma edellisenä vuonna (€)"],
            ["toteutuma_kaksi_vuotta_sitten_eur", "INT64", "Toteutuma kaksi vuotta sitten (€)"],
          ].map(([n, t, k]) => (
            <tr key={n}>
              <td><code>{n}</code></td>
              <td><code>{t}</code></td>
              <td>{k}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Tärkeät rajoitukset</h2>
      <ul className="clean">
        <li>
          <b>Vain esitys, ei vielä toteutuma.</b> Ensimmäinen iteraatio käyttää hallituksen
          esityksen numeroita. Toteutumatiedot ladataan seuraavassa vaiheessa Valtiokonttorin
          API:sta (tunnus <code>valtiokonttori-talous</code>).
        </li>
        <li>
          <b>Hallinnonalajaon muutokset.</b> Pääluokkien jaottelu on muuttunut vuosien
          aikana (esim. hyvinvointialueiden synty 2023 muutti sote-menojen reitin). Tätä
          ei vielä harmonisoida, joten pitkän aikavälin vertailuissa yksittäisiä hallinnonaloja
          kannattaa tarkastella varoen.
        </li>
        <li>
          <b>Nimelliseurot.</b> Kaikki luvut ovat nimellisarvoja. Reaali-euron vertailu
          tulee lisäyksenä julkisten menojen hintaindeksin (Tilastokeskus) kautta.
        </li>
        <li>
          <b>Lisätalousarviot.</b> Sarake <code>aiemmin_budjetoitu_eur</code> sisältää
          yhteenvedon lisätalousarvioista; tämän normalisointi tarkentuu myöhemmin.
        </li>
      </ul>

      <h2>Arkkitehtuuri</h2>
      <pre>{`Python pipeline (scripts/build_data.py)
    │
    ├─ lataa CSV:t:  https://budjetti.vm.fi/indox/opendata/...
    ├─ normalisoi:   utf-8, yhtenäinen skeema
    ├─ cache:        scripts/cache/*.csv
    └─ kirjoittaa:   public/data/budget.parquet + build_meta.json

Selain (Vite + React)
    │
    ├─ DuckDB-Wasm (Web Worker)
    │     └─ CREATE VIEW budget AS SELECT * FROM read_parquet('budget.parquet')
    │
    ├─ TanStack Query   — cache SQL-kyselyille
    ├─ Observable Plot  — visualisoinnit
    └─ react-router-dom — sivujen reititys`}</pre>

      <h2>Jäljitettävyys</h2>
      <p>
        Jokainen visualisointi liittää alleen <code>DataAttribution</code>-komponentin,
        joka näyttää lähteen nimen ja linkin <a href="/lahteet">Tietolähteet</a>-sivulle.
        Parquet-tiedoston rinnalle tallennetaan <code>build_meta.json</code>, joka sisältää
        tarkan listan ladatuista URL-osoitteista ja aikaleiman — näin yksittäinen solun arvo
        voidaan jäljittää alkuperäiseen CSV-tiedostoon asti.
      </p>
    </>
  );
}
