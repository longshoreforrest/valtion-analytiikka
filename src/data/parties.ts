/**
 * Poliittisten puolueiden malli budjettianalyysiä varten.
 *
 * Sisältö:
 *  - PARTIES: eduskuntapuolueet 2023–2027 vaalikaudella, puhemiehistö
 *    budjettineuvotteluissa, brändivärit, hallitus/oppositio-asema.
 *  - VALUE_DIMENSIONS: arvomallin dimensiot ja niiden tulkinta.
 *  - PARTY_VALUES: puoluekohtaiset arvot kullakin dimensiolla (0–10) ja
 *    lähdeviite jokaiselle pisteelle.
 *  - PARTY_QUESTIONS: kunkin puolueen tyypillisesti esittämät kysymykset
 *    valtion budjetista, ja arvio siitä missä määrin tämä sovellus voi
 *    vastata kysymykseen nykydatan pohjalta.
 *  - STAKEHOLDERS: budjetin keskeisimmät sidosryhmät ja niiden suhde
 *    puolueisiin.
 *
 * KAIKKI arvomalli- ja sidosryhmäarviot ovat
 *  (a) johdettu pääosin julkisista puolueohjelmista, vaalikoneista ja
 *      kommentaareista (lähteet kentässä `lähde`),
 *  (b) yksinkertaistuksia, joiden tarkoitus on havainnollistaa puolueiden
 *      välisiä suhteita ja painotuseroja — eivät absoluuttisia mittauksia.
 * Jokainen pistearvo on perusteltu lähdeviitteellä ja siten käyttäjän
 * tarkistettavissa.
 */

export type Lohko = "hallitus" | "oppositio";

export interface PartyRepresentative {
  rooli: string;
  nimi: string;
  /** Lyhyt kuvaus roolista budjettineuvottelussa */
  budjettirooli?: string;
}

export interface Party {
  id: string;
  /** Lyhenne (KOK, PS, …) */
  lyhenne: string;
  nimi: string;
  /** Leveys eduskunnassa (paikkamäärä 200:sta, 2023 vaalit) */
  paikat: number;
  lohko: Lohko;
  /** Brändiväri puolueen visuaalisissa */
  vari: string;
  /** Lyhyt kuvaus puolueen poliittisesta linjasta */
  kuvaus: string;
  /** Edustajat budjettineuvotteluissa ja talouspolitiikkapäätöksissä */
  edustajat: PartyRepresentative[];
  /** URL puolueen viralliselle ohjelmasivulle */
  ohjelmaUrl: string;
  /** Puolueen virallinen kotisivu */
  kotisivu: string;
}

