import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Plot from "@observablehq/plot";
import { query, getPublicFinanceMeta } from "../data/duckdb";
import { formatEur, formatDate, formatPercent } from "../data/format";
import { useSearch } from "../data/search";
import DataAttribution from "../components/DataAttribution";

const SECTOR_LABELS: Record<string, string> = {
  S13: "Koko julkisyhteisöt",
  S1311: "Valtionhallinto",
  S1313: "Paikallishallinto (kunnat + hyvinvointialueet)",
  S13131: "Paikallishallinto pl. hyvinvointialueet",
  S13132: "Hyvinvointialueet",
  S1314: "Sosiaaliturvarahastot",
  S13141: "Työeläkelaitokset",
  S13149: "Muut sosiaaliturvarahastot",
};

const SECTOR_COLORS: Record<string, string> = {
  S13: "#0f172a",
  S1311: "#2563eb",
  S1313: "#059669",
  S13131: "#10b981",
  S13132: "#84cc16",
  S1314: "#d97706",
  S13141: "#f59e0b",
  S13149: "#fbbf24",
};

const COFOG_SHORT: Record<string, string> = {
  G01: "Yleishallinto",
  G02: "Puolustus",
  G03: "Järjestys & turvallisuus",
  G04: "Elinkeinoelämä",
  G05: "Ympäristö",
  G06: "Asuminen & yhdyskunnat",
  G07: "Terveydenhuolto",
  G08: "Vapaa-aika & kulttuuri",
  G09: "Koulutus",
  G10: "Sosiaaliturva",
};

