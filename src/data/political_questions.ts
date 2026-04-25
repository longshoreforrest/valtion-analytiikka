/**
 * Poliittisten puolueiden kysymyspankki valtion budjetista.
 *
 * Jokainen kysymys on annotoitu:
 *  - mihin teemaan se liittyy (esim. ilmasto, koulutus, sopeutus),
 *  - mitkä puolueet kysyvät sitä erityisesti,
 *  - mistä lähteistä vastauksen voi nykyisin koota tässä sovelluksessa,
 *  - mitä lisädataa tarvittaisiin jotta sovellus voisi vastata
 *    automaattisesti — tämä luo "katvealueiden" listan tulevaa
 *    keskustelevaa analytiikkaa varten.
 *
 * Kysymykset on luokiteltu ajalliseen luonteeseen:
 *  - vuosi: koskee yhden TAE:n / kehyksen vuotta
 *  - vaalikausi: 4-vuotinen tarkastelu (2023–2027)
 *  - ylivaalikautinen: vaikuttavuus, trendit, useamman hallituksen yli
 *  - vaikuttavuus: politiikkatoimien arviointi (impact evaluation)
 */

export type Aikaperspektiivi =
  | "vuosi"
  | "vaalikausi"
  | "ylivaalikautinen"
  | "vaikuttavuus";

export type Kattavuus =
  /** Sovellus voi vastata kysymykseen nykydatalla */
  | "kattaa"
  /** Vastaus on osittainen tai vaatii käyttäjän tulkintaa */
  | "osittain"
  /** Sovellus ei voi vastata, tarvitaan lisädataa tai -mallinnusta */
  | "puuttuu";

export interface PoliticalQuestion {
  id: string;
  /** Lyhyt kuvaava otsikko */
  otsikko: string;
  /** Koko kysymys luonnollisella kielellä, kuten puolue sen esittäisi */
  kysymys: string;
  teema: string;
  /** Mitkä puolueet kysyvät tätä erityisesti (puolue-id:t) */
  esittäjät: string[];
  aikaperspektiivi: Aikaperspektiivi;
  kattavuus: Kattavuus;
  /** Mitkä sovelluksen näkymät / data-aineistot vastaavat osaan tai kokonaan */
  nykyiset: string[];
  /** Mitä lisädataa tarvitaan kattavaan vastaukseen */
  puuttuvaData?: string[];
  /** Mistä puolueen edustajat hakevat vastauksen tällä hetkellä (kanavat) */
  nykyisetLähteet: string[];
  /** Esimerkki yksittäisestä lähteestä viitteenä */
  lähdeUrl?: string;
  /**
   * Arvomallin dimensiot, jotka selittävät puolueiden eroja tähän kysymykseen.
   * Käytetään analyyttiseen selittäjään: puolueet jotka ovat näissä
   * dimensioissa korkeita asettuvat tyypillisesti samalla tavalla.
   */
  ydinDimensiot?: string[];
}

