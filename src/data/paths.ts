/**
 * Staattisten tiedostojen polkuhelperit.
 *
 * GitHub Pages -julkaisussa sovellus on alihakemistossa (esim.
 * `/valtion-analytiikka/`), joten kaikki fetch-kutsut ja iframe-src:t
 * jotka viittaavat public/-hakemiston tiedostoihin pitää prefiksoida
 * `import.meta.env.BASE_URL`:lla. Tämä helper tekee sen keskitetysti.
 *
 * Dev-ajossa BASE_URL on "/" ja toiminta on sama kuin aikaisemmin.
 */

const BASE: string = import.meta.env.BASE_URL ?? "/";

/**
 * Muuta sovelluksen sisäinen polku (esim. "/updates/index.json" tai
 * "updates/index.json") base-pathin sisältäväksi absoluuttiseksi
 * polkuseksi joka toimii sekä dev:ssä että GitHub Pages -julkaisussa.
 */
export function staticUrl(path: string): string {
  // Salli ? ja # osina
  const [plain, rest = ""] = path.split(/(?=[?#])/, 2);
  const clean = plain.replace(/^\//, "");
  const base = BASE.endsWith("/") ? BASE : BASE + "/";
  return base + clean + rest;
}