export default function PublicFinance() {
  const { matches } = useSearch();
  const metaQ = useQuery({ queryKey: ["pf_meta"], queryFn: getPublicFinanceMeta });

  const [sector, setSector] = useState<string>("S13");
  const [unit, setUnit] = useState<"milj_eur" | "osuus_bkt_pct">("osuus_bkt_pct");

  // Velka & alijäämä aikasarja
  const debtQ = useQuery({
    queryKey: ["pf_debt", sector, unit],
    queryFn: () => query<{ vuosi: number; koodi: string; nimi: string; arvo: number }>(`
      SELECT vuosi, indikaattori_koodi AS koodi, indikaattori_nimi AS nimi, arvo
      FROM public_finance
      WHERE lahde_taulu = 'jali_122g'
        AND sektori_koodi = '${sector}'
        AND yksikko = '${unit}'
      ORDER BY vuosi
    `),
  });

  // COFOG menot pääluokittain uusin vuosi
  const latestCofogYearQ = useQuery({
    queryKey: ["pf_cofog_year", sector],
    queryFn: async () => {
      const rs = await query<{ v: number }>(`
        SELECT MAX(vuosi)::INT AS v FROM public_finance
        WHERE lahde_taulu = 'jmete_12a6' AND sektori_koodi = '${sector}'
      `);
      return rs[0]?.v ?? null;
    },
  });

  const cofogQ = useQuery({
    queryKey: ["pf_cofog", sector, latestCofogYearQ.data, unit],
    enabled: latestCofogYearQ.data != null,
    queryFn: () => query<{ tehtava_koodi: string; tehtava_nimi: string; arvo: number }>(`
      SELECT tehtava_koodi, tehtava_nimi, arvo
      FROM public_finance
      WHERE lahde_taulu = 'jmete_12a6'
        AND sektori_koodi = '${sector}'
        AND vuosi = ${latestCofogYearQ.data}
        AND yksikko = '${unit}'
        AND tehtava_koodi LIKE 'G__'
        AND indikaattori_koodi LIKE 'cp|OTEU' OR indikaattori_koodi LIKE 'bkt_suhde|OTEU' OR indikaattori_koodi LIKE 'percapita|OTEU'
      ORDER BY arvo DESC
    `),
  });

  // COFOG pitkä aikasarja — pääluokat × vuosi
  const cofogTimeQ = useQuery({
    queryKey: ["pf_cofog_time", sector, unit],
    queryFn: () => query<{ vuosi: number; tehtava_koodi: string; tehtava_nimi: string; arvo: number }>(`
      SELECT vuosi, tehtava_koodi, tehtava_nimi, arvo
      FROM public_finance
      WHERE lahde_taulu = 'jmete_12a6'
        AND sektori_koodi = '${sector}'
        AND yksikko = '${unit}'
        AND tehtava_koodi LIKE 'G__'
        AND (indikaattori_koodi = 'cp|OTEU' OR indikaattori_koodi = 'bkt_suhde|OTEU' OR indikaattori_koodi = 'percapita|OTEU')
      ORDER BY vuosi, tehtava_koodi
    `),
  });

  // Kvartaalitulot/menot
  const quarterlyQ = useQuery({
    queryKey: ["pf_quarterly", sector],
    queryFn: () => query<{ vuosi: number; neljannes: string; taloustoimi_koodi: string; taloustoimi_nimi: string; arvo: number }>(`
      SELECT vuosi, neljannes, taloustoimi_koodi, taloustoimi_nimi, arvo
      FROM public_finance
      WHERE lahde_taulu = 'jtume_11zf'
        AND sektori_koodi = '${sector}'
        AND indikaattori_koodi LIKE 'TASM|%'
      ORDER BY vuosi, neljannes, taloustoimi_koodi
    `),
  });

  // renderöi velka/alijäämä
  const debtHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = debtHost.current;
    if (!host || !debtQ.data) return;
    host.innerHTML = "";
    const data = debtQ.data.map((d) => ({
      vuosi: d.vuosi,
      arvo: d.arvo,
      sarja:
        d.koodi === "B" ? "Alijäämä/ylijäämä"
        : d.koodi === "D" ? "Velka"
        : d.koodi === "Ratio_B" ? "Alijäämä %BKT"
        : d.koodi === "Ratio_D" ? "Velka %BKT"
        : d.nimi,
    }));
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 340,
      marginLeft: 80,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d", grid: true },
      y: {
        label: unit === "milj_eur" ? "Miljoonaa euroa" : "% BKT:sta",
        grid: true,
        tickFormat: (v: number) => unit === "milj_eur" ? formatEur(v * 1_000_000) : `${v.toFixed(0)} %`,
      },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.line(data, { x: "vuosi", y: "arvo", stroke: "sarja", strokeWidth: 2 }),
        Plot.dot(data, {
          x: "vuosi",
          y: "arvo",
          fill: "sarja",
          r: 2,
          title: (d: any) => `${d.sarja}\n${d.vuosi}: ${unit === "milj_eur" ? formatEur(d.arvo * 1e6) : d.arvo.toFixed(1) + " %"}`,
        }),
      ],
    });
    host.appendChild(plot);
  }, [debtQ.data, unit]);

  // COFOG bar chart
  const cofogHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = cofogHost.current;
    if (!host) return;
    const rows = (cofogQ.data ?? []).filter((r) => matches(r.tehtava_nimi, r.tehtava_koodi, COFOG_SHORT[r.tehtava_koodi]));
    if (rows.length === 0) {
      host.innerHTML = `<div class="loading">Ei tietoja tällä suodatuksella.</div>`;
      return;
    }
    const data = rows.map((r) => ({
      label: COFOG_SHORT[r.tehtava_koodi] || r.tehtava_nimi,
      arvo: r.arvo,
    }));
    const width = host.clientWidth || 900;
    host.innerHTML = "";
    const plot = Plot.plot({
      width,
      height: Math.max(260, data.length * 32 + 40),
      marginLeft: 180,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: {
        label: unit === "milj_eur" ? "Miljoonaa euroa" : "% BKT:sta",
        grid: true,
        tickFormat: (v: number) => unit === "milj_eur" ? formatEur(v * 1e6) : `${v.toFixed(0)} %`,
      },
      y: { label: null, domain: data.map((d) => d.label) },
      marks: [
        Plot.ruleX([0], { stroke: "var(--border)" }),
        Plot.barX(data, {
          x: "arvo",
          y: "label",
          fill: SECTOR_COLORS[sector] ?? "#2563eb",
          title: (d: any) => `${d.label}\n${unit === "milj_eur" ? formatEur(d.arvo * 1e6) : d.arvo.toFixed(2) + " % BKT:sta"}`,
        }),
        Plot.text(data, {
          x: "arvo",
          y: "label",
          text: (d: any) => unit === "milj_eur" ? formatEur(d.arvo * 1e6) : d.arvo.toFixed(1) + " %",
          dx: 6,
          textAnchor: "start",
          fontSize: 11,
          fill: "var(--fg-dim)",
        }),
      ],
    });
    host.appendChild(plot);
  }, [cofogQ.data, unit, sector, matches]);

  // COFOG aikasarja pinottuna
  const cofogTimeHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = cofogTimeHost.current;
    if (!host || !cofogTimeQ.data) return;
    host.innerHTML = "";
    const data = cofogTimeQ.data
      .filter((r) => matches(r.tehtava_nimi, r.tehtava_koodi, COFOG_SHORT[r.tehtava_koodi]))
      .map((r) => ({
        vuosi: r.vuosi,
        tehtava: COFOG_SHORT[r.tehtava_koodi] || r.tehtava_nimi,
        arvo: r.arvo,
      }));
    if (data.length === 0) {
      host.innerHTML = `<div class="loading">Ei tietoja tällä suodatuksella.</div>`;
      return;
    }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 380,
      marginLeft: 80,
      marginRight: 180,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d", grid: true },
      y: {
        label: unit === "milj_eur" ? "Miljoonaa euroa" : "% BKT:sta",
        grid: true,
        tickFormat: (v: number) => unit === "milj_eur" ? formatEur(v * 1e6) : `${v.toFixed(0)} %`,
      },
      color: { legend: true, scheme: "tableau10", label: "Tehtäväluokka" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.areaY(data, {
          x: "vuosi",
          y: "arvo",
          fill: "tehtava",
          fillOpacity: 0.85,
          curve: "monotone-x",
          title: (d: any) => `${d.tehtava} · ${d.vuosi}\n${unit === "milj_eur" ? formatEur(d.arvo * 1e6) : d.arvo.toFixed(2) + " % BKT:sta"}`,
        }),
      ],
    });
    host.appendChild(plot);
  }, [cofogTimeQ.data, unit, matches]);

  // kvartaalit aikasarja
  const quarterlyHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = quarterlyHost.current;
    if (!host || !quarterlyQ.data) return;
    host.innerHTML = "";
    const data = quarterlyQ.data
      .filter((r) => matches(r.taloustoimi_nimi, r.taloustoimi_koodi))
      .map((r) => ({
        aika: r.vuosi + (parseInt(r.neljannes.slice(1)) - 1) / 4,
        arvo: r.arvo,
        sarja: r.taloustoimi_nimi.replace(/^[A-Z0-9]+ /, ""),
      }));
    if (data.length === 0) {
      host.innerHTML = `<div class="loading">Ei kvartaaleja tällä suodatuksella.</div>`;
      return;
    }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 340,
      marginLeft: 80,
      marginRight: 200,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", grid: true, tickFormat: "d" },
      y: { label: "Miljoonaa euroa", grid: true, tickFormat: (v: number) => formatEur(v * 1e6) },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.line(data, { x: "aika", y: "arvo", stroke: "sarja", strokeWidth: 1.8, curve: "monotone-x" }),
      ],
    });
    host.appendChild(plot);
  }, [quarterlyQ.data, matches]);

  const latestVelka = useMemo(() => {
    if (!debtQ.data) return null;
    const velka = debtQ.data.filter((d) => d.koodi === "D" || d.koodi === "Ratio_D");
    return velka.at(-1) ?? null;
  }, [debtQ.data]);

  const latestAlijaama = useMemo(() => {
    if (!debtQ.data) return null;
    const a = debtQ.data.filter((d) => d.koodi === "B" || d.koodi === "Ratio_B");
    return a.at(-1) ?? null;
  }, [debtQ.data]);

  return (
    <>
      <h1>Julkinen talous kokonaisuudessaan</h1>
      <p className="lede">
        Valtio + kunnat + hyvinvointialueet + sosiaaliturvarahastot yhdessä näkymässä.
        Tilastokeskuksen kansantalouden tilinpidosta (COFOG-luokittelu, EDP-velka ja -alijäämä).
        Sektoreittain aina 1975 saakka; yläpalkin haku suodattaa tehtäväluokkia.
      </p>

      {metaQ.data ? (
        <div className="callout">
          StatFin-data päivitetty {formatDate(metaQ.data.generated_at)}. Rivejä:{" "}
          <b>{metaQ.data.row_count.toLocaleString("fi-FI")}</b>. Taulut:{" "}
          {metaQ.data.tables.map((t) => t.table).join(" · ")}.
        </div>
      ) : null}

      <div className="toolbar">
        <label>Sektori:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          {Object.entries(SECTOR_LABELS).map(([k, v]) => (
            <button key={k} className={sector === k ? "on" : ""} onClick={() => setSector(k)}>
              {v}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 12, color: "var(--fg-dim)" }}>|</span>
        <label>Yksikkö:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          <button className={unit === "milj_eur" ? "on" : ""} onClick={() => setUnit("milj_eur")}>
            Miljoonaa €
          </button>
          <button className={unit === "osuus_bkt_pct" ? "on" : ""} onClick={() => setUnit("osuus_bkt_pct")}>
            % BKT:sta
          </button>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="stat">
          <div className="label">Viimeisin EDP-velka</div>
          <div className="value">
            {latestVelka
              ? (unit === "milj_eur" ? formatEur((latestVelka.arvo ?? 0) * 1e6) : formatPercent((latestVelka.arvo ?? 0) / 100))
              : "—"}
          </div>
          <div className="sub">Vuosi {latestVelka?.vuosi} · {SECTOR_LABELS[sector]}</div>
        </div>
        <div className="stat">
          <div className="label">Viimeisin EDP-alijäämä/ylijäämä</div>
          <div className="value" style={{ color: latestAlijaama && latestAlijaama.arvo < 0 ? "var(--danger)" : "var(--success)" }}>
            {latestAlijaama
              ? (unit === "milj_eur" ? formatEur((latestAlijaama.arvo ?? 0) * 1e6) : formatPercent((latestAlijaama.arvo ?? 0) / 100))
              : "—"}
          </div>
          <div className="sub">Vuosi {latestAlijaama?.vuosi} · Negatiivinen = alijäämä</div>
        </div>
        <div className="stat">
          <div className="label">Uusin COFOG-vuosi</div>
          <div className="value" style={{ fontSize: 18 }}>{latestCofogYearQ.data ?? "—"}</div>
          <div className="sub">Julkisyhteisöjen menot tehtävittäin</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">EDP-velka ja alijäämä — aikasarja 1975→</div>
        <div className="panel-meta">
          EDP-velka (Maastricht) ja alijäämä ovat Eurostat-vertailukelpoisia mittareita.
          Sektorivalinta vaikuttaa sarjoihin.
        </div>
        <div ref={debtHost} className="plot-host" style={{ minHeight: 320 }} />
        <DataAttribution sourceId="statfin-jali" detail={`${SECTOR_LABELS[sector]}, koko aikasarja`} />
      </div>

      <div className="panel">
        <div className="panel-title">COFOG-pääluokat — viimeisin vuosi</div>
        <div className="panel-meta">
          Julkisyhteisöjen menot tehtäväluokittain (G01–G10). Tehtävät vertailukelpoisia EU-maiden kesken.
        </div>
        <div ref={cofogHost} className="plot-host" style={{ minHeight: 260 }} />
        <DataAttribution sourceId="statfin-jmete" detail={`Vuosi ${latestCofogYearQ.data ?? "—"}`} />
      </div>

      <div className="panel">
        <div className="panel-title">COFOG-tehtäväluokat pinottuna — pitkä aikasarja</div>
        <div className="panel-meta">
          Jokaisen tehtäväluokan osuus ajan yli. Haun avulla voit korostaa esim. "terveys"
          tai "koulutus" ja nähdä vain niihin liittyvät luokat.
        </div>
        <div ref={cofogTimeHost} className="plot-host" style={{ minHeight: 360 }} />
        <DataAttribution sourceId="statfin-jmete" detail="1990–nykyhetki" />
      </div>

      <div className="panel">
        <div className="panel-title">Neljännesvuosittaiset tulot ja menot — 1999Q1 →</div>
        <div className="panel-meta">
          Alkuperäiset sarjat (TASM). Haku rajaa taloustoimia (esim. "menot", "tulot", "palkat", "sosiaalietuudet").
        </div>
        <div ref={quarterlyHost} className="plot-host" style={{ minHeight: 320 }} />
        <DataAttribution sourceId="statfin-jtume" detail="Kvartaalit 1999–2025" />
      </div>

      <EuVertailu />

      <h2>Tietomalli</h2>
      <div className="panel">
        <p>
          Sovellus lukee StatFin-datan kolmesta PxWeb-taulusta ja normalisoi ne yhteiseen
          <code> public_finance</code>-näkymään DuckDB-Wasm:ssa. Sarakkeet:
        </p>
        <dl className="kv">
          <dt><code>lahde_taulu</code></dt>
          <dd>jali_122g / jmete_12a6 / jtume_11zf</dd>
          <dt><code>sektori_koodi</code></dt>
          <dd>S13 / S1311 (valtio) / S1313 (paikallis) / S1314 (ST) + alasektorit</dd>
          <dt><code>tehtava_koodi</code></dt>
          <dd>COFOG G01..G10 + alatehtävät (vain jmete-taulussa)</dd>
          <dt><code>taloustoimi_koodi</code></dt>
          <dd>OTEU, OTRU, B9 jne. (vain jtume- ja jmete-tauluissa)</dd>
          <dt><code>yksikko</code></dt>
          <dd>milj_eur / osuus_bkt_pct / eur_per_asukas / pct</dd>
          <dt><code>arvo</code></dt>
          <dd>DOUBLE</dd>
        </dl>
      </div>
    </>
  );
}

