# Uusi osio: Poliittinen analyysi

Sovellukseen on lisätty kokonaan uusi **Poliittinen analyysi** -osio, joka
kokoaa Suomen eduskuntapuolueet, niiden edustajat budjettineuvotteluissa,
arvomallin, sidosryhmäverkoston, kysymyspankin sekä koalitiosimulaattorin
yhdeksi navigoitavaksi näkymäksi. Tarkoituksena on, että **poliitikko,
toimittaja, virkamies tai tutkija** löytää nopeasti vastauksen kysymyksiin
*kuka, mitä ja miksi* nykyisessä budjettikeskustelussa.

> Avaa osio: [**Poliittinen analyysi →**](/poliittinen-analyysi) ·
> Käyttöopas: [Opas → Poliittiset puolueet](/opas#puolueet)

## Mitä uutta

### Edustajat ja arvomalli
- **9 eduskuntapuoluetta** (KOK, PS, SDP, KESK, VIHR, VAS, RKP, KD, LIIK)
  ja niiden keskeiset edustajat budjettineuvotteluissa
- **Arvomalli 12 dimensiolla** (sopeutus, vero, tulonjako, ilmasto, EU,
  turvallisuus, maahanmuutto, sote, koulutus, yritystuet, maatalous,
  sosiaaliturva). Asteikko 0–10, jokainen pistearvo lähdeviitattu

### Visualisoinnit
- **Radar / tutkakaavio** dynaamisilla suodattimilla (puolueet, dimensiot)
- **Samankaltaisuusmatriisi** (kosini-similariteetti) puoluefiltterillä
- **2D-kartta** käyttäjän valittavin akselein
- **3D-kartta** kolmella ulottuvuudella, hiirellä pyöritettävä +
  automaattipyöritys
- **Sidosryhmäverkosto** — etujärjestöt, ajatuspajat, tutkimuslaitokset,
  valtion elimet ja kansainväliset toimijat. Yhteyden klikkaaminen avaa
  yhteyden tyypin (etujärjestösuhde, ajatuspajatausta, ohjelmallinen
  läheisyys jne.) ja lähdeviitteen

### Kysymyspankki + analyyttinen selittäjä
- **20 kuratoitua kysymystä** joita puolueet tyypillisesti esittävät
  budjetille — annotoituna teemalla, esittäjäpuolueilla, aikaperspektiivillä
  (vuosi, vaalikausi, ylivaalikautinen, vaikuttavuus) ja
  **datakattavuus-merkinnällä** (Kattaa / Osittain / Puuttuu)
- **Selitä analyyttisesti** -nappi jokaisessa kysymyksessä: avaa
  visuaalisen selityksen siitä, miksi puolueet asettuvat näin — listaa
  tukijat ja vastustajat, nostaa esiin suurimman dimensiokohtaisen eron
- **Katvealueiden kartta** tulevaa keskustelevaa AI-analytiikkaa varten —
  "puuttuu"-merkityt kysymykset kertovat mihin tarvitaan lisädataa

### Koalitiosimulaattori
- **PCA-projektio** lasketaan dynaamisesti valitulle puoluejoukolle —
  akselien tulkinta päivittyy joukon mukaan
- **Konsensus & ristiveto** -näkymä: dimensiot järjestetty hajonnan mukaan,
  punainen ristiveto / vihreä konsensus -värikoodaus
- **Hallitusohjelma-tavoitteet**: liukurit per dimensio (tai valmiit
  ohjelmamallit), näyttää euklidisen etäisyyden tavoitteesta puolueittain
  — kuin dynaaminen hallitusneuvottelija

## Mihin malli perustuu

- **Hallitusohjelma 20.6.2023** ("Vahva ja välittävä Suomi")
- **YLE Vaalikone 2023** ja **HS Vaalikone 2023**
- Puolueiden **vaihtoehtobudjetit 2024–2025**
- **Kehysriihi 22.–23.4.2026** ja puolueiden välittömät reaktiot
- Puolueiden **viralliset puolue- ja talouspolitiikkaohjelmat**

Kaikki rajoitukset, varaukset ja päivitysrytmi on dokumentoitu
[Lähteet ja varaukset](/poliittinen-analyysi#lahteet) -välilehdellä.

## Tilannekuva

Tämä mallidata edustaa **tilannekuvaa huhtikuu 2026** (vaalikausi 2023–2027).
Päivittyy:
1. eduskuntavaalien jälkeen (uudet paikat, mahdollinen koalition vaihto)
2. uuden hallitusohjelman julkaisun yhteydessä
3. vuosittaisen kehysriihen jälkeen
4. puolueiden uusien strategisten ohjelmien yhteydessä
