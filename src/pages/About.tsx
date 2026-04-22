export default function About() {
  return (
    <>
      <h1>Tietoja sovelluksesta</h1>
      <p className="lede">
        Selainpohjainen analytiikkatyökalu Suomen valtion budjetille ja laajemmin julkiselle
        taloudelle. Sovellus ajaa analytiikan suoraan käyttäjän selaimessa DuckDB-Wasm:lla;
        palvelinlogiikkaa ei ole, joten käyttö on nopeaa ja yksityistä.
      </p>

      <h2>Tavoite</h2>
      <p>
        Tehdä monimutkaisesta julkisen talouden datasta visualisoitua, vertailukelpoista ja
        läpinäkyvää. Jokainen luku on jäljitettävissä alkuperäiseen avoimeen lähteeseen, ja
        kaikki laskennat on dokumentoitu.
      </p>

      <h2>Tekniset valinnat lyhyesti</h2>
      <ul className="clean">
        <li><b>Vite + React + TypeScript</b> — frontend-runko.</li>
        <li><b>DuckDB-Wasm</b> — SQL-kyselyt selaimessa, lukee Parquetin suoraan HTTP:n yli.</li>
        <li><b>Observable Plot + D3</b> — visualisoinnit (treemap, aikasarjat).</li>
        <li><b>TanStack Query</b> — SQL-tulosten cache ja elinkaari.</li>
        <li><b>Python + PyArrow</b> — datapipeline joka muuntaa VM:n CSV:t Parquetiksi.</li>
      </ul>

      <h2>Aineiston päivittäminen</h2>
      <pre>{`# ensiasennus
npm install
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt

# datan rakentaminen (VM:n avoimesta datasta)
scripts/.venv/bin/python scripts/build_data.py --years 2022 2023 2024 2025 2026

# kehitysserveri
npm run dev

# tuotantobuildi
npm run build`}</pre>

      <h2>Lisenssi</h2>
      <p>
        Sovelluksen lähdekoodi on vapaasti käytettävissä. Datan lisenssit määräytyvät kunkin
        lähteen mukaan; ks. <a href="/lahteet">Tietolähteet</a>. Pääasialliset lähteet
        (VM, Valtiokonttori, Tilastokeskus) käyttävät CC BY 4.0 -lisenssiä, joka edellyttää
        lähteen mainitsemista.
      </p>

      <h2>Jatkokehityssuunnitelma</h2>
      <ol className="clean">
        <li>Valtiokonttorin API: toteutuma-data ja poikkeamatunnistin.</li>
        <li>StatFin: julkisten menojen hintaindeksi → reaali-euromuunnos.</li>
        <li>Tutkihankintoja.fi: ostolaskujen drill-through momenteista toimittajiin.</li>
        <li>Eurostat COFOG: EU-vertailu.</li>
        <li>"Minkä osan verostani X €?" -laskuri.</li>
        <li>Kuntatalous-näkymä StatFin:n kuntataulusta.</li>
      </ol>

      <h2>Yhteys ja osallistuminen</h2>
      <p>
        Projekti on avoin — puutokset, virheet ja parannusehdotukset otetaan vastaan
        repositorion issues-listan kautta.
      </p>
    </>
  );
}
