/**
 * Sovelluksen sisäinen käyttöohje. Tämä on käyttäjälle suunnattu dokumentaatio,
 * joka kattaa kaikki näkymät ja toiminnot sillä tarkkuudella että kuka tahansa
 * voi aloittaa ilman erillistä perehdytystä.
 */

export default function UserGuide() {
  return (
    <>
      <h1>Käyttöohje</h1>
      <p className="lede">
        Sovelluksen kaikki näkymät ja toiminnot yhdellä sivulla. Jos jotain ei löydy,
        <a href="/lahteet"> Tietolähteet</a>-sivu kertoo mistä data tulee ja{" "}
        <a href="/metodologia">Metodologia</a> selittää kuinka se lasketaan.
      </p>

      <div className="panel">
        <div className="panel-title">Pikaopas — kolme minuuttia</div>
        <ol className="clean" style={{ marginBottom: 0 }}>
          <li>
            <b>Aloita Yleiskuvasta.</b> Klikkaa treemapin laatikkoa tai taulukkorivin
            "Avaa →" mennäksesi pääluokka → luku → momentti → aikasarja.
          </li>
          <li>
            <b>Käytä yläpalkin hakua.</b> Hakusana rajaa jokaista näkymää reaaliajassa —
            osumat korostetaan keltaisella. Esim. "terveys", "eläke", "maatalous".
          </li>
          <li>
            <b>Avaa Julkinen talous</b> nähdäksesi valtio + kunnat + sosiaaliturvarahastot
            yhdessä näkymässä (EDP-velka 1975→, COFOG, kvartaalit).
          </li>
          <li>
            <b>Vertaile vuosia.</b> Vuosivertailu-sivulla valitse 2+ vuotta ja katso
            suurimmat muutokset pylväinä, hajontakuviona tai muutospylväinä.
          </li>
          <li>
            <b>Vie Exceliin.</b> Taulukko-sivulla vihreä nappi lataa suodatetun datan
            XLSX-tiedostona.
          </li>
        </ol>
      </div>

      <h2>Näkymäkohtainen opas</h2>

      <div className="panel" id="yleiskuva">
        <div className="panel-title">Yleiskuva — porautuva treemap</div>
        <p>
          Oletussivulla näet valtion talousarvion kokonaisuutena. Treemapin jokainen
          värillinen laatikko on yksi hallinnonala; pinta-ala vastaa määrärahaa.
        </p>
        <h3>Porautuminen</h3>
        <ul className="clean">
          <li>
            <b>Klikkaa treemap-laatikkoa</b> tai taulukossa riviä/"Avaa →" nappia →
            avautuu kyseisen pääluokan luvut.
          </li>
          <li>
            Klikkaa lukua → avautuu sen momentit. Klikkaa momenttia → avautuu{" "}
            <b>yksityiskohtainen näkymä</b>: aikasarja hallituksen esitys / VM:n ehdotus /
            eduskunnan kirjelmä rinnakkain, viimeisin info-teksti ja täysi
            dokumenttikohtainen taulukko.
          </li>
          <li>
            <b>Breadcrumb</b> treemapin yläpuolella näyttää polun — klikkaa aiempaa tasoa
            palataksesi.
          </li>
        </ul>

        <h3>Hierarkian minimap</h3>
        <p>
          Breadcrumbin alla oleva pieni vaakarivistö ("ikicle") näyttää koko talousarvion
          ylhäältä alas:
        </p>
        <ul className="clean">
          <li>Ensimmäinen rivi: kaikki pääluokat, leveys = osuus talousarviosta.</li>
          <li>Kun avaat pääluokan, toinen rivi tulee näkyviin: kaikki sen luvut.</li>
          <li>Kolmas rivi avautuu luvun alla: momentit.</li>
          <li>
            Valittu polku korostuu <b>sinisellä ääriviivalla</b>, muut himmennetään.
          </li>
          <li>
            Minimap on <b>klikattavissa</b> — voit hypätä toiseen pääluokkaan tai lukuun
            suoraan siitä. ▣-kuvake juurtasolla nollaa polun.
          </li>
        </ul>

        <h3>Etusivun pikalinkit</h3>
        <p>
          Otsikon alla kolme kiinteää linkkiä syvempiin analytiikkanäkymiin: Julkinen
          talous, Vuosivertailu ja Taulukkonäkymä. Klikkaa niitä saadaksesi laajempia
          analyyseja samasta datasta.
        </p>
      </div>

      <div className="panel" id="julkinen-talous">
        <div className="panel-title">Julkinen talous kokonaisuudessaan</div>
        <p>
          <b>Miksi erillinen näkymä?</b> Valtion talousarvio on vain yksi osa julkista
          taloutta. Kunnat, hyvinvointialueet ja sosiaaliturvarahastot käyttävät
          rahansa omilla budjeteillaan. Tällä sivulla näet kaikki kolme saman
          katsauksen alla Tilastokeskuksen virallisen tilinpidon mukaan.
        </p>

        <h3>Sektorivalitsin</h3>
        <p>
          Yläpalkin chip-napeista voit valita tarkastelutason:
        </p>
        <ul className="clean">
          <li><b>Koko julkisyhteisöt (S13)</b> — yhteissumma, kaikki mukana</li>
          <li><b>Valtionhallinto (S1311)</b> — vain valtion osuus</li>
          <li><b>Paikallishallinto (S1313)</b> — kunnat ja hyvinvointialueet yhdessä</li>
          <li><b>Paikallishallinto pl. hyvinvointialueet (S13131)</b> — pelkät kunnat</li>
          <li><b>Hyvinvointialueet (S13132)</b> — uusi 2023 alkaen</li>
          <li><b>Sosiaaliturvarahastot (S1314)</b> — Kela, työeläkerahastot</li>
          <li>Lisäksi alasektorit työeläkelaitoksille ja muille</li>
        </ul>

        <h3>Yksikkövalitsin</h3>
        <p>
          Miljoonaa € tai % BKT:sta. Vaihda tämä kun haluat nähdä suhteellisia osuuksia
          (esim. vertaillessa eri vuosikymmeniä keskenään — inflaatio ei sotke).
        </p>

        <h3>Neljä visualisointia</h3>
        <ol className="clean">
          <li>
            <b>EDP-velka ja alijäämä</b> — aikasarja 1975→. Eurostat-vertailukelpoinen
            Maastricht-määritelmä.
          </li>
          <li>
            <b>COFOG-pääluokat viimeisimpänä vuonna</b> — vaakapylväät: yleishallinto,
            puolustus, järjestys, elinkeino, ympäristö, asuminen, terveys, vapaa-aika,
            koulutus, sosiaaliturva.
          </li>
          <li>
            <b>COFOG pinottuna aikasarjana</b> — miten tehtäväluokkien osuudet ovat
            muuttuneet 1990→.
          </li>
          <li>
            <b>Neljännesvuosittaiset tulot ja menot 1999Q1→</b> — tuorein tilanne,
            tulot (OTRU), menot (OTEU), nettoluotonanto (B9), palkansaajakorvaukset (D1K),
            kulutusmenot (P3K), sosiaalietuudet (D62K).
          </li>
        </ol>

        <div className="callout">
          <b>Haku toimii:</b> kirjoita esim. "terveys" yläpalkin hakuun → COFOG-näkymät
          rajaavat vain terveyteen liittyviin tehtäviin.
        </div>
      </div>

      <div className="panel" id="vertailu">
        <div className="panel-title">Vuosivertailu — porautuvat muutokset</div>
        <h3>Perusvirtaus</h3>
        <ol className="clean">
          <li>
            <b>Valitse 2+ vuotta</b> chip-napeista. Ero lasketaan pienimmän ja suurimman
            välillä; jos valitset kolme vuotta, kaikki näkyvät pylväissä mutta
            muutos­taulukko käyttää ääripäitä.
          </li>
          <li>
            <b>Valitse mittari</b>: määräraha (esitetty) tai toteutuma edell. vuodelta.
          </li>
          <li>
            <b>Valitse visualisointi</b>:
            <ul className="clean">
              <li>
                <b>Rinnakkain pylväät</b> — kaikki valitut vuodet vierekkäin
                hallinnonaloittain. Hyvä kun haluat nähdä trendin.
              </li>
              <li>
                <b>Muutospylväät</b> — yksi pylväs per rivi, vihreä = kasvu, punainen =
                lasku. Kärjessä suurimmat muutokset.
              </li>
              <li>
                <b>Hajontakuvio</b> — x-akseli = aloitusvuosi, y-akseli = loppuvuosi.
                45°:een viivalta etäällä olevat pisteet ovat muuttuneet eniten.
              </li>
            </ul>
          </li>
          <li>
            <b>Järjestys</b>: absoluuttinen vs. suhteellinen ero. Top N: 10/15/25/50.
            "Vain muuttuneet" piilottaa nollamuutokset.
          </li>
        </ol>

        <h3>Porautuminen syvemmälle</h3>
        <p>
          Oletustaso on hallinnonalat. Kun klikkaat taulukossa rivin "Avaa →", polku
          syvenee: <b>hallinnonala → luku → momentti</b>. Breadcrumb näyttää missä olet
          ja mahdollistaa palaamisen.
        </p>
        <p>
          Vertailu toimii kaikilla tasoilla — voit esim. valita "Sosiaali- ja
          terveysministeriö → porautua lukuun 'Terveyden ja sosiaalisen hyvinvoinnin
          edistäminen' → ja vertailla momenttitason muutoksia vuosina 2024 vs. 2026".
        </p>
      </div>

      <div className="panel" id="taulukko">
        <div className="panel-title">Taulukko — rivitasoinen haku ja suodatus</div>
        <p>
          Kaikki talousarviorivit (yli 16&nbsp;000 kpl) yhdessä näkymässä. Yhdistä
          vapaasti suodattimia ja lajittele sarakkeita klikkaamalla otsikkoa.
        </p>

        <h3>Suodattimet</h3>
        <ul className="clean">
          <li>
            <b>Vuosi</b> (chipit) — valitse yksi tai useampia. Tyhjä valinta = kaikki
            vuodet.
          </li>
          <li>
            <b>Dokumenttityyppi</b> — hallituksen esitys (oletus), VM:n ehdotus tai
            eduskunnan kirjelmä. Yhdistettynä näet muutokset prosessin aikana.
          </li>
          <li>
            <b>Pääluokka</b> — chip per hallinnonala (21–36).
          </li>
          <li>
            <b>Minimimäärä</b> — esim. 10000000 näyttää vain yli 10 M€ momentit.
          </li>
          <li>
            <b>Yläpalkin haku</b> — teksti momentin, luvun tai pääluokan nimessä.
          </li>
        </ul>

        <h3>Lajittelu</h3>
        <p>
          Sarakeotsikon ▲/▼ -merkki näyttää aktiivisen lajittelun. Klikkaa otsikkoa
          vaihtaaksesi suunnan, klikkaa toista otsikkoa vaihtaaksesi sarakkeen.
        </p>

        <h3>Excel-vienti</h3>
        <p>
          Oikeassa yläkulmassa vihreä <span className="xlsx-btn" style={{ padding: "3px 10px", pointerEvents: "none", display: "inline-flex", verticalAlign: "middle" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 4 }}>
              <rect x="2" y="3" width="20" height="18" rx="2.5" fill="#107C41" />
              <path d="M 8 8 L 16 16 M 16 8 L 8 16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            </svg>
            Vie Excel
          </span> -nappi. Vie <b>kaikki suodatetut rivit</b> (ei vain näkyvän sivun),
          muotoiltuna suomalaiseen XLSX-tiedostoon sarakeleveyksien kanssa. Tiedostonimi
          sisältää päiväyksen.
        </p>
      </div>

      <div className="panel" id="tiivistelma">
        <div className="panel-title">Aineistotiivistelmä — data datasta</div>
        <p>
          Yleiskatsaus siihen mitä sovellukseen on kytketty: rivien määrä, sarakkeet,
          uniikkien momenttien lukumäärä, NULL-osuudet, kokonaismäärärahat,
          dokumenttityyppien jakauma, top-10 suurimmat momentit sekä lähdematriisi.
        </p>
        <p>
          Kaikki luvut lasketaan <b>suoraan DuckDB-Wasm:lla</b> rekisteröidystä
          Parquet-tiedostosta. Kun aineisto päivittyy, tämäkin sivu näyttää tuoreimmat
          luvut.
        </p>
      </div>

      <div className="panel" id="dokumentit">
        <div className="panel-title">Dokumentit (PDF)</div>
        <p>
          Valtiovarainministeriön ja valtioneuvoston viralliset talousarvio-julkaisut
          PDF-muodossa. Sovellus on ladannut ne Valto-julkaisuarkistosta omaan
          kansioon, joten ne <b>avautuvat sovelluksen sisällä iframella</b> ilman
          ulkoisia latauksia.
        </p>

        <h3>Dokumenttityypit</h3>
        <ul className="clean">
          <li>
            <b>Budjettikatsaus</b> — VM:n selkokielinen vuosikatsaus. Julkaistaan
            syyskuussa (talousarvioesitys) ja tammikuussa (hyväksytty budjetti).
          </li>
          <li>
            <b>Julkisen talouden suunnitelma (JTS)</b> — hallituksen kehyspäätös
            4-vuotiskaudelle.
          </li>
          <li>
            <b>Taloudellinen katsaus</b> — VM:n tilanne- ja ennustekatsaukset.
          </li>
          <li>
            <b>Valtion tilinpäätös</b> — toteutuneiden lukujen virallinen julkaisu.
          </li>
        </ul>

        <h3>Käyttö</h3>
        <ol className="clean">
          <li>Suodata tyyppi chip-napeista tai kirjoita hakuun (haku osuu otsikkoon ja tiivistelmään).</li>
          <li>Klikkaa julkaisun riviä tai "Avaa →" — PDF avautuu iframena sivun yläosaan (80 % ruudun korkeudesta).</li>
          <li>"Avaa uudessa välilehdessä ↗" — koko ruutu PDF-selaimessa.</li>
          <li>"Valto-sivu ↗" — alkuperäinen julkaisusivu metatiedoilla.</li>
        </ol>
      </div>

      <div className="panel" id="lahteet">
        <div className="panel-title">Tietolähteet — mistä data tulee</div>
        <p>
          Kaikki sovelluksen laskennat perustuvat avoimen datan lähteisiin (pääosin
          CC BY 4.0). Jokainen visualisointi näyttää lähteensä pienellä tunnisteella
          alhaalla, klikattavissa vastaavaan riviin.
        </p>

        <h3>Statusmerkit</h3>
        <ul className="clean">
          <li>
            <b>Käytössä</b> — lähde on ladattu ja integroitu sovellukseen.
          </li>
          <li>
            <b>Suunniteltu</b> — lähde tunnistettu, ei vielä integroitu. Avaa rivi
            nähdäksesi <b>toteutusehdotus</b>, <b>mitä tarvitsen sinulta</b> ja{" "}
            <b>työarvio tunneissa</b>. Vihreällä taustalla: voin aloittaa itsenäisesti.
            Keltaisella: tarvitsen päätöksen sinulta.
          </li>
          <li>
            <b>Kokeellinen</b> — liitetty mutta ei vielä vakaana osana.
          </li>
        </ul>

        <h3>Tiivis/laaja näkymä</h3>
        <p>
          Lähdeluettelo on tiiviissä <b>rivimuodossa</b> (5 saraketta: nimi, ylläpitäjä,
          tyyppi, lisenssi, status). Rivin klikkaus laajentaa sen koko kuvauksen.
          Chip-napeista yläpuolella voi rajata tyypin mukaan (Budjetti, Toteutuma,
          Tilasto, Hankinnat, EU-vertailu, Etuudet) tai statuksen mukaan.
        </p>
      </div>

      <div className="panel" id="globaalit">
        <div className="panel-title">Koko sovelluksen tasoiset ominaisuudet</div>

        <h3>Avoin tekstihaku yläpalkissa</h3>
        <p>
          Pikakirjoitus: klikkaa <b>⌕ hakukenttää</b> ja kirjoita. Haku toimii kaikilla
          sivuilla:
        </p>
        <ul className="clean">
          <li><b>Yleiskuva:</b> rajaa treemap-soluja ja taulukkoriveja.</li>
          <li><b>Julkinen talous:</b> suodattaa COFOG-tehtäväluokkia ja kvartaalitaloustoimia.</li>
          <li><b>Vuosivertailu:</b> näyttää vain osuvat rivit pylväissä ja taulukossa.</li>
          <li><b>Taulukko:</b> yhdistyy muihin suodattimiin.</li>
          <li><b>Tietolähteet:</b> haku osuu nimeen, kuvaukseen ja rajapintaan.</li>
          <li><b>Dokumentit:</b> osuu otsikkoon ja tiivistelmään.</li>
        </ul>
        <p>Osumat korostetaan <span className="highlight">keltaisella</span>.
          Tyhjennä × -napilla kentän oikealta.
        </p>

        <h3>Vaalea moderni ulkoasu</h3>
        <p>
          Valkoiset paneelit pehmeillä varjoilla, pyöristetyt kulmat, Inter-tyyppinen
          typografia. Responsiivinen: toimii kapealla näytöllä (yläpalkki rivittyy,
          ruudukot muuttuvat yksisarakkeisiksi alle 960 px leveydellä).
        </p>

        <h3>Datan jäljitettävyys</h3>
        <p>
          Jokaisen visualisoinnin alla on pieni <b>"Lähde:"</b>-merkintä. Klikkaus vie{" "}
          <a href="/lahteet">Tietolähteet</a>-sivun vastaavaan riviin. Lisäksi{" "}
          <a href="/metodologia">Metodologia</a> kuvaa tarkan laskennan (ETL-vaiheet,
          sarakesäännöt, DuckDB-kyselyt).
        </p>

        <h3>Suorituskyky</h3>
        <p>
          Analytiikka tehdään kokonaan selaimessa <b>DuckDB-Wasm:lla</b>. Parquet-
          tiedostot ladataan kerran, kyselyt ajetaan Web Workerissa. TanStack Query
          cache estää saman kyselyn tekemisen kahdesti. Aineistoa päivitetään ajamalla{" "}
          <code>npm run data</code> tai <code>npm run data:fresh</code>.
        </p>
      </div>

      <div className="panel" id="datan-paivitys">
        <div className="panel-title">Datan päivittäminen</div>
        <p>
          Aineisto kootaan kahdesta erillisestä Python-pipelinestä:
        </p>
        <ol className="clean">
          <li>
            <code>scripts/build_data.py</code> — VM:n CSV-talousarvioesitykset +
            StatFin:n PxWeb-julkisen talouden taulut (jali, jmete, jtume).
          </li>
          <li>
            <code>scripts/fetch_pdfs.py</code> — Valto-julkaisuarkiston PDF:t.
          </li>
        </ol>
        <p>
          Komennot:
        </p>
        <pre>{`# Kerran: virtuaaliympäristön asennus
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt

# Data (VM + StatFin)
scripts/.venv/bin/python scripts/build_data.py
# --refresh: pakota uudelleenlataus
# --skip-vm tai --skip-statfin: vain toinen osa

# PDF:t (Valto)
scripts/.venv/bin/python scripts/fetch_pdfs.py`}</pre>
        <p>
          Tulokset kirjoitetaan <code>public/data/</code> ja <code>public/pdfs/</code>.
          Sovellus lukee niitä staattisesti — reload selaimessa nappaa tuoreet tiedot.
        </p>
      </div>

      <h2>Ongelmatilanteet</h2>
      <div className="panel">
        <dl className="kv">
          <dt>"Datan lataus epäonnistui"</dt>
          <dd>
            Parquet-tiedosto puuttuu. Aja <code>npm run data</code> (tai{" "}
            <code>scripts/.venv/bin/python scripts/build_data.py</code>).
          </dd>
          <dt>"Failed to construct Worker"</dt>
          <dd>
            Selain estää Web Workerin — vaihda dev-serveri <code>localhost:5173</code>:een.
            Tuotannossa ongelma ei ilmene koska workerit ovat samasta originista.
          </dd>
          <dt>PDF ei aukea iframessa</dt>
          <dd>
            Joidenkin selaimien PDF-pluginit estävät inline-renderoinnin. Käytä
            "Avaa uudessa välilehdessä ↗" -linkkiä.
          </dd>
          <dt>Treemap jää tyhjäksi</dt>
          <dd>
            Todennäköisesti hakusana rajaa kaiken pois. Tyhjennä haku × -napilla.
          </dd>
          <dt>VM-lataus saa 503</dt>
          <dd>
            VM:n palvelin rajaa käyttöä ruuhkatilanteissa. Pipeline yrittää neljä
            kertaa eksponentiaalisella backoffilla — jos silti kaatuu, odota hetki ja
            aja uudelleen (cache säilyttää jo ladatut tiedostot).
          </dd>
        </dl>
      </div>

      <h2>Mikä puuttuu</h2>
      <div className="panel">
        <p>
          Tällä hetkellä <b>suunniteltujen</b> lähteiden liittäminen (katso{" "}
          <a href="/lahteet">Tietolähteet</a>, keltaiset/vihreät laatikot):
        </p>
        <ul className="clean">
          <li>Valtiokonttori — Talous-API (toteutuma momenttitasolla)</li>
          <li>Valtiokonttori — Valtionvelka-API (lainakoostumus)</li>
          <li>Tutkihankintoja.fi — ostolaskut (toimittaja-analytiikka)</li>
          <li>Eurostat gov_10a_exp — EU-vertailu (COFOG muissa maissa)</li>
          <li>Kela Kelasto — etuuksien maksut (sosiaaliturvan peilaus)</li>
          <li>THL — sosiaali- ja terveysmenot (tarkempi sote-jaottelu)</li>
        </ul>
        <p>
          Lisäksi hallituksen esityksen koko teoksen PDF:ät (eduskunta.fi) ja tuoreen
          talousarvioesityksen 2026 yleisperustelujen PDF voisi liittää. Kerro kun
          haluat jonkin toteutettavaksi.
        </p>
      </div>
    </>
  );
}