/** Eduskuntapuolueet (vaalikausi 2023–2027). Paikkamäärät: vaalitulos 2.4.2023. */
export const PARTIES: Party[] = [
  {
    id: "kok",
    lyhenne: "KOK",
    nimi: "Kansallinen Kokoomus",
    paikat: 48,
    lohko: "hallitus",
    vari: "#0A6FCC",
    kuvaus:
      "Suurin hallituspuolue ja pääministeripuolue. Painottaa julkisen talouden tasapainoa, verojen alentamista ja työllisyysasteen nostamista markkinaehtoisin keinoin.",
    edustajat: [
      {
        rooli: "Puheenjohtaja, pääministeri",
        nimi: "Petteri Orpo",
        budjettirooli: "Vetää hallituksen budjettineuvottelut ja kehysriihen.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Matias Marttinen",
        budjettirooli: "Linjaa kokoomuksen kannan eduskuntakäsittelyssä.",
      },
      {
        rooli: "Valtiovarainvaliokunnan jäsen",
        nimi: "Markku Eestilä",
        budjettirooli: "Edustaa puoluetta valtiovarainvaliokunnan käsittelyssä.",
      },
    ],
    ohjelmaUrl: "https://www.kokoomus.fi/julkaisut/",
    kotisivu: "https://www.kokoomus.fi",
  },
  {
    id: "ps",
    lyhenne: "PS",
    nimi: "Perussuomalaiset",
    paikat: 46,
    lohko: "hallitus",
    vari: "#0050A0",
    kuvaus:
      "Toiseksi suurin puolue ja keskeinen hallituskumppani. Korostaa kansallisia etuja, maahanmuuton tiukentamista, leikkauksia kehitysyhteistyöhön ja maaseudun palvelujen turvaamista.",
    edustajat: [
      {
        rooli: "Puheenjohtaja, valtiovarainministeri",
        nimi: "Riikka Purra",
        budjettirooli:
          "Vastaa valtiovarainministeriönä budjetin valmistelusta ja esittelee TAE:n eduskunnalle.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Jani Mäkelä",
        budjettirooli: "Koordinoi PS:n linjan eduskuntakäsittelyssä.",
      },
    ],
    ohjelmaUrl: "https://www.perussuomalaiset.fi/tietoa-meista/puolueohjelma/",
    kotisivu: "https://www.perussuomalaiset.fi",
  },
  {
    id: "sdp",
    lyhenne: "SDP",
    nimi: "Suomen Sosialidemokraattinen Puolue",
    paikat: 43,
    lohko: "oppositio",
    vari: "#E11D48",
    kuvaus:
      "Suurin oppositiopuolue. Painottaa hyvinvointivaltion palveluja, tuloeroja kaventavaa verotusta, työelämän turvaa ja vahvaa julkista koulutusta.",
    edustajat: [
      {
        rooli: "Puheenjohtaja",
        nimi: "Antti Lindtman",
        budjettirooli:
          "Vetää SDP:n vaihtoehtobudjetin valmistelua ja debatoi pääministerin kanssa.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Tytti Tuppurainen",
        budjettirooli: "Linjaa eduskuntaryhmän äänestyskäyttäytymisen.",
      },
    ],
    ohjelmaUrl: "https://www.sdp.fi/fi/poliittinen-ohjelma/",
    kotisivu: "https://www.sdp.fi",
  },
  {
    id: "kesk",
    lyhenne: "KESK",
    nimi: "Suomen Keskusta",
    paikat: 23,
    lohko: "oppositio",
    vari: "#1B873F",
    kuvaus:
      "Maaseudun, alueellisen tasa-arvon ja perheyrittäjyyden puolue. Korostaa hajautettua hallintoa, ruokaturvaa ja vihreää siirtymää alueet huomioiden.",
    edustajat: [
      {
        rooli: "Puheenjohtaja",
        nimi: "Antti Kaikkonen",
        budjettirooli: "Vastaa puolueen vaihtoehtoisista talouslinjauksista.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Markus Lohi",
        budjettirooli: "Vie keskustan kannat valtiovarainvaliokuntaan.",
      },
    ],
    ohjelmaUrl: "https://keskusta.fi/julkaisut/",
    kotisivu: "https://keskusta.fi",
  },
  {
    id: "vihr",
    lyhenne: "VIHR",
    nimi: "Vihreä liitto",
    paikat: 13,
    lohko: "oppositio",
    vari: "#61BD5A",
    kuvaus:
      "Ympäristö-, ilmasto- ja koulutuspainotteinen puolue. Korostaa hiilineutraaliutta, oikeudenmukaista siirtymää, koulutuksen rahoitusta ja vähemmistöjen oikeuksia.",
    edustajat: [
      {
        rooli: "Puheenjohtaja",
        nimi: "Sofia Virta",
        budjettirooli: "Esittää vihreiden vaihtoehtobudjetin pääpiirteet.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Atte Harjanne",
        budjettirooli: "Koordinoi eduskuntaryhmän kannat.",
      },
    ],
    ohjelmaUrl: "https://www.vihreat.fi/ohjelmat/",
    kotisivu: "https://www.vihreat.fi",
  },
  {
    id: "vas",
    lyhenne: "VAS",
    nimi: "Vasemmistoliitto",
    paikat: 11,
    lohko: "oppositio",
    vari: "#C2185B",
    kuvaus:
      "Tuloeroja kaventava ja palveluja puolustava vasemmistopuolue. Korostaa progressiivista verotusta, julkista terveydenhuoltoa ja työntekijöiden oikeuksia.",
    edustajat: [
      {
        rooli: "Puheenjohtaja",
        nimi: "Minja Koskela",
        budjettirooli:
          "Linjaa vasemmistoliiton kannan budjettiin ja kehysriiheen.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Jussi Saramo",
        budjettirooli: "Vastaa eduskuntaryhmän käytännön työstä.",
      },
    ],
    ohjelmaUrl: "https://vasemmisto.fi/poliittinen-ohjelma/",
    kotisivu: "https://vasemmisto.fi",
  },
  {
    id: "rkp",
    lyhenne: "RKP",
    nimi: "Suomen ruotsalainen kansanpuolue",
    paikat: 9,
    lohko: "hallitus",
    vari: "#FFD500",
    kuvaus:
      "Liberaali, kaksikielisyyttä, EU-myönteisyyttä ja markkinatalouden uudistuksia korostava hallituspuolue. Vahva yritysmyönteinen ja vientipainotteinen linja.",
    edustajat: [
      {
        rooli: "Puheenjohtaja",
        nimi: "Anders Adlercreutz",
        budjettirooli: "Edustaa RKP:tä hallituksen budjettineuvotteluissa.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Otto Andersson",
        budjettirooli: "Vie kannat valiokuntakäsittelyyn.",
      },
    ],
    ohjelmaUrl: "https://sfp.fi/sv/politik/partiprogram/",
    kotisivu: "https://sfp.fi",
  },
  {
    id: "kd",
    lyhenne: "KD",
    nimi: "Suomen Kristillisdemokraatit",
    paikat: 5,
    lohko: "hallitus",
    vari: "#1F75B5",
    kuvaus:
      "Kristilliseen arvopohjaan nojaava puolue. Korostaa perheiden tukea, vastuullista taloudenhoitoa ja syrjäytymisen ehkäisyä.",
    edustajat: [
      {
        rooli: "Puheenjohtaja, työministeri",
        nimi: "Sari Essayah",
        budjettirooli: "Hallituksen jäsenenä budjettineuvottelijana.",
      },
      {
        rooli: "Eduskuntaryhmän puheenjohtaja",
        nimi: "Päivi Räsänen",
        budjettirooli: "Linjaa eduskuntaryhmän kannat.",
      },
    ],
    ohjelmaUrl: "https://www.kd.fi/poliittinen-ohjelma/",
    kotisivu: "https://www.kd.fi",
  },
  {
    id: "liik",
    lyhenne: "LIIK",
    nimi: "Liike Nyt",
    paikat: 1,
    lohko: "oppositio",
    vari: "#E76F00",
    kuvaus:
      "Yrittäjyyttä, suoraa demokratiaa ja byrokratian purkamista korostava liike. Pieni mutta usein välimallin puolue talousasioissa.",
    edustajat: [
      {
        rooli: "Puheenjohtaja",
        nimi: "Harry Harkimo",
        budjettirooli: "Liikkeen ainoa kansanedustaja.",
      },
    ],
    ohjelmaUrl: "https://liikenyt.fi/ohjelma/",
    kotisivu: "https://liikenyt.fi",
  },
];

