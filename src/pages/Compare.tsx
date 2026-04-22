import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Plot from "@observablehq/plot";
import { query, getBuildMeta } from "../data/duckdb";
import { formatEur } from "../data/format";
import { useSearch } from "../data/search";
import DataAttribution from "../components/DataAttribution";
import Breadcrumb, { Crumb } from "../components/Breadcrumb";

type Metric = "maararaha_eur" | "toteutuma_edellinen_eur";
type Chart = "bars" | "scatter" | "bullet";

interface Path {
  paaluokka_num?: number;
  paaluokka_nimi?: string;
  luku_num?: string;
  luku_nimi?: string;
}

interface Row {
  key: string;
  label: string;
  sublabel?: string;
  /** Syventymistieto klikkauksessa */
  drill?: { paaluokka_num?: number; paaluokka_nimi?: string; luku_num?: string; luku_nimi?: string };
  values: Map<number, number>;
}

const METRIC_LABELS: Record<Metric, string> = {
  maararaha_eur: "Määräraha (€)",
  toteutuma_edellinen_eur: "Toteutuma edell. vuosi (€)",
};

export default function Compare() {
  const { matches, highlight } = useSearch();
  const metaQ = useQuery({ queryKey: ["build_meta"], queryFn: getBuildMeta });

  const availableYears = metaQ.data?.years ?? [];

  const defaultYears = useMemo(() => {
    const ys = availableYears;
    if (ys.length >= 2) return [ys[ys.length - 2], ys[ys.length - 1]];
    return ys.slice(-2);
  }, [availableYears]);

  const [years, setYears] = useState<number[]>([]);
  const [metric, setMetric] = useState<Metric>("maararaha_eur");
  const [chartType, setChartType] = useState<Chart>("bars");
  const [diffType, setDiffType] = useState<"abs" | "rel">("abs");
  const [topN, setTopN] = useState<number>(15);
  const [showOnlyChanged, setShowOnlyChanged] = useState<boolean>(false);
  const [path, setPath] = useState<Path>({});

  useEffect(() => {
    if (years.length === 0 && defaultYears.length > 0) setYears(defaultYears);
  }, [defaultYears, years.length]);

  const level: "paaluokka" | "luku" | "momentti" =
    path.luku_num ? "momentti" : path.paaluokka_num != null ? "luku" : "paaluokka";

  const rawQ = useQuery({
    queryKey: ["compare2", level, metric, Array.from(years).sort(), path.paaluokka_num, path.luku_num],
    enabled: years.length >= 2,
    queryFn: async (): Promise<Row[]> => {
      const filters = [`dokumentti = 'Hallituksen esitys'`, `vuosi IN (${years.join(",")})`, `${metric} IS NOT NULL`];
      if (path.paaluokka_num != null) filters.push(`paaluokka_num = ${path.paaluokka_num}`);
      if (path.luku_num) filters.push(`luku_num = '${path.luku_num}'`);

      let groupCols = "paaluokka_num, paaluokka_nimi";
      let labelExpr = "paaluokka_nimi";
      let sublabelExpr = "'Pääluokka ' || paaluokka_num";
      let keyExpr = "CAST(paaluokka_num AS VARCHAR)";
      if (level === "luku") {
        groupCols = "paaluokka_num, paaluokka_nimi, luku_num, luku_nimi";
        labelExpr = "luku_nimi";
        sublabelExpr = "'Luku ' || luku_num";
        keyExpr = "paaluokka_num || '-' || luku_num";
      } else if (level === "momentti") {
        groupCols = "paaluokka_num, paaluokka_nimi, luku_num, luku_nimi, momentti_num, momentti_nimi";
        labelExpr = "momentti_nimi";
        sublabelExpr = "'Momentti ' || momentti_num";
        keyExpr = "paaluokka_num || '-' || luku_num || '-' || momentti_num";
      }

      const rs = await query<any>(`
        SELECT ${keyExpr} AS k,
               ${labelExpr} AS label,
               ${sublabelExpr} AS sublabel,
               paaluokka_num, paaluokka_nimi,
               ${level !== "paaluokka" ? "luku_num, luku_nimi," : "NULL AS luku_num, NULL AS luku_nimi,"}
               vuosi,
               SUM(${metric})::BIGINT AS arvo
        FROM budget
        WHERE ${filters.join(" AND ")}
        GROUP BY ${groupCols}, vuosi
      `);

      const byKey = new Map<string, Row>();
      for (const r of rs) {
        if (!byKey.has(r.k)) {
          const drill: Row["drill"] = {
            paaluokka_num: r.paaluokka_num,
            paaluokka_nimi: r.paaluokka_nimi,
          };
          if (level !== "paaluokka" && r.luku_num) {
            drill.luku_num = r.luku_num;
            drill.luku_nimi = r.luku_nimi;
          }
          byKey.set(r.k, { key: r.k, label: r.label, sublabel: r.sublabel, drill, values: new Map() });
        }
        byKey.get(r.k)!.values.set(r.vuosi, Number(r.arvo));
      }
      return Array.from(byKey.values());
    },
  });

  const sortedYears = useMemo(() => [...years].sort((a, b) => a - b), [years]);
  const baseYear = sortedYears[0];
  const targetYear = sortedYears[sortedYears.length - 1];

  const analyzed = useMemo(() => {
    const rows = rawQ.data ?? [];
    const withDiff = rows.map((r) => {
      const a = r.values.get(baseYear) ?? 0;
      const b = r.values.get(targetYear) ?? 0;
      const absDiff = b - a;
      const relDiff = a > 0 ? absDiff / a : b > 0 ? 1 : 0;
      return { ...r, a, b, absDiff, relDiff };
    });
    const filtered = withDiff.filter((r) => {
      if (showOnlyChanged && r.absDiff === 0) return false;
      return matches(r.label, r.sublabel);
    });
    filtered.sort((x, y) => {
      if (diffType === "abs") return Math.abs(y.absDiff) - Math.abs(x.absDiff);
      return Math.abs(y.relDiff) - Math.abs(x.relDiff);
    });
    return filtered;
  }, [rawQ.data, baseYear, targetYear, matches, diffType, showOnlyChanged]);

  const top = useMemo(() => analyzed.slice(0, topN), [analyzed, topN]);

  const drillInto = (r: Row) => {
    if (level === "paaluokka") {
      setPath({ paaluokka_num: r.drill?.paaluokka_num, paaluokka_nimi: r.drill?.paaluokka_nimi });
    } else if (level === "luku") {
      setPath({
        paaluokka_num: r.drill?.paaluokka_num,
        paaluokka_nimi: r.drill?.paaluokka_nimi,
        luku_num: r.drill?.luku_num,
        luku_nimi: r.drill?.luku_nimi,
      });
    }
  };

  const crumbs: Crumb[] = useMemo(() => {
    const cs: Crumb[] = [{ label: "Kaikki hallinnonalat", onClick: () => setPath({}) }];
    if (path.paaluokka_num != null) {
      cs.push({
        label: `${path.paaluokka_num} · ${path.paaluokka_nimi}`,
        onClick: () => setPath({ paaluokka_num: path.paaluokka_num, paaluokka_nimi: path.paaluokka_nimi }),
      });
    }
    if (path.luku_num) {
      cs.push({ label: `Luku ${path.luku_num} · ${path.luku_nimi}` });
    }
    return cs;
  }, [path]);

  const nextLevelHint = level === "paaluokka" ? "pääluokka → luku" : level === "luku" ? "luku → momentti" : "momentti (viimeinen taso)";

  // --- Chart rendering -------------------------------------------------
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = chartHostRef.current;
    if (!host || top.length === 0 || sortedYears.length < 2) return;
    host.innerHTML = "";
    const width = host.clientWidth || 900;

    const maxLabelLen = Math.max(30, ...top.map((r) => r.label.length));
    const marginLeft = Math.min(Math.floor(width * 0.45), Math.max(220, maxLabelLen * 6.5));

    if (chartType === "bars") {
      // Grouped horizontal bars: jokaisella rivillä on yksi bari per vuosi.
      // Y-domain järjestetään (rivi, vuosi)-parien mukaan niin että samat labelit pysyvät yhdessä.
      type Item = { yKey: string; rowLabel: string; rowSub: string; vuosi: number; arvo: number };
      const data: Item[] = [];
      const domain: string[] = [];
      for (const r of top) {
        for (const y of sortedYears) {
          const yKey = `${r.label} ${y}`; // em-space erottaa vuoden labelista
          data.push({ yKey, rowLabel: r.label, rowSub: r.sublabel ?? "", vuosi: y, arvo: r.values.get(y) ?? 0 });
          domain.push(yKey);
        }
      }
      const barHeight = 22;
      const groupPad = 10;
      const plot = Plot.plot({
        width,
        height: Math.max(260, top.length * (sortedYears.length * barHeight + groupPad) + 80),
        marginLeft,
        marginRight: 140,
        marginBottom: 40,
        style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
        x: {
          label: metric === "maararaha_eur" ? "Määräraha" : "Toteutuma",
          grid: true,
          tickFormat: (v: number) => formatEur(v),
        },
        y: {
          label: null,
          domain,
          tickFormat: (d: string) => {
            const parts = d.split(" ");
            return parts[1]; // näytä akselilla vain vuosi (label näkyy erikseen)
          },
        },
        color: { legend: true, scheme: "tableau10" },
        marks: [
          Plot.ruleX([0], { stroke: "var(--border)" }),
          Plot.barX(data, {
            x: "arvo",
            y: "yKey",
            fill: (d: any) => String(d.vuosi),
            title: (d: any) => `${d.rowLabel}\n${d.vuosi}: ${formatEur(d.arvo)}`,
            inset: 2,
          }),
          // rivin labelin näyttö vasemmassa ylätilassa (ensimmäinen vuosi per rivi)
          Plot.text(
            top.map((r) => ({
              yKey: `${r.label} ${sortedYears[0]}`,
              label: r.label,
              sub: r.sublabel ?? "",
            })),
            {
              x: 0,
              y: "yKey",
              text: (d: any) => d.label,
              frameAnchor: "left",
              textAnchor: "end",
              dx: -12,
              dy: -2,
              fontSize: 11.5,
              fontWeight: 600,
              fill: "var(--fg)",
              lineWidth: Math.max(20, Math.floor(marginLeft / 7)),
            }
          ),
          Plot.text(data, {
            x: "arvo",
            y: "yKey",
            text: (d: any) => formatEur(d.arvo),
            textAnchor: "start",
            dx: 6,
            fontSize: 10.5,
            fill: "var(--fg-dim)",
          }),
        ],
      });
      host.appendChild(plot);
    } else if (chartType === "scatter") {
      const data = top.map((r) => ({ label: r.label, a: r.a, b: r.b }));
      const maxV = Math.max(...data.map((d) => Math.max(d.a, d.b)), 1);
      const plot = Plot.plot({
        width,
        height: 560,
        marginLeft: 90,
        marginBottom: 50,
        marginRight: 40,
        style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
        x: { label: `${baseYear}`, grid: true, tickFormat: (v: number) => formatEur(v), domain: [0, maxV] },
        y: { label: `${targetYear}`, grid: true, tickFormat: (v: number) => formatEur(v), domain: [0, maxV] },
        marks: [
          Plot.ruleY([0]),
          Plot.ruleX([0]),
          Plot.line([{ x: 0, y: 0 }, { x: maxV, y: maxV }], { x: "x", y: "y", stroke: "var(--fg-muted)", strokeDasharray: "4,4" }),
          Plot.dot(data, {
            x: "a",
            y: "b",
            r: 5,
            fill: (d: any) => (d.b > d.a ? "#16a34a" : d.b < d.a ? "#dc2626" : "#94a3b8"),
            stroke: "#fff",
            strokeWidth: 1,
            title: (d: any) => `${d.label}\n${baseYear}: ${formatEur(d.a)}\n${targetYear}: ${formatEur(d.b)}\nero: ${formatEur(d.b - d.a)}`,
          }),
          Plot.text(data.slice(0, Math.min(8, data.length)), {
            x: "a",
            y: "b",
            text: (d: any) => truncate(d.label, 30),
            textAnchor: "start",
            dx: 8,
            dy: -6,
            fontSize: 10.5,
            fill: "var(--fg-dim)",
          }),
        ],
      });
      host.appendChild(plot);
    } else {
      // bullet: muutospylväät
      type Item = { yKey: string; label: string; value: number };
      const data: Item[] = top.map((r) => ({
        yKey: r.label,
        label: r.label,
        value: diffType === "abs" ? r.absDiff : r.relDiff * 100,
      }));
      const plot = Plot.plot({
        width,
        height: Math.max(280, top.length * 30 + 80),
        marginLeft,
        marginRight: 140,
        marginBottom: 40,
        style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
        x: {
          label: diffType === "abs"
            ? `Ero ${targetYear} − ${baseYear} (€)`
            : `Suhteellinen muutos ${baseYear}→${targetYear} (%)`,
          grid: true,
          tickFormat: (v: number) => diffType === "abs" ? formatEur(v) : `${v.toFixed(0)} %`,
        },
        y: {
          label: null,
          domain: data.map((d) => d.yKey),
          tickFormat: () => "",
        },
        marks: [
          Plot.ruleX([0], { stroke: "var(--border)" }),
          Plot.barX(data, {
            x: "value",
            y: "yKey",
            fill: (d: any) => d.value >= 0 ? "#16a34a" : "#dc2626",
            inset: 2,
            title: (d: any) => `${d.label}\n${diffType === "abs" ? formatEur(d.value) : d.value.toFixed(1) + " %"}`,
          }),
          Plot.text(data, {
            x: 0,
            y: "yKey",
            text: (d: any) => d.label,
            textAnchor: "end",
            dx: -8,
            fontSize: 11.5,
            fontWeight: 500,
            fill: "var(--fg)",
            lineWidth: Math.max(20, Math.floor(marginLeft / 7)),
          }),
          Plot.text(data, {
            x: "value",
            y: "yKey",
            text: (d: any) =>
              diffType === "abs"
                ? (d.value >= 0 ? "  " : "") + formatEur(d.value)
                : `${d.value >= 0 ? "+" : ""}${d.value.toFixed(1)} %`,
            textAnchor: "start",
            dx: 6,
            fontSize: 10.5,
            fill: "var(--fg-dim)",
          }),
        ],
      });
      host.appendChild(plot);
    }
  }, [top, chartType, sortedYears, baseYear, targetYear, metric, diffType]);

  const toggleYear = (y: number) => {
    setYears((cur) => (cur.includes(y) ? cur.filter((x) => x !== y) : [...cur, y]));
  };

  return (
    <>
      <h1>Vuosivertailu</h1>
      <p className="lede">
        Valitse vähintään kaksi vuotta ja vertaa määrärahoja. Suurimmat erot nousevat kärkeen.
        Klikkaa taulukossa rivin "Avaa →" tai graafin alaista laatikkoa porautuaksesi
        syvemmälle: {nextLevelHint}.
      </p>

      <div className="panel">
        <div className="panel-title">Vertailuasetukset</div>

        <h3>Vuodet (valitse 2+)</h3>
        <div className="filter-chips">
          {availableYears.map((y) => (
            <button key={y} className={years.includes(y) ? "on" : ""} onClick={() => toggleYear(y)}>
              {y}
            </button>
          ))}
        </div>

        <h3>Mittari</h3>
        <div className="filter-chips">
          {(["maararaha_eur", "toteutuma_edellinen_eur"] as Metric[]).map((m) => (
            <button key={m} className={metric === m ? "on" : ""} onClick={() => setMetric(m)}>
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>

        <h3>Visualisointi</h3>
        <div className="filter-chips">
          <button className={chartType === "bars" ? "on" : ""} onClick={() => setChartType("bars")}>
            Rinnakkain pylväät
          </button>
          <button className={chartType === "bullet" ? "on" : ""} onClick={() => setChartType("bullet")}>
            Muutospylväät
          </button>
          <button className={chartType === "scatter" ? "on" : ""} onClick={() => setChartType("scatter")}>
            Hajontakuvio
          </button>
        </div>

        <h3>Järjestys &amp; muoto</h3>
        <div className="filter-chips">
          <button className={diffType === "abs" ? "on" : ""} onClick={() => setDiffType("abs")}>
            Absoluuttinen ero
          </button>
          <button className={diffType === "rel" ? "on" : ""} onClick={() => setDiffType("rel")}>
            Suhteellinen ero
          </button>
          <span style={{ width: 1, background: "var(--border)" }}></span>
          {[10, 15, 25, 50].map((n) => (
            <button key={n} className={topN === n ? "on" : ""} onClick={() => setTopN(n)}>
              Top {n}
            </button>
          ))}
          <span style={{ width: 1, background: "var(--border)" }}></span>
          <button className={showOnlyChanged ? "on" : ""} onClick={() => setShowOnlyChanged(!showOnlyChanged)}>
            Vain muuttuneet
          </button>
        </div>
      </div>

      <Breadcrumb crumbs={crumbs} />

      {years.length < 2 ? (
        <div className="callout">Valitse vähintään kaksi vuotta jatkaaksesi.</div>
      ) : rawQ.isLoading ? (
        <div className="loading">Ladataan vertailudataa…</div>
      ) : (
        <>
          <div className="panel">
            <div className="panel-title">
              {level === "paaluokka" ? "Hallinnonalat" : level === "luku" ? "Luvut" : "Momentit"}
              {" · "}{METRIC_LABELS[metric]} · Top {topN} · {baseYear} ↔ {targetYear}
            </div>
            <div className="panel-meta">
              Ero lasketaan pienimmän ja suurimman valitun vuoden välillä. Taulukon rivit ovat
              klikattavissa — porautuu seuraavalle tasolle.
            </div>
            <div ref={chartHostRef} className="plot-host" style={{ minHeight: 340 }} />
            <DataAttribution sourceId="vm-tae" detail={`Vuodet ${years.join(", ")}`} />
          </div>

          <div className="panel">
            <div className="panel-title">Suurimpien muutosten taulukko</div>
            <div style={{ overflowX: "auto" }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>{level === "paaluokka" ? "Hallinnonala" : level === "luku" ? "Luku" : "Momentti"}</th>
                    {sortedYears.map((y) => (
                      <th key={y} className="num" style={{ textAlign: "right" }}>{y}</th>
                    ))}
                    <th className="num" style={{ textAlign: "right" }}>Ero (€)</th>
                    <th className="num" style={{ textAlign: "right" }}>Ero (%)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((r, i) => (
                    <tr
                      key={r.key}
                      className={level !== "momentti" ? "clickable" : ""}
                      onClick={() => { if (level !== "momentti") drillInto(r); }}
                    >
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{highlight(r.label)}</div>
                        {r.sublabel ? <div style={{ color: "var(--fg-dim)", fontSize: 11.5 }}>{highlight(r.sublabel)}</div> : null}
                      </td>
                      {sortedYears.map((y) => (
                        <td key={y} className="num">{formatEur(r.values.get(y) ?? 0)}</td>
                      ))}
                      <td className="num" style={{ color: r.absDiff >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {r.absDiff >= 0 ? "+" : ""}{formatEur(r.absDiff)}
                      </td>
                      <td className="num" style={{ color: r.relDiff >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {r.a === 0 ? "—" : `${r.relDiff >= 0 ? "+" : ""}${(r.relDiff * 100).toFixed(1).replace(".", ",")} %`}
                      </td>
                      <td>
                        {level !== "momentti" ? (
                          <button className="ghost" onClick={(e) => { e.stopPropagation(); drillInto(r); }}>
                            Avaa →
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {level === "momentti" ? (
              <div className="panel-meta" style={{ marginTop: 10 }}>
                Momentti on syvin taso vertailussa. Tarkemmat tiedot löytyvät{" "}
                <a href="/">Yleiskuvasta</a> (drill-down + aikasarja + dokumenttivertailu).
              </div>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
