# Tietomalli

Tämä dokumentti kuvaa sovelluksen Parquet-skeeman ja yleiset SQL-
kyselykuviot. Kaikki kyselyt ajetaan DuckDB-Wasm:lla selaimessa.

## Parquet: `public/data/budget.parquet`

Yksi rivi = yksi talousarvion **momentti** tietylle vuodelle tietyssä
dokumenttityypissä.

### Skeema

| Sarake | Tyyppi | Pakollinen | Kuvaus |
|---|---|---|---|
| `vuosi` | INT32 | kyllä | Budjettivuosi, esim. 2026 |
| `dokumentti` | VARCHAR | kyllä | `"Hallituksen esitys"`, `"Valtiovarainministeriön ehdotus"` tai `"Eduskunnan kirjelmä"` |
| `paaluokka_num` | INT32 | kyllä | Hallinnonalan numero 21–36 |
| `paaluokka_nimi` | VARCHAR | kyllä | Hallinnonalan nimi (esim. `"SOSIAALI- JA TERVEYSMINISTERIÖN HALLINNONALA"`) |
| `luku_num` | VARCHAR | kyllä | Luvun numero pääluokan sisällä (esim. `"01"`, `"10"`, `"30"`) |
| `luku_nimi` | VARCHAR | kyllä | Luvun nimi |
| `momentti_num` | VARCHAR | kyllä | Momentin numero luvun sisällä (esim. `"01"`, `"29"`) |
| `momentti_nimi` | VARCHAR | kyllä | Momentin kuvaava nimi |
| `info` | VARCHAR | ei | Momentin "info-osa" — päätösosan lisätiedot, tyypillisesti tyhjä |
| `maararaha_eur` | INT64 | ei | Määräraha euroina (NULL jos ei ilmoitettu) |
| `aiemmin_budjetoitu_eur` | INT64 | ei | Lisätalousarvioissa budjetoitu summa |
| `toteutuma_edellinen_eur` | INT64 | ei | Toteutuma edellisenä vuonna (CSV:n "Toteutuma YYYY" uusin) |
| `toteutuma_kaksi_vuotta_sitten_eur` | INT64 | ei | Toteutuma kaksi vuotta sitten |

### Hierarkia

Talousarvion rakenne on kolmitasoinen:

```
pääluokka (ministeriö/hallinnonala)  — numero 21..36
  └── luku                            — mm. "01 Hallinto", "10 Maaseudun kehittäminen"
        └── momentti                  — yksittäinen menoerä, esim. "01 Ruokaviraston toimintamenot"
```

Uniikki avain = `(vuosi, dokumentti, paaluokka_num, luku_num, momentti_num)`.

## Yleiset kyselykuviot

### 1. Pääluokkien vertailu yhdelle vuodelle

```sql
SELECT paaluokka_num, paaluokka_nimi,
       SUM(maararaha_eur) AS yhteensa_eur,
       COUNT(*) AS momentteja
FROM budget
WHERE vuosi = 2026
  AND dokumentti = 'Hallituksen esitys'
GROUP BY paaluokka_num, paaluokka_nimi
ORDER BY yhteensa_eur DESC;
```

### 2. Määrärahojen kokonaissumma aikasarjana

```sql
SELECT vuosi, SUM(maararaha_eur) AS yhteensa
FROM budget
WHERE dokumentti = 'Hallituksen esitys'
GROUP BY vuosi
ORDER BY vuosi;
```

### 3. Suurimmat momentit yhdelle ministeriölle

```sql
SELECT luku_num, luku_nimi, momentti_num, momentti_nimi, maararaha_eur
FROM budget
WHERE vuosi = 2026
  AND dokumentti = 'Hallituksen esitys'
  AND paaluokka_num = 33  -- Sosiaali- ja terveysministeriö
ORDER BY maararaha_eur DESC
LIMIT 20;
```

### 4. Vuosimuutos per momentti

```sql
WITH vuosittain AS (
  SELECT paaluokka_num, luku_num, momentti_num, momentti_nimi, vuosi, maararaha_eur
  FROM budget
  WHERE dokumentti = 'Hallituksen esitys'
)
SELECT a.momentti_nimi, a.vuosi AS vuosi_a, b.vuosi AS vuosi_b,
       a.maararaha_eur AS eur_a,
       b.maararaha_eur AS eur_b,
       (b.maararaha_eur - a.maararaha_eur) AS muutos_eur,
       CASE WHEN a.maararaha_eur > 0
            THEN (b.maararaha_eur - a.maararaha_eur) * 1.0 / a.maararaha_eur
            ELSE NULL END AS muutos_osuus
FROM vuosittain a
JOIN vuosittain b
  ON a.paaluokka_num = b.paaluokka_num
 AND a.luku_num = b.luku_num
 AND a.momentti_num = b.momentti_num
 AND b.vuosi = a.vuosi + 1
WHERE a.vuosi = 2025
ORDER BY muutos_eur DESC;
```

### 5. Esitys vs. toteutuma (kun toteutuma saatavilla)

```sql
SELECT paaluokka_nimi,
       SUM(maararaha_eur) AS esitys,
       SUM(toteutuma_edellinen_eur) AS toteutuma
FROM budget
WHERE vuosi = 2025
  AND dokumentti = 'Hallituksen esitys'
GROUP BY paaluokka_nimi
ORDER BY toteutuma DESC;
```

Huomaa: `toteutuma_edellinen_eur` on VM:n CSV:ssä ilmoitettu vertailuluku
edellisestä vuodesta, eli rivillä `vuosi = 2025` oleva toteutuma on
vuoden 2024 toteutuma. Tarkempi tulee Valtiokonttorin API:sta.

## Tulevat laajennukset

### Toteutuma (Valtiokonttori)
Oma Parquet-tiedosto `public/data/realized.parquet`:
`(vuosi, paaluokka, luku, momentti, toteutuma_eur, viimeisin_pvm)`.

### Hintaindeksit (StatFin)
`public/data/price_index.parquet`:
`(vuosi, indeksi_arvo)`. Käyttö: `maararaha_eur / (indeksi_arvo / 100)` →
reaali-eurot vertailuvuoteen nähden.

### Ostolaskut (Tutkihankintoja)
`public/data/purchases.parquet`:
`(vuosi, organisaatio, toimittaja_y_tunnus, toimittaja_nimi, summa_eur,
momentti_hakuavain, pvm)`.

### EU-vertailu (Eurostat COFOG)
`public/data/eurostat_cofog.parquet`:
`(maa, vuosi, cofog_pääluokka, cofog_alaluokka, % BKT:sta, €/asukas)`.

## Jäljitettävyys

Metatiedosto `public/data/build_meta.json` sisältää aikaleiman ja
täsmällisen listan URL-osoitteista, joista Parquetin sisältö on peräisin.
Jokainen solu voidaan siten jäljittää takaisin alkuperäiseen CSV:hen:

```json
{
  "generated_at": "2026-04-22T17:01:18Z",
  "row_count": 1363,
  "sources_fetched": [
    {"year": 2026, "doc": "hallituksenEsitys", "paaluokka": 33,
     "url": "https://budjetti.vm.fi/.../2026-tae-hallituksenEsitys-33.csv",
     "rivit": 72}
  ],
  "missing": [],
  "license": "CC BY 4.0"
}
```
