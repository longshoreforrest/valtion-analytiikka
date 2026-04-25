/**
 * Sidosryhmä ↔ puolue -yhteyksien metatieto.
 *
 * Jokaiselle yhteydelle (joka on määritelty stakeholders.ts:n
 * `lähinPuolueita`-listassa) voidaan tässä antaa täsmällisempi kuvaus:
 *  - tyyppi (etujärjestösuhde, ajatuspajatausta, kuuleminen jne.)
 *  - lyhyt selitys mistä on kyse
 *  - lähde + URL jos saatavilla
 *
 * Yhteys, jolle ei löydy täsmällistä merkintää, näytetään geneerisellä
 * "yleinen vaikutuskanava" -kuvauksella (ks. defaultConnection alla).
 */

export type ConnectionType =
  | "etujärjestösuhde"
  | "jäsenmäärä"
  | "ajatuspajatausta"
  | "rahoituslähde"
  | "edustus-hallituksessa"
  | "asiantuntijasuhde"
  | "vaikuttamiskanava"
  | "tutkimuskumppani"
  | "ohjelmallinen-läheisyys";

export interface StakeholderConnection {
  stakeholderId: string;
  partyId: string;
  tyyppi: ConnectionType;
  /** Lyhyt kuvaus yhteyden luonteesta. */
  kuvaus: string;
  /** Lähdeviite — esim. "EVA:n hallituksen kokoonpano 2024" */
  lähde: string;
  lähdeUrl?: string;
  /** Vahvuus 1–3 (1 = epäsuora, 3 = vahva ohjelmallinen / institutionaalinen) */
  vahvuus?: 1 | 2 | 3;
}

/**
 * Default kun täsmämerkintä puuttuu — auttaa pitämään verkon klikkauksen
 * informatiivisena vaikka yksittäisen yhteyden lähdetietoa ei vielä olisi
 * koottu.
 */
export function defaultConnection(
  stakeholderId: string,
  partyId: string
): StakeholderConnection {
  return {
    stakeholderId,
    partyId,
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yleinen vaikutuskanava: sidosryhmä on ohjelmallisesti tai temaattisesti lähellä puolueen linjaa. Tarkempi kuvaus ja lähdeviite on vielä lisäämättä — tarkista sidosryhmän kotisivu ja puolueen ohjelmat suoraan.",
    lähde: "Karkea heuristiikka, vahvistamaton",
    vahvuus: 1,
  };
}

/**
 * Tarkennetut yhteydet. Lista täydentyy ajan myötä — kaikkia yhteyksiä ei
 * ole välttämätöntä dokumentoida, mutta kaikkein keskeisimmät on hyvä
 * ankkuroida lähteisiin.
 */
