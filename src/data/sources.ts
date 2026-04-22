/**
 * Tietolähteiden keskitetty rekisteri.
 *
 * Tämä lista ohjaa sekä /lahteet-sivun näkymää että visualisointien
 * lähdemerkintöjä. Kun lisäät uuden lähteen, lisää se tänne — UI poimii sen
 * automaattisesti.
 *
 * Kentät on suunniteltu niin että taulukkonäkymä voi renderöidä rivin
 * ymmärrettävästi ilman koodimuutoksia.
 */

export type SourceStatus = "käytössä" | "suunniteltu" | "kokeellinen";

/** Missä määrin lähteen integraatio voidaan toteuttaa ilman käyttäjän panosta. */
export type Toteutettavuus = "itsenäinen" | "vaatii päätöksen" | "vaatii tunnukset" | "vaatii selvitystä";

export interface DataSource {
  id: string;
  nimi: string;
  ylläpitäjä: string;
  url: string;
  kuvaus: string;
  tyyppi: "budjetti" | "toteutuma" | "tilasto" | "hankinnat" | "vertailu" | "etuudet";
  formaatti: string[];
  lisenssi: string;
  lisenssiUrl?: string;
  rajapinta?: string;
  status: SourceStatus;
  käyttökohteet: string[];
  /** Vain kun status = suunniteltu: voinko tehdä itsenäisesti vai tarvitsenko jotain? */
  toteutettavuus?: Toteutettavuus;
  /** Kuvaus siitä mitä toteutus käytännössä vaatii */
  toteutusEhdotus?: string;
  /** Mitä konkreettisesti tarvitsen sinulta ennen kuin pääsen liikkeelle */
  tarvitsenSinulta?: string;
  /** Arvio työmäärästä */
  työarvio?: string;
}