/** Arvomallin dimensiot. Asteikko 0–10, jokaisen ääripäät selitetty. */
export interface ValueDimension {
  id: string;
  nimi: string;
  /** Mitä pieni arvo (0) tarkoittaa */
  matala: string;
  /** Mitä suuri arvo (10) tarkoittaa */
  korkea: string;
  /** Mihin budjetin/sovelluksen näkymään dimensio kytkeytyy */
  kytkeytyy: string;
}

export const VALUE_DIMENSIONS: ValueDimension[] = [
  {
    id: "fiscal_tightness",
    nimi: "Julkisen talouden sopeutus",
    matala: "Elvyttävä, velka kasvuvälineenä",
    korkea: "Tiukka säästö, alijäämäkuri",
    kytkeytyy: "Julkinen talous → EDP-velka, alijäämä; Kehysriihi 2026",
  },
  {
    id: "tax_level",
    nimi: "Verotuksen taso",
    matala: "Alentaa kokonaisveroastetta",
    korkea: "Korottaa, erityisesti progressiivisesti",
    kytkeytyy: "Pääluokka 28 (verotulot), tuloverotaulukot",
  },
  {
    id: "redistribution",
    nimi: "Tulonjaon tasaus",
    matala: "Markkinaehtoinen, kannustimia",
    korkea: "Voimakas tulonsiirtotasaus",
    kytkeytyy: "Pääluokat 33 (sote-etuudet), 32 (työllisyys)",
  },
  {
    id: "climate",
    nimi: "Ilmasto- ja ympäristökunnianhimo",
    matala: "Pragmaattinen, kustannuskriittinen",
    korkea: "Kunnianhimoinen, päästövähennysetupainotteinen",
    kytkeytyy: "Pääluokka 35 (ympäristö), 30 (maa- ja metsätalous)",
  },
  {
    id: "eu",
    nimi: "EU-myönteisyys",
    matala: "Kriittinen, kansallinen päätösvalta",
    korkea: "Federalistinen, vahva integraatio",
    kytkeytyy: "EU-jäsenmaksut, EU-vertailu (Eurostat COFOG)",
  },
  {
    id: "security",
    nimi: "Turvallisuus ja maanpuolustus",
    matala: "Maltillinen, ei korotuksia",
    korkea: "Vahva panostus, NATO-yhteensopivuus",
    kytkeytyy: "Pääluokka 27 (puolustus)",
  },
  {
    id: "immigration",
    nimi: "Maahanmuuttopolitiikan avoimuus",
    matala: "Tiukka, rajoittava",
    korkea: "Salliva, työperäistä edistävä",
    kytkeytyy: "Pääluokka 26 (sisäministeriö), 32 (kotouttaminen)",
  },
  {
    id: "public_services",
    nimi: "Julkisten palvelujen rooli",
    matala: "Palvelutuotanto markkinoille",
    korkea: "Vahva julkinen tuotanto",
    kytkeytyy: "Pääluokka 33 (sote), hyvinvointialueet",
  },
  {
    id: "education",
    nimi: "Koulutus- ja TKI-panostus",
    matala: "Karsii rahoitusta",
    korkea: "Kasvattaa rahoitusta",
    kytkeytyy: "Pääluokka 29 (OKM), TKI-rahoitus 4 % BKT",
  },
  {
    id: "business_subsidies",
    nimi: "Yritystuet ja elinkeinopolitiikka",
    matala: "Karsii tukia, kilpailuneutraliteetti",
    korkea: "Säilyttää/kasvattaa tukia",
    kytkeytyy: "Pääluokka 32 (työ ja elinkeinot)",
  },
  {
    id: "rural",
    nimi: "Maatalous- ja maaseututuet",
    matala: "Karsii, kohdistaa uudelleen",
    korkea: "Säilyttää, vahvistaa ruokaturvaa",
    kytkeytyy: "Pääluokka 30 (maa- ja metsätalous)",
  },
  {
    id: "social_security",
    nimi: "Sosiaaliturvan taso",
    matala: "Kannustaa työhön, leikkaa etuuksia",
    korkea: "Laajentaa, indeksikorotukset",
    kytkeytyy: "Pääluokka 33, työttömyysturva, asumistuki",
  },
];

export interface PartyValueScore {
  /** Asteikolla 0–10 */
  arvo: number;
  /** Vapaa muotoinen perustelu pisteelle */
  perustelu: string;
  /** Lähde — esim. "YLE Vaalikone 2023, kysymys 12" tai "Hallitusohjelma s. 124" */
  lähde: string;
  /** Lähde-URL jos saatavilla */
  lähdeUrl?: string;
}