export const STAKEHOLDER_CONNECTIONS: StakeholderConnection[] = [
  // ---- EK ----
  {
    stakeholderId: "ek",
    partyId: "kok",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "EK ja Kokoomus jakavat keskeisen markkinatalouspainotteisen talous- ja työmarkkinapoliittisen viitekehyksen. Useat EK:n asiantuntijat ovat työskennelleet kokoomuslaisten kabineteissa ja päinvastoin.",
    lähde: "EK:n Talous- ja työllisyyspoliittinen ohjelma 2023; Hallitusohjelma 2023",
    lähdeUrl: "https://ek.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "ek",
    partyId: "rkp",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "RKP:n liberaali ja vientiteollisuutta tukeva linja on lähellä EK:n elinkeinopoliittisia tavoitteita.",
    lähde: "RKP:n elinkeino-ohjelma 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "ek",
    partyId: "kd",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "EK kuulee KD:tä työvaliokunnassa ja hallitusohjelman valmistelussa.",
    lähde: "Eduskunnan kuulemiset 2023",
    vahvuus: 1,
  },
  {
    stakeholderId: "ek",
    partyId: "liik",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Liike Nyt jakaa EK:n yrittäjyysmyönteisen ja sääntelyä keventävän linjan.",
    lähde: "Liike Nyt -ohjelma 2023",
    vahvuus: 1,
  },

  // ---- SAK ----
  {
    stakeholderId: "sak",
    partyId: "sdp",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Historiallisesti läheisin yhteistyökumppani: SAK:n jäsenliittojen ja SDP:n välillä on syvät institutionaaliset siteet, vaikka virallisia ryhmälahjoituksia ei tehdäkään.",
    lähde:
      "SAK:n hallituksen kokoonpano; SDP:n työelämäohjelma 2023",
    lähdeUrl: "https://www.sak.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "sak",
    partyId: "vas",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Vasemmistoliiton työelämälinja on yleensä SAK:n kannan mukainen erityisesti palkansaaja- ja työehtokysymyksissä.",
    lähde: "VAS:n työelämäohjelma 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "sak",
    partyId: "vihr",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Vihreät ja SAK ovat yhteistyössä erityisesti oikeudenmukaisen siirtymän ja koulutuspolitiikan kysymyksissä.",
    lähde: "Vihreiden työelämäohjelma 2023",
    vahvuus: 2,
  },

  // ---- STTK ----
  {
    stakeholderId: "sttk",
    partyId: "sdp",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "STTK:n toimihenkilöjäsenistö on ollut perinteisesti SDP:n vahvaa kannatusaluetta.",
    lähde: "STTK:n linjaukset 2024",
    vahvuus: 2,
  },
  {
    stakeholderId: "sttk",
    partyId: "vihr",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö koulutus- ja työelämän tasa-arvokysymyksissä.",
    lähde: "Vihreiden vaihtoehtobudjetti 2025",
    vahvuus: 1,
  },
  {
    stakeholderId: "sttk",
    partyId: "kesk",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "STTK on yhteistyössä KESK:n kanssa erityisesti aluekysymyksissä ja työllistämispalveluissa.",
    lähde: "Keskustan työelämäohjelma 2023",
    vahvuus: 1,
  },

  // ---- Akava ----
  {
    stakeholderId: "akava",
    partyId: "kok",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Akavan korkeakoulutettu jäsenistö on tärkeä Kokoomukselle TKI- ja koulutuskysymyksissä.",
    lähde: "Akavan TKI-ohjelma 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "akava",
    partyId: "vihr",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö korkeakoulutuksen ja tutkimusrahoituksen puolustamisessa.",
    lähde: "Vihreiden vaihtoehtobudjetti 2025",
    vahvuus: 2,
  },
  {
    stakeholderId: "akava",
    partyId: "rkp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteinen tavoite vahvistaa korkeakoulutuksen rahoitusta.",
    lähde: "RKP:n koulutuslinjaukset 2024",
    vahvuus: 1,
  },
  {
    stakeholderId: "akava",
    partyId: "sdp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö opintotuen ja akavalaisten työehtojen puolustamisessa.",
    lähde: "SDP:n koulutusohjelma 2023",
    vahvuus: 1,
  },

  // ---- SY ----
  {
    stakeholderId: "sy",
    partyId: "kok",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "SY:n pk-yrittäjyyden tukeminen ja byrokratian purku ovat Kokoomuksen ydinteemoja.",
    lähde: "SY:n vaaliohjelma 2023; Hallitusohjelma 2023",
    vahvuus: 3,
  },
  {
    stakeholderId: "sy",
    partyId: "ps",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "PS on SY:n läheinen yhteistyökumppani erityisesti maaseutuyrittäjien ja sääntelyn keventämisen osalta.",
    lähde: "PS:n yrittäjyysohjelma 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "sy",
    partyId: "kesk",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Maaseutuyrittäjien ja perheyritysten tukeminen on yhteinen agenda.",
    lähde: "Keskustan yrittäjyysohjelma 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "sy",
    partyId: "rkp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "RKP ajaa rannikko- ja saaristoyrittäjien etuja yhdessä SY:n kanssa.",
    lähde: "RKP:n elinkeino-ohjelma 2023",
    vahvuus: 1,
  },
  {
    stakeholderId: "sy",
    partyId: "kd",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö perheyritysten verotuksen ja sukupolvenvaihdosten kysymyksissä.",
    lähde: "KD:n vaaliohjelma 2023",
    vahvuus: 1,
  },
  {
    stakeholderId: "sy",
    partyId: "liik",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Liike Nyt on yrittäjäliikkeenä ohjelmallisesti hyvin lähellä SY:n kantoja.",
    lähde: "Liike Nyt -ohjelma 2023",
    vahvuus: 2,
  },

  // ---- MTK ----
  {
    stakeholderId: "mtk",
    partyId: "kesk",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "MTK ja Keskusta jakavat institutionaalisesti vahvan agraariperinteen ja maatalouden tukijärjestelmien puolustuksen.",
    lähde: "MTK:n linjaukset 2024; Keskustan maatalousohjelma 2023",
    lähdeUrl: "https://www.mtk.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "mtk",
    partyId: "ps",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "PS on viime vuosina vahvistanut otettaan maaseudusta ja MTK:n agendasta.",
    lähde: "PS:n maatalousohjelma 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "mtk",
    partyId: "kok",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö metsäteollisuuden kilpailukyvyn ja maatalouden kannattavuuden kysymyksissä.",
    lähde: "Kokoomuksen elinkeinolinjaukset 2023",
    vahvuus: 2,
  },

  // ---- Kuntaliitto ----
  {
    stakeholderId: "kuntaliitto",
    partyId: "kesk",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Kuntien ja maakuntien edustajia paljon Keskustasta — institutionaalinen yhteys.",
    lähde: "Kuntaliiton hallituksen kokoonpano",
    vahvuus: 2,
  },
  {
    stakeholderId: "kuntaliitto",
    partyId: "kok",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Kokoomus suurin puolue kuntavaaleissa monissa kaupungeissa, vahva edustus Kuntaliitossa.",
    lähde: "Kuntavaalitulokset 2021",
    vahvuus: 2,
  },
  {
    stakeholderId: "kuntaliitto",
    partyId: "sdp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "SDP:n vahva edustus kunnissa, erityisesti suurimmissa kaupungeissa.",
    lähde: "Kuntavaalitulokset 2021",
    vahvuus: 2,
  },
  {
    stakeholderId: "kuntaliitto",
    partyId: "rkp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Rannikkokunnissa vahva edustus.",
    lähde: "Kuntavaalitulokset 2021",
    vahvuus: 1,
  },
  {
    stakeholderId: "kuntaliitto",
    partyId: "kd",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Kunnallisissa luottamustehtävissä KD-edustus.",
    lähde: "Kuntavaalitulokset 2021",
    vahvuus: 1,
  },

  // ---- Ajatuspajat (selkeät puoluekytkökset) ----
  {
    stakeholderId: "eva",
    partyId: "kok",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "EVA on Elinkeinoelämän valtuuskunta, jonka markkinatalouspainotus on lähellä Kokoomuksen linjaa. Useat EVA:n asiantuntijat ovat siirtyneet kokoomuslaisten ministereiden kabinetteihin.",
    lähde: "EVA:n vuosikertomus; mediatiedot",
    lähdeUrl: "https://www.eva.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "eva",
    partyId: "rkp",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Liberaali markkinatalouspainotus on yhteinen.",
    lähde: "EVA:n raportit 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "eva",
    partyId: "kd",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö talouspoliittisten arvioiden hyödyntämisessä.",
    lähde: "EVA:n raportit 2023",
    vahvuus: 1,
  },
  {
    stakeholderId: "eva",
    partyId: "liik",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Liike Nyt on usein viitannut EVA:n raportteihin.",
    lähde: "Liike Nyt -ohjelma 2023",
    vahvuus: 1,
  },
  {
    stakeholderId: "kalevi-sorsa",
    partyId: "sdp",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "Kalevi Sorsa -säätiö on SDP:n virallinen ajatuspaja.",
    lähde: "Säätiön perustamisasiakirja",
    lähdeUrl: "https://sorsafoundation.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "libera",
    partyId: "kok",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Libera ajaa liberaalia talouspolitiikkaa, lähellä Kokoomuksen linjaa.",
    lähde: "Liberan vuosikertomus",
    vahvuus: 2,
  },
  {
    stakeholderId: "libera",
    partyId: "rkp",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Libera ja RKP jakavat liberaalin yhteiskuntanäkemyksen.",
    lähde: "Liberan julkaisut",
    vahvuus: 2,
  },
  {
    stakeholderId: "libera",
    partyId: "liik",
    tyyppi: "ohjelmallinen-läheisyys",
    kuvaus:
      "Liike Nyt:n vapauttavan markkinapolitiikan linja on lähellä Liberaa.",
    lähde: "Liberan julkaisut",
    vahvuus: 1,
  },
  {
    stakeholderId: "e2",
    partyId: "kesk",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "e2 perustettiin Keskustan piiristä, ja sen agendassa korostuvat aluepolitiikka ja yhteiskunnallinen koheesio.",
    lähde: "e2:n perustaminen ja vuosikertomukset",
    lähdeUrl: "https://www.e2.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "e2",
    partyId: "rkp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "Yhteistyö aluepolitiikan ja kaksikielisyyden kysymyksissä.",
    lähde: "e2:n raportit",
    vahvuus: 1,
  },
  {
    stakeholderId: "e2",
    partyId: "sdp",
    tyyppi: "vaikuttamiskanava",
    kuvaus:
      "SDP:n alueedustajat ovat hyödyntäneet e2:n raportteja.",
    lähde: "e2:n julkaisut",
    vahvuus: 1,
  },
  {
    stakeholderId: "suomen-toivo",
    partyId: "kok",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "Suomen Toivo -säätiö on Kokoomuksen ajatuspaja.",
    lähde: "Säätiön perustamisasiakirja",
    lähdeUrl: "https://toivo.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "vasemmistofoorumi",
    partyId: "vas",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "Vasemmistofoorumi on Vasemmistoliiton ajatuspaja.",
    lähde: "Säätiön perustamisasiakirja",
    lähdeUrl: "https://vasemmistofoorumi.fi",
    vahvuus: 3,
  },
  {
    stakeholderId: "visio",
    partyId: "vihr",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "Visio-säätiö on Vihreiden ajatuspaja.",
    lähde: "Säätiön perustamisasiakirja",
    vahvuus: 3,
  },
  {
    stakeholderId: "suomen-perusta",
    partyId: "ps",
    tyyppi: "ajatuspajatausta",
    kuvaus:
      "Suomen Perusta on Perussuomalaisten ajatuspaja.",
    lähde: "Säätiön perustamisasiakirja",
    lähdeUrl: "https://suomenperusta.fi",
    vahvuus: 3,
  },

  // ---- Tutkimuslaitokset ----
  {
    stakeholderId: "etla",
    partyId: "kok",
    tyyppi: "tutkimuskumppani",
    kuvaus:
      "ETLA tuottaa yritystoiminnan ja työllisyyden tutkimusta — Kokoomus käyttää aktiivisesti.",
    lähde: "ETLA:n raportit 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "etla",
    partyId: "rkp",
    tyyppi: "tutkimuskumppani",
    kuvaus:
      "RKP hyödyntää ETLA:n vientianalyysia.",
    lähde: "ETLA:n raportit 2023",
    vahvuus: 1,
  },
  {
    stakeholderId: "labore",
    partyId: "sdp",
    tyyppi: "tutkimuskumppani",
    kuvaus:
      "Palkansaajaliikkeen taustainen tutkimuslaitos — SDP:n ydinaineisto työmarkkina-arvioissa.",
    lähde: "Laboren rahoitusrakenne",
    vahvuus: 2,
  },
  {
    stakeholderId: "labore",
    partyId: "vas",
    tyyppi: "tutkimuskumppani",
    kuvaus:
      "Vasemmistoliiton talouspoliittisten arvioiden tukena.",
    lähde: "Laboren raportit 2023",
    vahvuus: 2,
  },
  {
    stakeholderId: "pt",
    partyId: "kesk",
    tyyppi: "tutkimuskumppani",
    kuvaus:
      "PTT on Pellervo-Seuran omistama tutkimuslaitos. Yhteys Keskustaan vahva sekä historiallisesti että nykyhetkessä.",
    lähde: "PTT:n omistusrakenne",
    lähdeUrl: "https://www.ptt.fi",
    vahvuus: 3,
  },
];

/** Hae yhteyden täsmämerkintä jos olemassa, muuten palauta default. */
export function getConnection(
  stakeholderId: string,
  partyId: string
): StakeholderConnection {
  const found = STAKEHOLDER_CONNECTIONS.find(
    (c) => c.stakeholderId === stakeholderId && c.partyId === partyId
  );
  return found ?? defaultConnection(stakeholderId, partyId);
}

export const CONNECTION_TYPE_LABEL: Record<ConnectionType, string> = {
  "etujärjestösuhde": "Etujärjestösuhde",
  "jäsenmäärä": "Jäsenmäärä-pohjainen kytkös",
  "ajatuspajatausta": "Ajatuspaja / virallinen taustasäätiö",
  "rahoituslähde": "Rahoituskytkös",
  "edustus-hallituksessa": "Edustus hallituksessa tai elimessä",
  "asiantuntijasuhde": "Asiantuntijasuhde",
  "vaikuttamiskanava": "Yleinen vaikuttamiskanava",
  "tutkimuskumppani": "Tutkimuskumppani",
  "ohjelmallinen-läheisyys": "Ohjelmallinen läheisyys",
};
