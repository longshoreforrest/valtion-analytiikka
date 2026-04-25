/**
 * Budjettineuvotteluiden ja talouspolitiikan keskeiset sidosryhmät.
 *
 * Visualisointi: bipartite-verkko, jossa vasemmalla puolueet ja oikealla
 * sidosryhmät; viiva = vaikutuskanava (lähellä / kuullaan / etujärjestösuhde).
 *
 * Lähteet:
 *  - Sidosryhmien omat kotisivut, hallituksen ohjelma, valiokuntien
 *    kuulemiset (eduskunta.fi).
 */

export type SidosryhmäTyyppi =
  | "etujärjestö"
  | "ajatuspaja"
  | "tutkimuslaitos"
  | "valtion-elin"
  | "etujärjestöt-julkinen"
  | "kansainvälinen";

export interface Stakeholder {
  id: string;
  nimi: string;
  tyyppi: SidosryhmäTyyppi;
  kuvaus: string;
  url: string;
  /** Mitkä puolueet tyypillisesti lähinnä — vaikutuskanava, ei sopimus. */
  lähinPuolueita: string[];
  /** Tärkeimmät teemat joihin sidosryhmä vaikuttaa */
  teemat: string[];
}

export const STAKEHOLDERS: Stakeholder[] = [
  // Työmarkkinajärjestöt
  {
    id: "ek",
    nimi: "Elinkeinoelämän keskusliitto (EK)",
    tyyppi: "etujärjestö",
    kuvaus:
      "Suurin työnantajien etujärjestö. Vaikuttaa erityisesti yritys- ja työllisyyspolitiikkaan.",
    url: "https://ek.fi",
    lähinPuolueita: ["kok", "rkp", "kd", "liik"],
    teemat: ["Verotus", "Työmarkkinat", "Elinkeinopolitiikka", "TKI"],
  },
  {
    id: "sak",
    nimi: "Suomen Ammattiliittojen Keskusjärjestö (SAK)",
    tyyppi: "etujärjestö",
    kuvaus:
      "Suurin palkansaajien keskusjärjestö, edustaa noin miljoonaa palkansaajaa.",
    url: "https://www.sak.fi",
    lähinPuolueita: ["sdp", "vas", "vihr"],
    teemat: ["Sosiaaliturva", "Työmarkkinat", "Tulopolitiikka"],
  },
  {
    id: "sttk",
    nimi: "STTK",
    tyyppi: "etujärjestö",
    kuvaus:
      "Toimihenkilöiden keskusjärjestö, painottaa hyvinvointia ja koulutusta.",
    url: "https://www.sttk.fi",
    lähinPuolueita: ["sdp", "vihr", "kesk"],
    teemat: ["Koulutus", "Sosiaaliturva", "Työmarkkinat"],
  },
  {
    id: "akava",
    nimi: "Akava",
    tyyppi: "etujärjestö",
    kuvaus:
      "Korkeasti koulutettujen palkansaajien keskusjärjestö.",
    url: "https://akava.fi",
    lähinPuolueita: ["kok", "vihr", "rkp", "sdp"],
    teemat: ["Koulutus", "TKI", "Verotus"],
  },
  {
    id: "sy",
    nimi: "Suomen Yrittäjät (SY)",
    tyyppi: "etujärjestö",
    kuvaus: "Pk-yrittäjien etujärjestö.",
    url: "https://www.yrittajat.fi",
    lähinPuolueita: ["kok", "ps", "kesk", "rkp", "kd", "liik"],
    teemat: ["Yritystuet", "Verotus", "Sääntelyn purku"],
  },
  {
    id: "mtk",
    nimi: "MTK — Maa- ja metsätaloustuottajain Keskusliitto",
    tyyppi: "etujärjestö",
    kuvaus: "Maa- ja metsätalousyrittäjien etujärjestö.",
    url: "https://www.mtk.fi",
    lähinPuolueita: ["kesk", "ps", "kok"],
    teemat: ["Maatalous", "Maaseutupolitiikka", "Ilmasto"],
  },

  // Kuntakentän järjestöt
  {
    id: "kuntaliitto",
    nimi: "Kuntaliitto",
    tyyppi: "etujärjestöt-julkinen",
    kuvaus: "Kuntien ja hyvinvointialueiden edunvalvoja.",
    url: "https://www.kuntaliitto.fi",
    lähinPuolueita: ["kesk", "kok", "sdp", "rkp", "kd"],
    teemat: ["Kuntatalous", "Sote", "Aluepolitiikka"],
  },

  // Ajatuspajat
  {
    id: "eva",
    nimi: "EVA — Elinkeinoelämän valtuuskunta",
    tyyppi: "ajatuspaja",
    kuvaus:
      "Markkinatalouden ajatuspaja. Tuottaa raportteja taloudesta ja yhteiskunnasta.",
    url: "https://www.eva.fi",
    lähinPuolueita: ["kok", "rkp", "kd", "liik"],
    teemat: ["Verotus", "Sopeutus", "Markkinatalous"],
  },
  {
    id: "kalevi-sorsa",
    nimi: "Kalevi Sorsa -säätiö",
    tyyppi: "ajatuspaja",
    kuvaus: "Sosialidemokraattinen ajatuspaja.",
    url: "https://sorsafoundation.fi",
    lähinPuolueita: ["sdp"],
    teemat: ["Hyvinvointivaltio", "Verotus", "Tulonjako"],
  },
  {
    id: "libera",
    nimi: "Libera-säätiö",
    tyyppi: "ajatuspaja",
    kuvaus: "Liberaali ajatuspaja, painottaa markkinoita ja yksilönvapautta.",
    url: "https://www.libera.fi",
    lähinPuolueita: ["kok", "rkp", "liik"],
    teemat: ["Sääntelyn purku", "Verotus"],
  },
  {
    id: "e2",
    nimi: "e2 Tutkimus",
    tyyppi: "ajatuspaja",
    kuvaus: "Riippumaton tutkimus- ja ajatuspaja, lähellä keskustaa.",
    url: "https://www.e2.fi",
    lähinPuolueita: ["kesk", "rkp", "sdp"],
    teemat: ["Aluepolitiikka", "Yhteiskunta"],
  },
  {
    id: "suomen-toivo",
    nimi: "Suomen Toivo -säätiö",
    tyyppi: "ajatuspaja",
    kuvaus: "Kokoomustaustainen ajatuspaja.",
    url: "https://toivo.fi",
    lähinPuolueita: ["kok"],
    teemat: ["Talouspolitiikka", "Konservatismi"],
  },
  {
    id: "vasemmistofoorumi",
    nimi: "Vasemmistofoorumi",
    tyyppi: "ajatuspaja",
    kuvaus: "Vasemmistolainen ajatuspaja.",
    url: "https://vasemmistofoorumi.fi",
    lähinPuolueita: ["vas"],
    teemat: ["Verotus", "Tulonjako", "Hyvinvointi"],
  },
  {
    id: "visio",
    nimi: "Visio-säätiö",
    tyyppi: "ajatuspaja",
    kuvaus: "Vihreä ajatuspaja.",
    url: "https://www.visili.fi",
    lähinPuolueita: ["vihr"],
    teemat: ["Ilmasto", "Vihreä siirtymä"],
  },
  {
    id: "suomen-perusta",
    nimi: "Suomen Perusta",
    tyyppi: "ajatuspaja",
    kuvaus: "Perussuomalaisten taustainen ajatuspaja.",
    url: "https://suomenperusta.fi",
    lähinPuolueita: ["ps"],
    teemat: ["Maahanmuutto", "Talouspolitiikka"],
  },

  // Tutkimuslaitokset
  {
    id: "vatt",
    nimi: "VATT — Valtion taloudellinen tutkimuskeskus",
    tyyppi: "tutkimuslaitos",
    kuvaus:
      "Valtion taloustieteellinen tutkimuslaitos. Mikrosimulointi (SISU), VEROMOD, vaikuttavuusarvioinnit.",
    url: "https://vatt.fi",
    lähinPuolueita: [],
    teemat: ["Verotus", "Sosiaaliturva", "Vaikuttavuus", "Mikrosimulointi"],
  },
  {
    id: "etla",
    nimi: "ETLA — Elinkeinoelämän tutkimuslaitos",
    tyyppi: "tutkimuslaitos",
    kuvaus: "Elinkeinoelämän taloustieteellinen tutkimuslaitos.",
    url: "https://www.etla.fi",
    lähinPuolueita: ["kok", "rkp"],
    teemat: ["Talous", "Työllisyys", "Yritysverotus"],
  },
  {
    id: "labore",
    nimi: "Labore (entinen Palkansaajien tutkimuslaitos)",
    tyyppi: "tutkimuslaitos",
    kuvaus: "Palkansaajaliikkeen taustainen tutkimuslaitos.",
    url: "https://labore.fi",
    lähinPuolueita: ["sdp", "vas"],
    teemat: ["Työllisyys", "Sosiaaliturva", "Tulonjako"],
  },
  {
    id: "pt",
    nimi: "PTT — Pellervon taloustutkimus",
    tyyppi: "tutkimuslaitos",
    kuvaus: "Maatalous- ja kuntataloustutkimus.",
    url: "https://www.ptt.fi",
    lähinPuolueita: ["kesk"],
    teemat: ["Maatalous", "Kuntatalous", "Aluetalous"],
  },
  {
    id: "suomenpankki",
    nimi: "Suomen Pankki",
    tyyppi: "valtion-elin",
    kuvaus:
      "Keskuspankki, julkaisee Euro & Talous -ennusteita ja arvioi rahapolitiikan.",
    url: "https://www.suomenpankki.fi",
    lähinPuolueita: [],
    teemat: ["Kasvuennusteet", "Korot", "Vakaus"],
  },

  // Valtion elimet
  {
    id: "vm",
    nimi: "Valtiovarainministeriö (VM)",
    tyyppi: "valtion-elin",
    kuvaus: "Hallituksen talouspolitiikan ydintoimija.",
    url: "https://vm.fi",
    lähinPuolueita: [],
    teemat: ["Budjetti", "Vero", "Julkinen talous"],
  },
  {
    id: "vtv",
    nimi: "Valtiontalouden tarkastusvirasto (VTV)",
    tyyppi: "valtion-elin",
    kuvaus:
      "Eduskunnan yhteydessä toimiva ulkoinen tarkastusvirasto, tarkastaa valtion taloutta.",
    url: "https://www.vtv.fi",
    lähinPuolueita: [],
    teemat: ["Vaikuttavuus", "Tilivelvollisuus"],
  },
  {
    id: "tpan",
    nimi: "Talouspolitiikan arviointineuvosto",
    tyyppi: "valtion-elin",
    kuvaus:
      "Riippumaton akateeminen neuvosto, joka arvioi talouspolitiikan saavutuksia ja tavoitteiden toteutumista.",
    url: "https://www.talouspolitiikanarviointineuvosto.fi/",
    lähinPuolueita: [],
    teemat: ["Vaikuttavuus", "Sopeutus", "Sääntöjen toimivuus"],
  },
  {
    id: "ilmastopaneeli",
    nimi: "Suomen ilmastopaneeli",
    tyyppi: "valtion-elin",
    kuvaus:
      "Tieteellinen elin joka tukee ilmastopolitiikan suunnittelua ja arviointia.",
    url: "https://www.ilmastopaneeli.fi",
    lähinPuolueita: [],
    teemat: ["Ilmasto", "Päästövähennykset"],
  },

  // Kansainväliset
  {
    id: "oecd",
    nimi: "OECD",
    tyyppi: "kansainvälinen",
    kuvaus: "Tuottaa Suomi-arvioita ja talouspolitiikan vertailuja.",
    url: "https://www.oecd.org/finland/",
    lähinPuolueita: [],
    teemat: ["Vertailu", "Vaikuttavuus", "Verot"],
  },
  {
    id: "imf",
    nimi: "IMF",
    tyyppi: "kansainvälinen",
    kuvaus:
      "Article IV -konsultaatiot Suomesta, julkisen talouden suosituksia.",
    url: "https://www.imf.org/en/Countries/FIN",
    lähinPuolueita: [],
    teemat: ["Sopeutus", "Velka", "Rahoitusvakaus"],
  },
  {
    id: "ec",
    nimi: "EU-komissio (Euroopan ohjausjakso)",
    tyyppi: "kansainvälinen",
    kuvaus:
      "Eurooppalainen ohjausjakso, maakohtaiset suositukset, finanssisäännöt.",
    url: "https://commission.europa.eu",
    lähinPuolueita: [],
    teemat: ["Finanssisäännöt", "EU-rahoitus", "DSA"],
  },
];