/** Yksittäisen puolueen pisteet kullakin dimensiolla. */
export type PartyValueProfile = Record<string, PartyValueScore>;

/**
 * Puolueiden arvopisteet. Asteikko 0–10. Pisteytys perustuu pääosin julkisiin
 * vaalikoneisiin (YLE, HS) sekä puolueohjelmiin ja hallitusohjelmaan.
 *
 * Huomaa että arviot ovat suuntaa-antavia ja yksinkertaistavat puolueiden
 * monisävyisiä kantoja. Tarkoitus on havainnollistaa eroja ja yhtäläisyyksiä.
 */
export const PARTY_VALUES: Record<string, PartyValueProfile> = {
  kok: {
    fiscal_tightness: {
      arvo: 9,
      perustelu:
        "Hallitusohjelman keskeinen tavoite on 6 mrd € sopeutus 2027 mennessä; kehysriihi 2026 jatkaa tiukkaa linjaa.",
      lähde: "Hallitusohjelma 20.6.2023, s. 9–14; Kehysriihi 22.4.2026 -tiedotus",
      lähdeUrl: "https://valtioneuvosto.fi/hallitusohjelma",
    },
    tax_level: {
      arvo: 2,
      perustelu:
        "Tavoittelee tuloverojen alennuksia ja yritysverotuksen kilpailukykyä; vastustaa varallisuusveroa.",
      lähde: "Kokoomuksen tavoiteohjelma 2023; YLE Vaalikone 2023",
      lähdeUrl: "https://yle.fi/uutiset/3-12793333",
    },
    redistribution: {
      arvo: 3,
      perustelu:
        "Painottaa työnteon kannustavuutta, etuuksien vastikkeellisuutta ja työllisyysasteen nostoa.",
      lähde: "Hallitusohjelma 2023, työllisyystoimet",
    },
    climate: {
      arvo: 6,
      perustelu:
        "Sitoutuu hiilineutraalisuuteen 2035; korostaa kustannustehokkaita ja markkinaehtoisia keinoja.",
      lähde: "Kokoomuksen ilmasto-ohjelma 2022",
    },
    eu: {
      arvo: 8,
      perustelu:
        "Vahvasti EU-myönteinen, sisämarkkinoiden ja yhteisten puolustusinvestointien kannattaja.",
      lähde: "Kokoomuksen Eurooppa-ohjelma 2024",
    },
    security: {
      arvo: 9,
      perustelu:
        "Tukee NATO-jäsenyyttä; puolustusbudjetti yli 2 % BKT:sta on linjaus.",
      lähde: "Hallitusohjelma 2023, ulko- ja turvallisuuspolitiikka",
    },
    immigration: {
      arvo: 5,
      perustelu:
        "Painottaa työperäistä maahanmuuttoa; tukee humanitaarisen maahanmuuton tiukennuksia.",
      lähde: "Hallitusohjelma 2023, maahanmuutto-osio",
    },
    public_services: {
      arvo: 4,
      perustelu:
        "Avoin yksityisen tuotannon laajemmalle hyödyntämiselle sotessa; valinnanvapauden kannattaja.",
      lähde: "Kokoomuksen sote-linjaukset 2022–2023",
    },
    education: {
      arvo: 6,
      perustelu:
        "TKI-panostuksen 4 % BKT 2030 -tavoite; samalla joitain leikkauksia korkeakoulujen rahoitukseen.",
      lähde: "TKI-laki 2023; OKM:n kehyspäätökset",
    },
    business_subsidies: {
      arvo: 5,
      perustelu:
        "Avoin yritystukien karsimiselle, mutta säilyttää innovaatiotukia (Business Finland).",
      lähde: "Kehysriihi 2024–2026",
    },
    rural: {
      arvo: 4,
      perustelu:
        "Ei voimakkaasti maaseutupainotteinen; korostaa elintarvikeketjun kilpailukykyä.",
      lähde: "Maatalouspoliittiset linjaukset 2023",
    },
    social_security: {
      arvo: 3,
      perustelu:
        "Asumistuen leikkaus, indeksijäädytykset, työttömyysturvan porrastus = sosiaaliturvan tiukennus.",
      lähde: "Hallitusohjelma 2023, sosiaaliturvauudistus",
    },
  },
  ps: {
    fiscal_tightness: {
      arvo: 8,
      perustelu:
        "Tukee sopeutusta mutta korostaa kohdentamista (kehitysapu, maahanmuutto) palvelujen sijaan.",
      lähde: "PS:n vaihtoehtobudjetti 2025",
    },
    tax_level: {
      arvo: 4,
      perustelu:
        "Ei halua korottaa työn verotusta; valmis korottamaan haittaveroja ja varakkaiden veroja eräissä kohteissa.",
      lähde: "PS:n verolinjaukset 2024",
    },
    redistribution: {
      arvo: 5,
      perustelu:
        "Pieni- ja keskituloisten ostovoiman puolustaja, mutta vastustaa laajaa redistribuutiota.",
      lähde: "Puolueohjelma 2019, talousluku",
    },
    climate: {
      arvo: 2,
      perustelu:
        "Suhtautuu kriittisesti EU:n ilmastopolitiikkaan ja kustannuksiin; vastustaa polttoaineverojen korotuksia.",
      lähde: "PS:n ilmasto-ohjelma 2022",
    },
    eu: {
      arvo: 2,
      perustelu:
        "EU-kriittinen, vastustaa yhteisvelkaa ja federalistisia avauksia.",
      lähde: "PS:n EU-ohjelma 2024",
    },
    security: {
      arvo: 8,
      perustelu:
        "Tukee NATO-jäsenyyttä ja vahvaa kansallista puolustusta.",
      lähde: "PS:n turvallisuuspoliittiset linjaukset 2022",
    },
    immigration: {
      arvo: 1,
      perustelu:
        "Tiukin maahanmuuttolinja; vastustaa humanitaarista maahanmuuttoa ja perheenyhdistämistä.",
      lähde: "Puolueohjelma 2019; YLE Vaalikone 2023",
    },
    public_services: {
      arvo: 6,
      perustelu:
        "Puolustaa julkista palvelutuotantoa erityisesti maaseudulla; ei dogmaattisesti markkinaehtoinen.",
      lähde: "PS:n maaseutuohjelma 2023",
    },
    education: {
      arvo: 5,
      perustelu:
        "Kannattaa peruskoulutuksen vahvistamista, suhtautuu varauksellisesti korkeakoulujen laajenemiseen.",
      lähde: "PS:n koulutuslinjaukset 2024",
    },
    business_subsidies: {
      arvo: 6,
      perustelu:
        "Varauksellinen suuryritysten tukien suhteen, kannattaa pk-yritystukia.",
      lähde: "Vaihtoehtobudjetti 2025",
    },
    rural: {
      arvo: 8,
      perustelu:
        "Vahva maaseutu- ja maatilatukien puolustaja, ruokaturvan korostaja.",
      lähde: "PS:n maatalousohjelma 2023",
    },
    social_security: {
      arvo: 5,
      perustelu:
        "Säilyttäisi eläkkeiden indeksikorotukset; karsii työttömyysturvasta ja maahanmuuttajaetuuksista.",
      lähde: "PS:n vaihtoehtobudjetti 2025",
    },
  },
  sdp: {
    fiscal_tightness: {
      arvo: 4,
      perustelu:
        "Tunnistaa sopeutustarpeen mutta vastustaa hallituksen mittaluokkaa; korostaa työllisyyttä ja kasvua sopeutuksen sijaan.",
      lähde: "SDP:n vaihtoehtobudjetti 2025",
    },
    tax_level: {
      arvo: 8,
      perustelu:
        "Tukee progressiivisten verojen korotusta, varallisuusveroa ja pörssiveroa.",
      lähde: "SDP:n vero-ohjelma 2023",
    },
    redistribution: {
      arvo: 8,
      perustelu:
        "Hyvinvointivaltion ja tulonsiirtojen puolustaja; pohjoismainen malli.",
      lähde: "Puolueohjelma 2020",
    },
    climate: {
      arvo: 8,
      perustelu:
        "Tukee voimakasta ilmastopolitiikkaa, oikeudenmukaista siirtymää.",
      lähde: "SDP:n ilmasto-ohjelma 2023",
    },
    eu: {
      arvo: 8,
      perustelu:
        "Selkeästi EU-myönteinen, kannattaa yhteisvastuuta kriiseissä.",
      lähde: "SDP:n Eurooppa-ohjelma 2024",
    },
    security: {
      arvo: 8,
      perustelu:
        "Tuki NATO-prosessille; korostaa kokonaisturvallisuutta ja huoltovarmuutta.",
      lähde: "SDP:n turvallisuuslinjaukset 2022",
    },
    immigration: {
      arvo: 7,
      perustelu:
        "Maltillisesti salliva; korostaa kotouttamista ja työperäistä maahanmuuttoa.",
      lähde: "SDP:n maahanmuutto-ohjelma 2023",
    },
    public_services: {
      arvo: 9,
      perustelu:
        "Vahvasti julkisen palvelutuotannon kannattaja, soten yksityistämisen kriitikko.",
      lähde: "SDP:n sote-linjaukset 2024",
    },
    education: {
      arvo: 9,
      perustelu:
        "Painottaa peruskoulun, lukion ja korkeakoulujen rahoitusta; vastustaa hallituksen leikkauksia.",
      lähde: "SDP:n vaihtoehtobudjetti 2025",
    },
    business_subsidies: {
      arvo: 4,
      perustelu:
        "Avoin haitallisten ja tehottomien tukien karsimiselle.",
      lähde: "Talouspoliittiset linjaukset 2024",
    },
    rural: {
      arvo: 5,
      perustelu:
        "Tukee maatalouden tukia, mutta ei niiden kasvattamista.",
      lähde: "SDP:n maaseutuohjelma 2023",
    },
    social_security: {
      arvo: 8,
      perustelu:
        "Vastustaa indeksijäädytyksiä ja asumistuen leikkauksia; ajaa yleistä mallia (perustulopilotin jatko).",
      lähde: "Vaihtoehtobudjetti 2025",
    },
  },
  kesk: {
    fiscal_tightness: {
      arvo: 6,
      perustelu:
        "Hyväksyy sopeutuksen, mutta painottaa alueellista oikeudenmukaisuutta ja maaseutua.",
      lähde: "KESK:n vaihtoehtobudjetti 2025",
    },
    tax_level: {
      arvo: 4,
      perustelu:
        "Pitkälti maltillinen, ei suosi tuloverojen suuria korotuksia; valmis kohdistettuihin korotuksiin.",
      lähde: "Keskustan vero-ohjelma 2023",
    },
    redistribution: {
      arvo: 6,
      perustelu:
        "Aluepolitiikka tärkeä tasausväline; perinteisesti välimallin tulonjakopolitiikka.",
      lähde: "Puolueohjelma 2018",
    },
    climate: {
      arvo: 6,
      perustelu:
        "Sitoutuu ilmastotavoitteisiin mutta painottaa alueiden ja maatalouden olosuhteita.",
      lähde: "Keskustan ilmasto-ohjelma 2022",
    },
    eu: {
      arvo: 6,
      perustelu:
        "EU-myönteinen mutta varauksellinen yhteisvelan ja keskittämisen suhteen.",
      lähde: "Keskustan Eurooppa-linjaukset 2024",
    },
    security: {
      arvo: 8,
      perustelu:
        "Vahva tuki NATO-jäsenyydelle ja kokonaisturvallisuudelle.",
      lähde: "Keskustan turvallisuuslinjaukset 2022",
    },
    immigration: {
      arvo: 5,
      perustelu:
        "Maltillinen, työperäistä maahanmuuttoa tukeva, hyödyntäisi alueellisesti.",
      lähde: "Keskustan maahanmuutto-ohjelma 2023",
    },
    public_services: {
      arvo: 7,
      perustelu:
        "Korostaa palvelujen alueellista kattavuutta — usein julkisia ratkaisuja maaseudulla.",
      lähde: "Keskustan aluepolitiikkalinjaukset 2024",
    },
    education: {
      arvo: 7,
      perustelu:
        "Vastustanut korkeakoulujen leikkauksia; painottaa toisen asteen kattavuutta.",
      lähde: "Vaihtoehtobudjetti 2025",
    },
    business_subsidies: {
      arvo: 6,
      perustelu:
        "Tukee maatalouden ja maaseutuyrittäjyyden tukia, kohdennettua elinkeinopolitiikkaa.",
      lähde: "Keskustan elinkeino-ohjelma 2023",
    },
    rural: {
      arvo: 9,
      perustelu:
        "Maaseututukien vahvin puolustaja vihreiden ohella eri suunnasta.",
      lähde: "Keskustan maaseutuohjelma 2023",
    },
    social_security: {
      arvo: 6,
      perustelu:
        "Vastustaa asumistuen voimakkaita leikkauksia; kannattaa eläkkeiden indeksisuojaa.",
      lähde: "Vaihtoehtobudjetti 2025",
    },
  },
  vihr: {
    fiscal_tightness: {
      arvo: 4,
      perustelu:
        "Hyväksyy sopeutustarpeen mutta vastustaa hallituksen mallin tapaa kohdentaa leikkaukset; ajaa investointeja vihreään siirtymään.",
      lähde: "Vihreiden vaihtoehtobudjetti 2025",
    },
    tax_level: {
      arvo: 8,
      perustelu:
        "Korottaisi pääoma- ja varallisuusverotusta, päästöveroja, jäte- ja haittaveroja.",
      lähde: "Vihreiden vero-ohjelma 2023",
    },
    redistribution: {
      arvo: 8,
      perustelu:
        "Vahvasti tulonjakoa tasaava, perustulon kannattaja.",
      lähde: "Puolueohjelma 2022",
    },
    climate: {
      arvo: 10,
      perustelu:
        "Korkein ilmastokunnianhimo; hiilineutraali 2030, vahva päästöjen leikkaaminen.",
      lähde: "Vihreiden ilmasto-ohjelma 2023",
    },
    eu: {
      arvo: 9,
      perustelu:
        "Vahvasti EU-myönteinen, syvemmän integraation kannattaja.",
      lähde: "Vihreiden Eurooppa-ohjelma 2024",
    },
    security: {
      arvo: 7,
      perustelu:
        "NATO-myönteinen prosessin jälkeen; varauksellinen ydinaseiden suhteen.",
      lähde: "Vihreiden turvallisuuslinjaukset 2022",
    },
    immigration: {
      arvo: 9,
      perustelu:
        "Sallivin maahanmuuttolinja; oikeusvaltioperusteet, ihmisoikeudet keskiössä.",
      lähde: "Vihreiden maahanmuutto-ohjelma 2023",
    },
    public_services: {
      arvo: 8,
      perustelu:
        "Vahva julkisten palvelujen ja erityisesti varhaiskasvatuksen kannattaja.",
      lähde: "Sote- ja koulutuslinjaukset 2024",
    },
    education: {
      arvo: 10,
      perustelu:
        "Voimakkain vastustus korkeakoulujen ja tutkimuksen leikkauksille; TKI-tavoitteen 4 % vahva tuki.",
      lähde: "Vihreiden vaihtoehtobudjetti 2025",
    },
    business_subsidies: {
      arvo: 3,
      perustelu:
        "Karsisi fossiiliset tuet ja ympäristölle haitalliset; kohdistaisi vihreään siirtymään.",
      lähde: "Vihreiden talousohjelma 2023",
    },
    rural: {
      arvo: 5,
      perustelu:
        "Tukee maaseututukia ympäristötoimien ehdoilla; kasvinsuojeluaineiden tiukennukset.",
      lähde: "Vihreiden maaseutuohjelma 2023",
    },
    social_security: {
      arvo: 9,
      perustelu:
        "Perustulon ja indeksisuojan kannattaja; vastustaa asumistuen leikkauksia.",
      lähde: "Vaihtoehtobudjetti 2025",
    },
  },
  vas: {
    fiscal_tightness: {
      arvo: 2,
      perustelu:
        "Vastustaa sopeutusta nykyisessä mittaluokassa; korostaa investointeja ja työllisyyttä.",
      lähde: "VAS:n vaihtoehtobudjetti 2025",
    },
    tax_level: {
      arvo: 9,
      perustelu:
        "Vahvasti progressiivinen verotus, varallisuus- ja pääomaverotuksen kiristys.",
      lähde: "VAS:n vero-ohjelma 2023",
    },
    redistribution: {
      arvo: 10,
      perustelu:
        "Voimakkain tulonjakopolitiikka eduskuntapuolueista.",
      lähde: "Puolueohjelma 2019",
    },
    climate: {
      arvo: 9,
      perustelu:
        "Ilmastopainotteinen, oikeudenmukainen siirtymä keskiössä.",
      lähde: "VAS:n ilmasto-ohjelma 2023",
    },
    eu: {
      arvo: 6,
      perustelu:
        "EU-myönteinen mutta kriittinen markkinaliberaalille politiikalle ja sotilasintegraatiolle.",
      lähde: "VAS:n EU-ohjelma 2024",
    },
    security: {
      arvo: 5,
      perustelu:
        "NATO-jäsenyyteen suhtautuminen jakautunut puolueessa; korostaa kokonaisturvallisuutta ja kriisinhallintaa.",
      lähde: "VAS:n turvallisuuslinjaukset 2022",
    },
    immigration: {
      arvo: 9,
      perustelu:
        "Salliva, ihmisoikeusperusteinen maahanmuuttopolitiikka.",
      lähde: "Puolueohjelma 2019",
    },
    public_services: {
      arvo: 10,
      perustelu:
        "Vahvin julkisen palvelutuotannon puolustaja; soten yksityistämisen kriitikko.",
      lähde: "VAS:n sote-ohjelma 2024",
    },
    education: {
      arvo: 9,
      perustelu:
        "Vastustaa kaikkia koulutusleikkauksia; opintotuen ja varhaiskasvatuksen vahvistaminen.",
      lähde: "Vaihtoehtobudjetti 2025",
    },
    business_subsidies: {
      arvo: 3,
      perustelu:
        "Karsisi yritystukia voimakkaasti, erityisesti suurille yrityksille ja fossiilisille.",
      lähde: "VAS:n talousohjelma 2023",
    },
    rural: {
      arvo: 5,
      perustelu:
        "Maatalouden tuet ympäristöehtojen ja oikeudenmukaisen kohdentamisen kautta.",
      lähde: "VAS:n maaseutuohjelma 2023",
    },
    social_security: {
      arvo: 10,
      perustelu:
        "Voimakkain laajennus, perustulo, asumistuen palautus, työttömyysturvan parantaminen.",
      lähde: "Vaihtoehtobudjetti 2025",
    },
  },
  rkp: {
    fiscal_tightness: {
      arvo: 7,
      perustelu:
        "Tukee hallituksen sopeutuslinjaa mutta kannattaa kasvua tukevia investointeja.",
      lähde: "Hallitusohjelma 2023",
    },
    tax_level: {
      arvo: 3,
      perustelu:
        "Liberaalia veropolitiikkaa, työn verotuksen alentaminen.",
      lähde: "RKP:n talouslinjaukset 2023",
    },
    redistribution: {
      arvo: 5,
      perustelu:
        "Maltillinen markkinatalouden ja sosiaaliturvan välissä.",
      lähde: "Puolueohjelma 2018",
    },
    climate: {
      arvo: 7,
      perustelu:
        "Selvästi ilmastomyönteinen markkinakeinoin; vihreää siirtymää tukeva.",
      lähde: "RKP:n ilmasto-ohjelma 2022",
    },
    eu: {
      arvo: 10,
      perustelu:
        "Vahvin EU-myönteisyys; integraation laajentamisen ja yhteisvastuun kannattaja.",
      lähde: "RKP:n Eurooppa-ohjelma 2024",
    },
    security: {
      arvo: 9,
      perustelu:
        "NATO- ja puolustusmyönteinen, vahva pohjoismainen yhteistyö.",
      lähde: "RKP:n turvallisuuslinjaukset 2022",
    },
    immigration: {
      arvo: 8,
      perustelu:
        "Liberaali maahanmuuttolinja, työperäistä maahanmuuttoa edistävä.",
      lähde: "RKP:n maahanmuutto-ohjelma 2023",
    },
    public_services: {
      arvo: 5,
      perustelu:
        "Tasapainottelee julkisten ja yksityisten palvelujen välillä.",
      lähde: "RKP:n linjaukset 2024",
    },
    education: {
      arvo: 7,
      perustelu:
        "Korostaa kaksikielisen koulutuksen ja korkeakoulutuksen rahoitusta.",
      lähde: "RKP:n koulutuslinjaukset 2024",
    },
    business_subsidies: {
      arvo: 5,
      perustelu:
        "Maltillinen yritystukien karsija; korostaa elinkeinoelämää.",
      lähde: "RKP:n talouslinjaukset 2023",
    },
    rural: {
      arvo: 7,
      perustelu:
        "Vahva ruotsinkielisten alueiden ja saaristo-/rannikkoalueiden tuki.",
      lähde: "RKP:n aluepolitiikkalinjaukset 2023",
    },
    social_security: {
      arvo: 4,
      perustelu:
        "Hyväksyy sopeutuksia, mutta puolustaa eräitä etuuksia kuten lapsiperheiden.",
      lähde: "Hallitusohjelma 2023, RKP:n vaikutus",
    },
  },
  kd: {
    fiscal_tightness: {
      arvo: 8,
      perustelu:
        "Painottaa vastuullista taloudenhoitoa, alijäämän hallintaa.",
      lähde: "KD:n vaihtoehtobudjetti 2024",
    },
    tax_level: {
      arvo: 4,
      perustelu:
        "Tukee perheveroa ja kotitalousvähennyksiä; ei kannata laajoja korotuksia.",
      lähde: "KD:n vero-ohjelma 2023",
    },
    redistribution: {
      arvo: 6,
      perustelu:
        "Puolustaa lapsiperhetukia ja eläkkeitä; korostaa heikoimpien aseman parantamista.",
      lähde: "KD:n perheohjelma 2023",
    },
    climate: {
      arvo: 5,
      perustelu:
        "Tukee ilmastotavoitteita käytännönläheisesti.",
      lähde: "KD:n ilmasto-ohjelma 2022",
    },
    eu: {
      arvo: 5,
      perustelu:
        "EU-myönteinen mutta varauksellinen federalismille.",
      lähde: "KD:n Eurooppa-linjaukset 2024",
    },
    security: {
      arvo: 8,
      perustelu:
        "NATO- ja puolustusmyönteinen.",
      lähde: "KD:n turvallisuuslinjaukset 2022",
    },
    immigration: {
      arvo: 4,
      perustelu:
        "Maltillisen tiukka; painottaa kotouttamista ja kristillisiä perinteitä.",
      lähde: "KD:n maahanmuutto-ohjelma 2023",
    },
    public_services: {
      arvo: 6,
      perustelu:
        "Tukee julkisia palveluja, mutta avoin kolmannen sektorin (mm. järjestöt) roolille.",
      lähde: "KD:n sote-linjaukset 2024",
    },
    education: {
      arvo: 6,
      perustelu:
        "Tukee koulutusta ja yksityiskoulujen mahdollisuuksia.",
      lähde: "KD:n koulutuslinjaukset 2023",
    },
    business_subsidies: {
      arvo: 5,
      perustelu:
        "Maltillinen, kohdennettu elinkeinotukien kannattaja.",
      lähde: "KD:n talouslinjaukset 2023",
    },
    rural: {
      arvo: 7,
      perustelu:
        "Maaseudun ja maatalouden puolustaja, mutta ei keskeisin teema.",
      lähde: "KD:n aluepolitiikkalinjaukset 2023",
    },
    social_security: {
      arvo: 6,
      perustelu:
        "Lapsiperheiden tuki ja eläkkeiden indeksit tärkeitä; tukee joitain leikkauksia.",
      lähde: "KD:n vaihtoehtobudjetti 2024",
    },
  },
  liik: {
    fiscal_tightness: {
      arvo: 7,
      perustelu:
        "Vastuullisen taloudenhoidon kannattaja, byrokratian purkaminen.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    tax_level: {
      arvo: 3,
      perustelu:
        "Yrittäjyyttä korostava, työn verotuksen alentaja.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    redistribution: {
      arvo: 4,
      perustelu:
        "Markkinaehtoisempi, ei vahvasti redistribuoiva.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    climate: {
      arvo: 5,
      perustelu:
        "Käytännönläheinen ilmastolinja, ei voimakkaita kannanottoja.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    eu: {
      arvo: 5,
      perustelu:
        "Maltillinen EU:hun, suhtautuu kriittisesti yhteisvelkaan.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    security: {
      arvo: 7,
      perustelu:
        "NATO-myönteinen.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    immigration: {
      arvo: 5,
      perustelu:
        "Painottaa työperäistä maahanmuuttoa.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    public_services: {
      arvo: 4,
      perustelu:
        "Tukee yksityistä palvelutuotantoa rinnalla.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    education: {
      arvo: 6,
      perustelu:
        "Avoin koulutusinnovaatioille ja yksityisille toimijoille.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    business_subsidies: {
      arvo: 4,
      perustelu:
        "Karsisi yritystukia mutta tukisi yrittäjyyden edellytyksiä.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    rural: {
      arvo: 5,
      perustelu:
        "Ei voimakkaita maaseutupoliittisia kannanottoja.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
    social_security: {
      arvo: 4,
      perustelu:
        "Kannustaa työhön; uudistaisi etuuksia kannustavammiksi.",
      lähde: "Liike Nyt -ohjelma 2023",
    },
  },
};