const COFOG_SHORT_EU: Record<string, string> = {
  TOTAL: "Yhteensä",
  GF01: "Yleishallinto",
  GF02: "Puolustus",
  GF03: "Järjestys & turvallisuus",
  GF04: "Elinkeino",
  GF05: "Ympäristö",
  GF06: "Asuminen",
  GF07: "Terveys",
  GF08: "Vapaa-aika & kulttuuri",
  GF09: "Koulutus",
  GF10: "Sosiaaliturva",
};

function EuVertailu() {
  const [unit, setUnit] = useState<"osuus_bkt_pct" | "eur_per_asukas">("osuus_bkt_pct");
  const [cofog, setCofog] = useState<string>("TOTAL");

  const latestYearQ = useQuery({
    queryKey: ["eu_latest"],
    queryFn: async () => {
      try {
        const rs = await query<{ v: number }>(`SELECT MAX(vuosi)::INT AS v FROM eurostat_cofog`);
        return rs[0]?.v ?? null;
      } catch {
        return null;
      }
    },
  });

  const byCountryQ = useQuery({
    queryKey: ["eu_by_country", unit, cofog, latestYearQ.data],
    enabled: latestYearQ.data != null,
    queryFn: async () => {
      try {
        return await query<{ maa_nimi: string; maa_koodi: string; arvo: number }>(`
          SELECT maa_nimi, maa_koodi, arvo
          FROM eurostat_cofog
          WHERE vuosi = ${latestYearQ.data}
            AND yksikko = '${unit}'
            AND cofog_koodi = '${cofog}'
          ORDER BY arvo DESC
        `);
      } catch {
        return [];
      }
    },
  });

  const timeseriesQ = useQuery({
    queryKey: ["eu_time", unit, cofog],
    queryFn: async () => {
      try {
        return await query<{ vuosi: number; maa_nimi: string; arvo: number }>(`
          SELECT vuosi, maa_nimi, arvo
          FROM eurostat_cofog
          WHERE yksikko = '${unit}'
            AND cofog_koodi = '${cofog}'
            AND maa_koodi IN ('FI', 'SE', 'NO', 'DK', 'EU27_2020', 'DE', 'FR')
          ORDER BY vuosi, maa_nimi
        `);
      } catch {
        return [];
      }
    },
  });

  const barHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = barHost.current;
    if (!host || !byCountryQ.data || byCountryQ.data.length === 0) return;
    host.innerHTML = "";
    const data = byCountryQ.data;
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: Math.max(260, data.length * 26 + 60),
      marginLeft: 150,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: {
        label: unit === "osuus_bkt_pct" ? "% BKT:sta" : "€/asukas",
        grid: true,
        tickFormat: (v: number) => unit === "osuus_bkt_pct" ? `${v.toFixed(0)} %` : formatEur(v),
      },
      y: { label: null, domain: data.map((d) => d.maa_nimi) },
      marks: [
        Plot.ruleX([0], { stroke: "var(--border)" }),
        Plot.barX(data, {
          x: "arvo",
          y: "maa_nimi",
          fill: (d: any) => (d.maa_koodi === "FI" ? "#4f46e5" : d.maa_koodi === "EU27_2020" ? "#0ea5e9" : "#94a3b8"),
          title: (d: any) =>
            `${d.maa_nimi}\n${unit === "osuus_bkt_pct" ? d.arvo.toFixed(2) + " % BKT:sta" : formatEur(d.arvo) + "/asukas"}`,
          inset: 1,
        }),
        Plot.text(data, {
          x: "arvo",
          y: "maa_nimi",
          text: (d: any) =>
            unit === "osuus_bkt_pct" ? `${d.arvo.toFixed(1)} %` : formatEur(d.arvo),
          dx: 6,
          textAnchor: "start",
          fontSize: 11,
          fill: "var(--fg-dim)",
        }),
      ],
    });
    host.appendChild(plot);
  }, [byCountryQ.data, unit]);

  const tsHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = tsHost.current;
    if (!host || !timeseriesQ.data) return;
    host.innerHTML = "";
    const data = timeseriesQ.data;
    if (data.length === 0) { host.innerHTML = `<div class="loading">Ei dataa.</div>`; return; }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 340,
      marginLeft: 80,
      marginRight: 130,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d", grid: true },
      y: {
        label: unit === "osuus_bkt_pct" ? "% BKT:sta" : "€/asukas",
        grid: true,
        tickFormat: (v: number) => unit === "osuus_bkt_pct" ? `${v.toFixed(0)} %` : formatEur(v),
      },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.line(data, {
          x: "vuosi",
          y: "arvo",
          stroke: "maa_nimi",
          strokeWidth: (d: any) => d.maa_nimi === "Suomi" ? 2.8 : 1.6,
          curve: "monotone-x",
        }),
      ],
    });
    host.appendChild(plot);
  }, [timeseriesQ.data, unit]);

  if (latestYearQ.data == null && !latestYearQ.isLoading) {
    return null;
  }

  return (
    <>
      <h2>EU-vertailu · COFOG (Eurostat)</h2>

      <div className="toolbar">
        <label>COFOG-luokka:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          {Object.entries(COFOG_SHORT_EU).map(([k, v]) => (
            <button key={k} className={cofog === k ? "on" : ""} onClick={() => setCofog(k)}>{v}</button>
          ))}
        </div>
        <span style={{ marginLeft: 12, color: "var(--fg-dim)" }}>|</span>
        <label>Yksikkö:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          <button className={unit === "osuus_bkt_pct" ? "on" : ""} onClick={() => setUnit("osuus_bkt_pct")}>% BKT:sta</button>
          <button className={unit === "eur_per_asukas" ? "on" : ""} onClick={() => setUnit("eur_per_asukas")}>€/asukas</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          Maavertailu — {COFOG_SHORT_EU[cofog]} · {latestYearQ.data}
        </div>
        <div className="panel-meta">
          Jokaisen maan viimeisin arvo, lajiteltu suurimmasta pienimpään. Suomi sinisellä,
          EU27-keskiarvo cyanilla.
        </div>
        <div ref={barHost} className="plot-host" style={{ minHeight: 260 }} />
        <DataAttribution sourceId="eurostat-gov" detail={`gov_10a_exp, ${latestYearQ.data}`} />
      </div>

      <div className="panel">
        <div className="panel-title">Aikasarja — Pohjoismaat, suuret EU-maat, EU27-keskiarvo</div>
        <div className="panel-meta">Suomi paksummalla viivalla. 2010–2023.</div>
        <div ref={tsHost} className="plot-host" style={{ minHeight: 340 }} />
        <DataAttribution sourceId="eurostat-gov" detail="gov_10a_exp" />
      </div>
    </>
  );
}