export const POLITICAL_QUESTIONS: PoliticalQuestion[] = [
  // ------- Sopeutus & velka --------
  {
    id: "q-debt-trajectory",
    otsikko: "Velkasuhteen kehitys hallituskauden yli",
    kysymys:
      "Millä uralla EDP-velka suhteessa BKT:hen kulkee nykytoimien valossa, ja kuinka herkkä ura on korkojen ja kasvun muutoksille?",
    teema: "Julkisen talouden sopeutus",
    esittäjät: ["kok", "ps", "rkp", "kd", "sdp"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "osittain",
    nykyiset: [
      "Julkinen talous → EDP-velka 1975→",
      "Julkinen talous → COFOG-aikasarja 1990→",
    ],
    puuttuvaData: [
      "VM:n julkisen talouden suunnitelma (JTS) 4-vuotiset urat",
      "Suomen Pankin / OECD:n korko- ja kasvuoletukset",
      "Stressitestaussimulaattori (sensitiivisyys)",
    ],
    nykyisetLähteet: [
      "VM:n taloudelliset katsaukset",
      "Talouspolitiikan arviointineuvoston raportit",
      "Suomen Pankin Euro & Talous",
    ],
    lähdeUrl: "https://vm.fi/julkaisut/julkisen-talouden-suunnitelma",
  },
  {
    id: "q-fiscal-rule",
    otsikko: "EU:n finanssisääntöjen vaikutus",
    kysymys:
      "Miten EU:n uudet finanssisäännöt (DSA, EDP) rajoittavat Suomen liikkumavaraa nyt ja vuoteen 2030?",
    teema: "EU-rajoitteet",
    esittäjät: ["kok", "rkp", "vihr", "sdp"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "puuttuu",
    nykyiset: [
      "Julkinen talous → EU-vertailu (Eurostat) — vain havainnoiva",
    ],
    puuttuvaData: [
      "EU-komission maakohtaiset suositukset",
      "Suomen DSA-sopeutusura (medium-term plan)",
      "Excessive deficit procedure -indikaattorit",
    ],
    nykyisetLähteet: [
      "EU-komission sivustot (european-semester)",
      "VM:n EU-osasto",
    ],
  },

  // ------- Verot --------
  {
    id: "q-tax-progressivity",
    otsikko: "Verotuksen progressiivisuuden muutos",
    kysymys:
      "Miten tuloverotus ja kokonaisveroaste ovat muuttuneet desiileittäin vaalikauden aikana?",
    teema: "Verotus",
    esittäjät: ["sdp", "vas", "vihr", "kesk"],
    aikaperspektiivi: "vaalikausi",
    kattavuus: "puuttuu",
    nykyiset: ["Yleiskuva → Pääluokka 28 (verotulot kokonaistasolla)"],
    puuttuvaData: [
      "Tilastokeskuksen tulonjakotilasto",
      "VATT:n VEROMOD-mallin tulokset (mikrosimulaatio)",
      "Verohallinnon tulodesiilitilastot",
    ],
    nykyisetLähteet: [
      "Tilastokeskus tulonjakotilasto",
      "VATT mikrosimulointi",
      "Vero.fi tilastot",
    ],
    lähdeUrl: "https://www.stat.fi/tilasto/tjt",
  },
  {
    id: "q-tax-revenue-elasticity",
    otsikko: "Verotulojen joustavuus suhteessa kasvuun",
    kysymys:
      "Kuinka herkästi yhteisö- ja arvonlisäverotulot reagoivat suhdannevaihteluihin?",
    teema: "Verotus",
    esittäjät: ["kok", "rkp", "ps"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "osittain",
    nykyiset: ["Yleiskuva → Pääluokka 28 aikasarjat"],
    puuttuvaData: [
      "BKT-aikasarja (jo Eurostatissa)",
      "Suhdannejaottelu valtion talousarviossa",
    ],
    nykyisetLähteet: ["Tilastokeskus", "VM:n verokarttoja"],
  },

  // ------- Sote & hyvinvointialueet --------
  {
    id: "q-soteshare",
    otsikko: "Hyvinvointialueiden rahoituksen riittävyys",
    kysymys:
      "Riittääkö valtion rahoitus hyvinvointialueille palvelutason ylläpitoon ikääntyvällä väestöllä?",
    teema: "Sote",
    esittäjät: ["sdp", "vas", "kesk", "kd"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "osittain",
    nykyiset: [
      "Yleiskuva → Pääluokka 28.89 (HVA-rahoitus)",
      "Julkinen talous → S13132 hyvinvointialueet",
    ],
    puuttuvaData: [
      "THL Sote-tietopaketit alueittain",
      "Hyvinvointialueiden tilinpäätökset",
      "Demografinen ennustetietokanta",
    ],
    nykyisetLähteet: ["THL Tietoikkuna", "Soteindeksi", "VM"],
  },
  {
    id: "q-jonojen-purku",
    otsikko: "Hoitojonojen purkaminen",
    kysymys:
      "Onko valtion hyvinvointialueille kanavoima rahoitus näkynyt hoitojonojen lyhenemisenä?",
    teema: "Sote-vaikuttavuus",
    esittäjät: ["sdp", "vas", "vihr", "kesk"],
    aikaperspektiivi: "vaikuttavuus",
    kattavuus: "puuttuu",
    nykyiset: [],
    puuttuvaData: [
      "THL hoitoonpääsy-tilastot",
      "Hyvinvointialueiden palveluvelka-indikaattorit",
      "Aikasarja yhdistelmänä rahoituksen kanssa",
    ],
    nykyisetLähteet: ["THL Sotkanet", "Avi-tietopalvelu", "Valviran datat"],
  },

  // ------- Ilmasto & vihreä siirtymä --------
  {
    id: "q-climate-effectiveness",
    otsikko: "Päästövähennysten kustannustehokkuus",
    kysymys:
      "Mikä on euron tuottama päästövähennys eri toimissa (sähkönsiirtoinvestoinnit, ydinvoimatuet, joukkoliikenne)?",
    teema: "Ilmasto",
    esittäjät: ["vihr", "vas", "rkp", "kok"],
    aikaperspektiivi: "vaikuttavuus",
    kattavuus: "puuttuu",
    nykyiset: ["Yleiskuva → Pääluokat 32 ja 35 menorakenteet"],
    puuttuvaData: [
      "Tilastokeskuksen päästöinventaario",
      "SYKE / Ilmastopaneelin arviot toimenpiteittäin",
      "Sektorikohtaiset MAC-käyrät (marginal abatement cost)",
    ],
    nykyisetLähteet: ["Ilmastopaneeli", "SYKE", "VM:n rahoitusvaikutusarviot"],
  },
  {
    id: "q-fossil-subsidies",
    otsikko: "Fossiilituet valtion budjetissa",
    kysymys:
      "Kuinka paljon valtion budjetti edelleen tukee fossiilipohjaista taloutta verovähennyksin ja suorin tuin?",
    teema: "Ilmasto / yritystuet",
    esittäjät: ["vihr", "vas", "sdp"],
    aikaperspektiivi: "vaalikausi",
    kattavuus: "osittain",
    nykyiset: [
      "Yleiskuva → Pääluokka 32 (TEM)",
      "Yleiskuva → Pääluokka 28 (verotuet)",
    ],
    puuttuvaData: [
      "VATT:n yritystukianalyysit",
      "Verotukien dokumentaatio (Tax Expenditure Review)",
    ],
    nykyisetLähteet: ["VATT", "VM Verotukijulkaisut", "Sitra"],
  },

  // ------- Koulutus & TKI --------
  {
    id: "q-tki-target",
    otsikko: "TKI-rahoituksen 4 % BKT -polku",
    kysymys:
      "Miten valtion TKI-rahoitus on edennyt suhteessa lailla säädettyyn 4 % BKT 2030 -tavoitteeseen?",
    teema: "Koulutus / TKI",
    esittäjät: ["kok", "vihr", "sdp", "rkp"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "osittain",
    nykyiset: ["Yleiskuva → Pääluokat 29 (OKM), 32 (TEM)"],
    puuttuvaData: [
      "Suomen Akatemian ja Business Finlandin yksityiskohdat",
      "Yksityisen TKI:n erottaminen (StatFin: TKI-tilasto)",
      "BKT-suhteen aikasarja",
    ],
    nykyisetLähteet: [
      "Tilastokeskus TKI-tilasto",
      "Suomen Akatemia",
      "Business Finland",
    ],
  },
  {
    id: "q-edu-cuts",
    otsikko: "Koulutusleikkausten vaikuttavuus",
    kysymys:
      "Onko peruskoulun ja lukiokoulutuksen rahoituksen muutos näkynyt PISA- tai ylioppilastuloksissa?",
    teema: "Koulutus-vaikuttavuus",
    esittäjät: ["sdp", "vas", "vihr", "kesk"],
    aikaperspektiivi: "vaikuttavuus",
    kattavuus: "puuttuu",
    nykyiset: ["Yleiskuva → Pääluokka 29 (rahoituksen taso)"],
    puuttuvaData: [
      "PISA-tutkimukset",
      "Ylioppilastutkintolautakunnan tilastot",
      "Karvi-arvioinnit",
    ],
    nykyisetLähteet: ["OPH", "OECD PISA", "Karvi"],
  },

  // ------- Sosiaaliturva --------
  {
    id: "q-tk-uudistus-vaikutus",
    otsikko: "Sosiaaliturvauudistuksen tulonjakovaikutukset",
    kysymys:
      "Miten asumistuen, työttömyysturvan ja indeksien muutokset ovat vaikuttaneet pienituloisten ostovoimaan?",
    teema: "Sosiaaliturva-vaikuttavuus",
    esittäjät: ["sdp", "vas", "vihr", "kd"],
    aikaperspektiivi: "vaikuttavuus",
    kattavuus: "puuttuu",
    nykyiset: ["Yleiskuva → Pääluokka 33 (kokonaistason muutokset)"],
    puuttuvaData: [
      "VATT mikrosimuloinnit (SISU-malli)",
      "Tilastokeskuksen tulonjakotilasto vuosittain",
      "Kelan etuusrekisterit",
    ],
    nykyisetLähteet: ["Kela", "VATT SISU-malli", "Tilastokeskus"],
  },
  {
    id: "q-poverty-trend",
    otsikko: "Pienituloisuusasteen kehitys",
    kysymys:
      "Onko pienituloisuusaste muuttunut hallituskauden alusta, ja millaiset budjettitoimet selittävät muutosta?",
    teema: "Sosiaaliturva",
    esittäjät: ["sdp", "vas", "vihr"],
    aikaperspektiivi: "vaalikausi",
    kattavuus: "puuttuu",
    nykyiset: [],
    puuttuvaData: [
      "Tilastokeskus tulonjakotilasto",
      "Eurostat at-risk-of-poverty rate",
    ],
    nykyisetLähteet: ["Tilastokeskus", "Eurostat"],
  },

  // ------- Maaseutu & maatalous --------
  {
    id: "q-rural-funding",
    otsikko: "Maatalouden tukien kehitys ja kannattavuus",
    kysymys:
      "Miten EU:n CAP-rahoitus ja kansalliset tuet ovat kehittyneet, ja miten ne suhteutuvat maatalouden kannattavuuteen?",
    teema: "Maatalous",
    esittäjät: ["kesk", "ps", "rkp"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "osittain",
    nykyiset: ["Yleiskuva → Pääluokka 30 (MMM)"],
    puuttuvaData: [
      "Luke kannattavuuskirjanpito",
      "EU CAP -dataportaali",
      "Maatalouden hintaindeksit",
    ],
    nykyisetLähteet: [
      "Luonnonvarakeskus (Luke)",
      "Ruokavirasto",
      "EU CAP Network",
    ],
  },

  // ------- Maahanmuutto --------
  {
    id: "q-migration-cost",
    otsikko: "Maahanmuuton fiskaalinen vaikutus",
    kysymys:
      "Mikä on humanitaarisen ja työperäisen maahanmuuton arvioitu nettofiskaalinen vaikutus?",
    teema: "Maahanmuutto",
    esittäjät: ["ps", "kok", "kd", "vihr", "vas"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "puuttuu",
    nykyiset: ["Yleiskuva → Pääluokka 26 (sisäministeriö)"],
    puuttuvaData: [
      "ETLA / VATT fiskaalivaikutusanalyysit",
      "Maahanmuuttoviraston tilastot",
      "Tilastokeskuksen työllisyys ja verotulodata maahanmuuttajista",
    ],
    nykyisetLähteet: ["ETLA", "VATT", "Migri", "OECD"],
  },

  // ------- Turvallisuus --------
  {
    id: "q-defense-2pct",
    otsikko: "Puolustusbudjetin 2 % BKT -taso",
    kysymys:
      "Miten puolustusmenot ovat kehittyneet suhteessa NATO-tavoitteeseen ja vertailumaihin?",
    teema: "Turvallisuus",
    esittäjät: ["kok", "ps", "rkp", "kd", "kesk", "sdp"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "kattaa",
    nykyiset: [
      "Yleiskuva → Pääluokka 27 (puolustus)",
      "Julkinen talous → COFOG GF02 (puolustus) ja EU-vertailu",
    ],
    nykyisetLähteet: ["NATO Press Release annual report", "Eurostat"],
    lähdeUrl: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp",
  },

  // ------- Aluepolitiikka --------
  {
    id: "q-regional-equality",
    otsikko: "Alueellinen tasa-arvo julkisissa investoinneissa",
    kysymys:
      "Jakautuvatko valtion investoinnit (väylät, sote, koulutus) tasaisesti maakunnittain suhteessa väestöön?",
    teema: "Aluepolitiikka",
    esittäjät: ["kesk", "ps", "rkp"],
    aikaperspektiivi: "vaalikausi",
    kattavuus: "puuttuu",
    nykyiset: [],
    puuttuvaData: [
      "ELY-keskusten hankerekisterit",
      "Väylävirasto-aineistot",
      "Maakunnittainen aluetilinpito",
    ],
    nykyisetLähteet: [
      "Tilastokeskus aluetilinpito",
      "ELY-keskukset",
      "Väylävirasto",
    ],
  },

  // ------- Politiikkatoimien vaikuttavuus yleisesti --------
  {
    id: "q-impact-evaluation",
    otsikko: "Hallituksen kärkitoimien vaikuttavuus",
    kysymys:
      "Onko hallituksen kärkitoimille (sote-säästöt, työllisyysuudistukset, koulutusleikkaukset) tehty systemaattisia vaikuttavuusarviointeja?",
    teema: "Vaikuttavuus",
    esittäjät: ["sdp", "vas", "vihr", "kesk"],
    aikaperspektiivi: "vaikuttavuus",
    kattavuus: "puuttuu",
    nykyiset: [],
    puuttuvaData: [
      "Talouspolitiikan arviointineuvoston raportit",
      "Tarkastusvaliokunnan tarkastuskertomukset",
      "VTV:n tarkastusraportit",
    ],
    nykyisetLähteet: [
      "Talouspolitiikan arviointineuvosto",
      "Valtiontalouden tarkastusvirasto (VTV)",
      "Eduskunnan tarkastusvaliokunta",
    ],
    lähdeUrl: "https://www.talouspolitiikanarviointineuvosto.fi/",
  },
  {
    id: "q-policy-coherence",
    otsikko: "Lupausten ja toimenpiteiden linja",
    kysymys:
      "Miten hallitusohjelman tavoitteet ovat siirtyneet konkreettisiksi budjettiriveiksi ja toimenpiteiksi?",
    teema: "Hallinnon tilivelvollisuus",
    esittäjät: ["sdp", "vas", "vihr", "kesk", "ps"],
    aikaperspektiivi: "vaalikausi",
    kattavuus: "osittain",
    nykyiset: [
      "Dokumentit → hallitusohjelma + TAE-julkaisut",
      "Yleiskuva → momenttitason muutokset vuosittain",
    ],
    puuttuvaData: [
      "Hallituksen vuosikertomus (Vuosikirja) — kytkös tavoite ↔ toimenpide",
      "Strukturoitu indikaattorikartta",
    ],
    nykyisetLähteet: [
      "Hallituksen vuosikertomus",
      "Tarkastusvaliokunta",
      "Valtioneuvoston kanslia (VNK)",
    ],
  },
  {
    id: "q-cross-cabinet",
    otsikko: "Politiikkajatkumo hallituksen vaihdoksissa",
    kysymys:
      "Mitkä kärkihankkeet ja meno-uudistukset ovat säilyneet useamman hallituksen yli ja mitkä ovat peruuntuneet?",
    teema: "Ylivaalikautinen jatkuvuus",
    esittäjät: ["sdp", "vihr", "kok", "kesk"],
    aikaperspektiivi: "ylivaalikautinen",
    kattavuus: "osittain",
    nykyiset: [
      "Yleiskuva → momenttiaikasarjat 2014→",
      "Vertailu → suurimmat muutokset useamman vuoden välillä",
    ],
    puuttuvaData: [
      "Hallitusohjelmien strukturoitu vertailutaulu",
      "Lainsäädäntömuutosten paneeliaineisto",
    ],
    nykyisetLähteet: ["Edilex", "Eduskunnan asiakirjat", "VNK"],
  },
];

/**
 * Ydindimensiot kysymyksittäin. Erotettu kysymyslistasta jotta päivittäminen
 * on helpompaa — kysymys voi olla "puuttuu"-tilassa mutta selittävä
 * dimensiokytkös voi silti olla mielekäs.
 */
const QUESTION_CORE_DIMENSIONS: Record<string, string[]> = {
  "q-debt-trajectory": ["fiscal_tightness", "tax_level", "social_security"],
  "q-fiscal-rule": ["fiscal_tightness", "eu"],
  "q-tax-progressivity": ["tax_level", "redistribution", "social_security"],
  "q-tax-revenue-elasticity": ["tax_level", "fiscal_tightness"],
  "q-soteshare": ["public_services", "redistribution", "fiscal_tightness"],
  "q-jonojen-purku": ["public_services", "fiscal_tightness", "social_security"],
  "q-climate-effectiveness": [
    "climate",
    "business_subsidies",
    "fiscal_tightness",
  ],
  "q-fossil-subsidies": ["climate", "business_subsidies", "rural"],
  "q-tki-target": ["education", "business_subsidies", "fiscal_tightness"],
  "q-edu-cuts": ["education", "fiscal_tightness", "redistribution"],
  "q-tk-uudistus-vaikutus": [
    "social_security",
    "redistribution",
    "fiscal_tightness",
  ],
  "q-poverty-trend": ["redistribution", "social_security", "tax_level"],
  "q-rural-funding": ["rural", "eu", "climate"],
  "q-migration-cost": ["immigration", "fiscal_tightness", "social_security"],
  "q-defense-2pct": ["security", "eu", "fiscal_tightness"],
  "q-regional-equality": ["rural", "public_services", "redistribution"],
  "q-impact-evaluation": ["fiscal_tightness", "public_services", "education"],
  "q-policy-coherence": ["fiscal_tightness", "tax_level", "social_security"],
  "q-cross-cabinet": [
    "fiscal_tightness",
    "public_services",
    "climate",
    "social_security",
  ],
};

// Liitetään ydinDimensiot kaikkiin kysymyksiin jälkikäteen yllä olevasta
// rekisteristä — säilyttää PoliticalQuestion-objektit puhtaina.
POLITICAL_QUESTIONS.forEach((q) => {
  q.ydinDimensiot = QUESTION_CORE_DIMENSIONS[q.id] ?? [];
});

/** Apufunktio: kuinka monelle puolueen kysymyksistä sovellus voi nykyisin vastata. */
export function partyCoverage(
  partyId: string
): { kattaa: number; osittain: number; puuttuu: number; total: number } {
  const qs = POLITICAL_QUESTIONS.filter((q) => q.esittäjät.includes(partyId));
  return {
    total: qs.length,
    kattaa: qs.filter((q) => q.kattavuus === "kattaa").length,
    osittain: qs.filter((q) => q.kattavuus === "osittain").length,
    puuttuu: qs.filter((q) => q.kattavuus === "puuttuu").length,
  };
}