export const SOURCES: DataSource[] = [
  {
    id: "vm-tae",
    nimi: "VM — Valtion talousarvioesitykset",
    ylläpitäjä: "Valtiovarainministeriö",
    url: "https://budjetti.vm.fi/opendata/",
    kuvaus:
      "Hallituksen talousarvioesitykset vuodesta 2014 alkaen koneluettavassa muodossa (XML/CSV). Sisältää pääluokat, luvut ja momentit sekä vertailuluvut edellisiltä vuosilta. Sovelluksen ensimmäinen datalähde.",
    tyyppi: "budjetti",
    formaatti: ["CSV", "XML"],
    lisenssi: "CC BY 4.0",
    lisenssiUrl: "https://creativecommons.org/licenses/by/4.0/deed.fi",
    rajapinta: "Staattiset tiedostot, osoitemalli: /indox/opendata/{vuosi}/tae/{dokumentti}/{vuosi}-tae-{dokumentti}-{pääluokka}.csv",
    status: "käytössä",
    käyttökohteet: ["Yleiskuva", "Treemap", "Hallinnonala-vertailu", "Momenttihaku"],
  },
  {
    id: "valtiokonttori-talous",
    nimi: "Valtiokonttori — Valtion talous -API",
    ylläpitäjä: "Valtiokonttori",
    url: "https://avoindata.tutkihallintoa.fi/",
    kuvaus:
      "Valtion kirjanpitoon (TaKP budjetti + LKP liikekirjanpito) perustuva REST-API. Sisältää määrärahat ja niiden käytön, toimintatulot/-menot, taseet ja verotulot.",
    tyyppi: "toteutuma",
    formaatti: ["JSON"],
    lisenssi: "CC BY 4.0",
    lisenssiUrl: "https://creativecommons.org/licenses/by/4.0/deed.fi",
    rajapinta: "api.tutkihallintoa.fi/talous/v1/* — TODELLINEN ENDPOINT selvitettävä (dokumentoidut 404)",
    status: "suunniteltu",
    käyttökohteet: ["Esitys vs. toteutuma -vertailu", "Poikkeamatunnistin"],
    toteutettavuus: "vaatii selvitystä",
    toteutusEhdotus:
      "Kokeiltiin dokumentoituja endpointteja (GET /talous/v1/luvut?paaluokka=33, /paaluokat yms.) — kaikki palauttivat 404. API-portaali on uudistunut tai endpointtien nimet muuttuneet. Ennen toteutusta on varmistettava oikeat polut suoraan avoindata.tutkihallintoa.fi/apis -sivulta tai ottamalla yhteyttä Valtiokonttoriin.",
    tarvitsenSinulta:
      "Tarkista avoindata.tutkihallintoa.fi/apis -portaalista kirjautuneena miltä nykyinen API-dokumentaatio näyttää tai onko API uudistunut (esim. eri domain, vaaditaanko API-avainta).",
    työarvio: "selvitys 30 min + toteutus 1–2 h",
  },
  {
    id: "valtiokonttori-velka",
    nimi: "Valtiokonttori — Valtionvelka-API",
    ylläpitäjä: "Valtiokonttori",
    url: "https://www.valtionvelka.fi/tilastot/avoimet-rajapinnat/",
    kuvaus:
      "Valtionvelan, lainanoton ja riskienhallinnan tilastot avoimen rajapinnan kautta. Operaatio central-government-debt/v1 tarjoaa mm. lainanottosuunnitelmat.",
    tyyppi: "toteutuma",
    formaatti: ["JSON"],
    lisenssi: "CC BY 4.0",
    rajapinta: "api.tutkihallintoa.fi/central-government-debt/v1/* — TODELLINEN ENDPOINT selvitettävä",
    status: "suunniteltu",
    käyttökohteet: ["Valtionvelan aikasarja", "Korkokulujen drill-down"],
    toteutettavuus: "vaatii selvitystä",
    toteutusEhdotus:
      "Sama portaali kuin Talous-API. Testatut endpointit (debt-stock, get-borrowing-plan) palauttavat 404. StatFin:n jali-taulu (EDP-velka 1975→) antaa jo velan kokonaisluvut — tämän API:n lisäarvo olisi velkarakenne (maturiteetit, lainamuodot).",
    tarvitsenSinulta:
      "Tieto siitä onko portaali yhä aktiivinen ja mitä API-dokumentaatio näyttää.",
    työarvio: "selvitys 30 min + toteutus 1 h",
  },
  {
    id: "statfin-jali",
    nimi: "Tilastokeskus — Julkisyhteisöjen alijäämä ja velka (jali)",
    ylläpitäjä: "Tilastokeskus",
    url: "https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/jali/",
    kuvaus:
      "EDP-alijäämä ja -velka vuosittain 1975–2025, jaettuna sektoreittain (S13 koko julkisyhteisöt, S1311 valtio, S1313 paikallishallinto ml. hyvinvointialueet, S1314 sosiaaliturvarahastot). Sekä M€ että %-osuus BKT:sta.",
    tyyppi: "tilasto",
    formaatti: ["JSON-stat2", "CSV", "PX"],
    lisenssi: "CC BY 4.0",
    rajapinta: "https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin/jali/statfin_jali_pxt_122g.px",
    status: "käytössä",
    käyttökohteet: ["Velka- ja alijäämäaikasarja", "Sektorivertailu: valtio / kunnat / ST"],
  },
  {
    id: "statfin-jmete",
    nimi: "Tilastokeskus — Julkisyhteisöjen menot tehtävittäin (jmete)",
    ylläpitäjä: "Tilastokeskus",
    url: "https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/jmete/",
    kuvaus:
      "Julkisen sektorin menot tehtäväluokittain (COFOG G01–G10: yleishallinto, puolustus, terveys, koulutus, sosiaaliturva jne.) 1990–2024. Sektorit valtio, paikallishallinto, hyvinvointialueet, sosiaaliturvarahastot. Arvot M€, %-osuus BKT:sta ja €/asukas.",
    tyyppi: "tilasto",
    formaatti: ["JSON-stat2", "CSV", "PX"],
    lisenssi: "CC BY 4.0",
    rajapinta: "https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin/jmete/statfin_jmete_pxt_12a6.px",
    status: "käytössä",
    käyttökohteet: ["COFOG-luokittelu", "EU-vertailukelpoinen menojakauma", "Tehtäväkohtainen kehitys"],
  },
  {
    id: "valto-pdf",
    nimi: "Valto — valtioneuvoston julkaisuarkisto (PDF)",
    ylläpitäjä: "Valtioneuvoston kanslia / ministeriöt",
    url: "https://julkaisut.valtioneuvosto.fi/",
    kuvaus:
      "Talousarvioon liittyvät viralliset julkaisut PDF-muodossa: budjettikatsaukset, julkisen talouden suunnitelma, taloudelliset katsaukset, valtion tilinpäätökset. Ladattu sovelluksen omaan public/pdfs-kansioon ja avautuu sovelluksen sisällä iframella.",
    tyyppi: "budjetti",
    formaatti: ["PDF"],
    lisenssi: "CC BY 4.0",
    lisenssiUrl: "https://creativecommons.org/licenses/by/4.0/deed.fi",
    rajapinta: "DSpace 7 REST API: /server/api/discover/search/objects?query={q}&dsoType=item",
    status: "käytössä",
    käyttökohteet: ["Dokumenttikatsaus", "Konteksti numeroiden taakse", "Lähdeselvitys"],
  },
  {
    id: "statfin-jtume",
    nimi: "Tilastokeskus — Julkisyhteisöjen tulot ja menot, neljännesvuosittain (jtume)",
    ylläpitäjä: "Tilastokeskus",
    url: "https://pxdata.stat.fi/PXWeb/pxweb/fi/StatFin/jtume/",
    kuvaus:
      "Neljännesvuosittaiset tulot, menot ja nettoluotonanto 1999Q1–2025Q4 sektoreittain. Keskeisinä indikaattoreina OTRU (tulot yht.), OTEU (menot yht.), B9 (nettoluotonanto), P3K (kulutusmenot), D62K (sosiaalietuudet).",
    tyyppi: "tilasto",
    formaatti: ["JSON-stat2", "CSV", "PX"],
    lisenssi: "CC BY 4.0",
    rajapinta: "https://pxdata.stat.fi/PXWeb/api/v1/fi/StatFin/jtume/statfin_jtume_pxt_11zf.px",
    status: "käytössä",
    käyttökohteet: ["Lyhyen aikavälin kehitys", "Tuorein neljännes", "Kvartaalianalyysi"],
  },
  {
    id: "tutkihankintoja",
    nimi: "Tutkihankintoja.fi — ostolaskut",
    ylläpitäjä: "Hansel / Valtiokonttori",
    url: "https://www.avoindata.fi/data/fi/dataset/tutkihankintoja-data",
    kuvaus:
      "Valtion ja (osin) kuntien ostolaskut vuodesta 2016 alkaen. Sisältää toimittajan, summan, päivämäärän ja tiliöinnin. Julkisten hankintojen tietovaranto laajenee 2026–2028 hyvinvointialueille.",
    tyyppi: "hankinnat",
    formaatti: ["CSV"],
    lisenssi: "CC BY 4.0",
    status: "suunniteltu",
    käyttökohteet: ["Toimittaja-analyysi", "Hallinnonala → ostolaskut drill-through"],
    toteutettavuus: "vaatii päätöksen",
    toteutusEhdotus:
      "Rivitason data on iso (~100+ MB per vuosi). Esikäsittelisin pipelineen kolme aggregaattitasoa, josta käyttäjä voi porautua selaimessa: (1) hallinnonala+vuosi → ostolaskut yhteensä, (2) toimittaja+vuosi top 1000, (3) momentti+vuosi. Ne mahtuvat Parquetiksi selaimelle. Rivitason raw kannattaa jättää palvelinpuolen lataukseksi tai CSV-linkkien taakse.",
    tarvitsenSinulta:
      "Päätöksen: (a) halutaanko vain aggregaatit (nopea, selaimelle sopiva) vai (b) koko rivitaso (vaatii Parquet-partitionnin tai kevyen backendin). Suosittelen aloittamaan aggregaateilla.",
    työarvio: "~3–6 h (aggregaatit) / ~1–2 vrk (rivitaso)",
  },
  {
    id: "eurostat-gov",
    nimi: "Eurostat — gov_10a_exp (COFOG EU-vertailu)",
    ylläpitäjä: "Euroopan komissio / Eurostat",
    url: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table?lang=en",
    kuvaus:
      "Julkisyhteisöjen menot tehtävittäin (COFOG 10 pääluokkaa) 13 keskeiselle EU-maalle 2010–2023: Pohjoismaat (FI, SE, NO, DK, IS), Keski-Eurooppa (DE, FR, NL, AT, BE), Etelä-Eurooppa (IT, ES) sekä EU27-keskiarvo. Sekä % BKT:sta että €/asukas.",
    tyyppi: "vertailu",
    formaatti: ["JSON-stat 2.0"],
    lisenssi: "CC BY 4.0 (Eurostat reuse policy)",
    lisenssiUrl: "https://creativecommons.org/licenses/by/4.0/deed.fi",
    rajapinta: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp",
    status: "käytössä",
    käyttökohteet: ["Maavertailu COFOG-luokittain (Julkinen talous -sivu)", "Aikasarja: Suomi vs. muut"],
  },
  {
    id: "kela",
    nimi: "Kela — Kelasto avoin data",
    ylläpitäjä: "Kela",
    url: "https://tietotarjotin.fi/tilastodata/2242438/avoin-data",
    kuvaus:
      "Etuuksien saajat ja maksetut etuudet kuukausi- ja vuositasolla. Täydentää valtion talousarvion sosiaaliturvamomenttien toteutuma-analyysiä.",
    tyyppi: "etuudet",
    formaatti: ["CSV", "JSON"],
    lisenssi: "CC BY 4.0",
    status: "suunniteltu",
    käyttökohteet: ["Sote-sosiaaliturva drill-down"],
    toteutettavuus: "vaatii selvitystä",
    toteutusEhdotus:
      "Kelasto ei tarjoa yhtenäistä REST-APIa vaan data on jaoteltu 100+ datasettiin avoindata.fi:ssä ja tietotarjottimella. Ensimmäinen vaihe olisi valita 5–10 keskeistä etuutta (esim. asumistuki, työmarkkinatuki, eläkkeet, opintotuki, sairausvakuutus) ja koota niiden kuukausi-/vuosisarjat yhteen Parquetiin. Siitä voisi tehdä Julkinen talous → Sosiaaliturva-näkymän, joka peilaa VM:n sosiaaliturvamomentteja todellisiin maksettuihin etuuksiin.",
    tarvitsenSinulta:
      "Päätöksen: mitkä etuudet ovat sinulle kiinnostavimpia? Voin myös aloittaa top 10:llä (suurimmat maksetut summat) ja antaa sinun valita UI:sta suosikit.",
    työarvio: "~4–8 h (valitut etuudet) / 1–2 vrk (kattava)",
  },
  {
    id: "thl",
    nimi: "THL — Sosiaali- ja terveysmenot",
    ylläpitäjä: "Terveyden ja hyvinvoinnin laitos",
    url: "https://thl.fi/en/statistics-and-data/statistics-by-topic/social-and-health-care-resources/social-protection-expenditure-and-financing",
    kuvaus:
      "Sosiaaliturvamenojen ja -rahoituksen aikasarjat. Tarjoaa tehtäväkohtaisen sote-näkymän jota valtion talousarvio ei yksin tavoita.",
    tyyppi: "tilasto",
    formaatti: ["CSV", "XLSX"],
    lisenssi: "CC BY 4.0",
    status: "suunniteltu",
    käyttökohteet: ["Sote-menojen kokonaiskuva"],
    toteutettavuus: "itsenäinen",
    toteutusEhdotus:
      "THL:n Sotkanet on PxWeb-pohjainen kuten StatFin, jolloin voin käyttää samaa kyselykoodia. Valitsisin sosiaalimenojen ESSPROS-luokittelun (sairaus, invaliditeetti, vanhuus, perhe, työttömyys…), joka täydentää COFOG-näkymää yksityiskohtaisemmin. Data rinnakkain jmete-taulun kanssa.",
    tarvitsenSinulta:
      "Vain luvan — StatFin-data on jo tässä ja THL käyttää samaa PxWeb-kuviota.",
    työarvio: "~2–3 h",
  },
];

export function sourceById(id: string): DataSource | undefined {
  return SOURCES.find((s) => s.id === id);
}
