import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Plot from "@observablehq/plot";
import { formatEur } from "../data/format";
import { staticUrl } from "../data/paths";

/**
 * Porautuva analytiikkanäkymä Kehysriihi 2026 -paketille.
 * Kaikki data tulee kehysriihi-paketin analytics.json:sta, joka on
 * käsin strukturoitu suoraan VM:n kehysehdotus-PDF:stä.
 *
 * Näkymät:
 *  1) Avainluvut — nopea yleiskuva numeroista
 *  2) Hallinnonalat 2027–2030 — pylväsvertailu, drill-down aikasarjaan
 *  3) Verotulot ja verotusmuutokset — stackattu aikasarja + waterfall
 *  4) Tulot/menot/alijäämä/velka — kokonaiskuva
 *  5) Kehyksen ulkopuoliset menot — pinottu aluegraafi
 *  6) Linkit muuhun sovelluksen dataan
 */

interface Analytics {
  source: string;
  note: string;
  avainluvut: Record<string, number>;
  hallinnonalat: Array<{
    num: number;
    nimi: string;
    vuodet: Array<{ v: number; kaikki: number; kehys: number; ulkop: number }>;
  }>;
  ulkopuoliset_menot: Array<{
    kategoria: string;
    mrd: Record<string, number>;
  }>;
  verotulot: Array<{
    kategoria: string;
    mrd: Record<string, number>;
    vuosimuutos_pct: number;
  }>;
  tasapaino: Array<{
    vuosi: number;
    tulot_mrd: number;
    menot_mrd: number;
    tasapaino_mrd: number;
    velka_bkt_pct: number;
    huomio: string | null;
  }>;
  veromuutokset: Array<{
    nimi: string;
    suunta: "lisays" | "vahennys";
    vaikutus_m_eur: Record<string, number>;
  }>;
  linkit_sovelluksen_dataan: Record<string, string>;
}

type Tab = "avainkohdat" | "yleiskuva" | "hallinnonalat" | "verotus" | "tasapaino" | "ulkopuoliset" | "haku" | "linkit";

interface KehysriihiAnalyticsProps {
  slug: string;
  /** Paketin avainkohdat — näytetään ensimmäisenä välilehtenä. */
  highlights?: string[];
}

export default function KehysriihiAnalytics({ slug, highlights = [] }: KehysriihiAnalyticsProps) {
  const [tab, setTab] = useState<Tab>("avainkohdat");
  // Oletuksena auki — analytiikka on paketin pääsisältö.
  const [open, setOpen] = useState<boolean>(true);

  const dataQ = useQuery<Analytics | null>({
    queryKey: ["kehysriihi_analytics", slug],
    queryFn: async () => {
      const r = await fetch(staticUrl(`/updates/${slug}/analytics.json`));
      if (!r.ok) return null;
      return await r.json();
    },
    enabled: open,
  });

  return (
    <div className="panel">
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="panel-title">Analyyttinen porautuva näkymä</div>
          <div className="panel-meta">
            {open
              ? "Kaikki numerot poimittu VM:n kehysehdotus-PDF:stä 2027–2030. Vaihda alta näkymää ja klikkaa elementtejä porautuaksesi."
              : "Avainkohdat, hallinnonalavertailu, verotulot, tasapaino ja haku paketin dokumentteihin."}
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          aria-expanded={open}
          aria-controls="kehysriihi-analytics-body"
        >
          <span style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms", fontSize: 11 }}>▾</span>
          {open ? "Piilota analytiikka" : "Avaa analytiikka"}
        </button>
      </div>

      {!open ? null : (
        <div id="kehysriihi-analytics-body">
          <div className="filter-chips" style={{ marginTop: 14 }}>
            <button className={tab === "avainkohdat" ? "on" : ""} onClick={() => setTab("avainkohdat")}>Avainkohdat</button>
            <button className={tab === "yleiskuva" ? "on" : ""} onClick={() => setTab("yleiskuva")}>Avainluvut</button>
            <button className={tab === "hallinnonalat" ? "on" : ""} onClick={() => setTab("hallinnonalat")}>Hallinnonalat</button>
            <button className={tab === "verotus" ? "on" : ""} onClick={() => setTab("verotus")}>Verotulot & veromuutokset</button>
            <button className={tab === "tasapaino" ? "on" : ""} onClick={() => setTab("tasapaino")}>Tulot/menot/alijäämä</button>
            <button className={tab === "ulkopuoliset" ? "on" : ""} onClick={() => setTab("ulkopuoliset")}>Kehyksen ulkopuoliset</button>
            <button className={tab === "haku" ? "on" : ""} onClick={() => setTab("haku")}>Haku pakettiin</button>
            <button className={tab === "linkit" ? "on" : ""} onClick={() => setTab("linkit")}>Linkit muuhun dataan</button>
          </div>

          <div style={{ marginTop: 18 }}>
            {tab === "avainkohdat" && <Avainkohdat highlights={highlights} />}
            {tab !== "avainkohdat" && dataQ.isLoading && <div className="loading">Ladataan analytiikkaa…</div>}
            {tab !== "avainkohdat" && dataQ.data && (
              <>
                {tab === "yleiskuva" && <Avainluvut d={dataQ.data} />}
                {tab === "hallinnonalat" && <Hallinnonalat d={dataQ.data} />}
                {tab === "verotus" && <Verotus d={dataQ.data} />}
                {tab === "tasapaino" && <Tasapaino d={dataQ.data} />}
                {tab === "ulkopuoliset" && <Ulkopuoliset d={dataQ.data} />}
                {tab === "haku" && <HakuPakettiin slug={slug} d={dataQ.data} />}
                {tab === "linkit" && <Linkit d={dataQ.data} />}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Avainkohdat({ highlights }: { highlights: string[] }) {
  if (highlights.length === 0) {
    return <div className="panel-meta">Ei avainkohtia saatavilla.</div>;
  }
  return (
    <>
      <div className="panel-meta" style={{ marginBottom: 14 }}>
        Paketin pääpointit yhdellä silmäyksellä — käytettäväksi tiivistelmänä tai
        keskustelun avauksena. Numeeriseen analyysiin porautuminen tapahtuu alta
        löytyvistä välilehdistä.
      </div>
      <div className="grid cols-2">
        {highlights.map((h, i) => (
          <div
            key={i}
            style={{
              padding: "14px 18px",
              background: "var(--grad-subtle)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 14,
              lineHeight: 1.5,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <span style={{
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              marginTop: 1,
            }}>
              {i + 1}
            </span>
            <span style={{ color: "var(--fg)" }}>{h}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================
// 1. Avainluvut
// ============================================================

function Avainluvut({ d }: { d: Analytics }) {
  const k = d.avainluvut;
  const card = (label: string, value: string, sub?: string) => (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
  return (
    <div className="grid cols-3">
      {card("Alijäämä ka. 2027–2030", `${k.alijaama_ka_2027_2030_mrd} mrd €`, "Keskimäärin per vuosi")}
      {card("Valtionvelka 2030", `${k.velka_2030_mrd} mrd €`, `${k.velka_bkt_2030_pct} % BKT:sta`)}
      {card("Korkomenot 2030", `${k.korkomenot_2030_mrd} mrd €`, `Vs. ${k.korkomenot_2026_mrd} mrd € v. 2026`)}
      {card("Menot 2030", `${k.menot_2030_mrd} mrd €`, `v. 2027: ${k.menot_2027_mrd} mrd €`)}
      {card("Tulot 2030", `${k.tulot_2030_mrd} mrd €`, `v. 2027: ${k.tulot_2027_mrd} mrd €`)}
      {card("Yhteisöverokanta 2027", `${k.yhteisovero_2027_pct} %`, `Alennus ${k.yhteisovero_2026_pct} → ${k.yhteisovero_2027_pct} %`)}
      {card("Puolustusmenot 2030", `~${k.puolustusmenot_bkt_2030_pct} % BKT`, `Naton sitoumus ${k.nato_sitoumus_bkt_2035_pct} % vuoteen 2035`)}
      {card("Vaalikauden kehys 2027", `${(k.vaalikauden_kehys_2027 / 1000).toFixed(1)} mrd €`, `Harkinnanvarainen alennus ${k.kehyksen_harkinnanvarainen_alennus_2027} M€`)}
      {card("Alijäämä 2028 → 2030", `${k.alijaama_2028_mrd} → ${k.alijaama_2030_mrd} mrd €`, "Kasvaa vuosi vuodelta")}
    </div>
  );
}

// ============================================================
// 2. Hallinnonalat (porautuva)
// ============================================================

function Hallinnonalat({ d }: { d: Analytics }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [year, setYear] = useState<number>(2027);
  const [metric, setMetric] = useState<"kaikki" | "kehys" | "ulkop">("kaikki");

  const rows = useMemo(() => {
    return d.hallinnonalat.map((h) => {
      const y = h.vuodet.find((x) => x.v === year)!;
      return { ...h, arvo: y[metric], y };
    }).sort((a, b) => b.arvo - a.arvo);
  }, [d.hallinnonalat, year, metric]);

  const barHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = barHost.current;
    if (!host) return;
    host.innerHTML = "";
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: Math.max(300, rows.length * 28 + 60),
      marginLeft: 220,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: {
        label: metric === "kaikki" ? "Kaikki menot (M€)" : metric === "kehys" ? "Kehysmenot (M€)" : "Kehyksen ulkopuoliset (M€)",
        grid: true,
        tickFormat: (v: number) => formatEur(v * 1e6),
      },
      y: { label: null, domain: rows.map((r) => r.nimi) },
      marks: [
        Plot.ruleX([0], { stroke: "var(--border)" }),
        Plot.barX(rows, {
          x: "arvo",
          y: "nimi",
          fill: (r: any) => (r.num === selected ? "#4f46e5" : "#94a3b8"),
          title: (r: any) => `${r.num} ${r.nimi}\n${formatEur(r.arvo * 1e6)}`,
          inset: 1,
        }),
        Plot.text(rows, {
          x: "arvo",
          y: "nimi",
          text: (r: any) => formatEur(r.arvo * 1e6),
          dx: 6,
          textAnchor: "start",
          fontSize: 11,
          fill: "var(--fg-dim)",
        }),
      ],
    });
    // Klikkaus — selectaa hallinnonalan
    host.appendChild(plot);
    const bars = host.querySelectorAll<SVGRectElement>("g[aria-label=bar] rect, g[aria-label='bar'] rect");
    bars.forEach((bar) => {
      (bar as unknown as HTMLElement).style.cursor = "pointer";
    });
    // Yksinkertaisempi: liitetään labeleihin klikkaus
    const labels = host.querySelectorAll<SVGTextElement>("text");
    labels.forEach((label) => {
      const text = label.textContent ?? "";
      const row = rows.find((r) => r.nimi === text);
      if (row) {
        (label as unknown as HTMLElement).style.cursor = "pointer";
        label.addEventListener("click", () => setSelected(row.num));
      }
    });
  }, [rows, metric, selected]);

  const selectedH = d.hallinnonalat.find((h) => h.num === selected);
  const tsHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = tsHost.current;
    if (!host || !selectedH) return;
    host.innerHTML = "";
    const data: Array<{ v: number; arvo: number; sarja: string }> = [];
    for (const y of selectedH.vuodet) {
      data.push({ v: y.v, arvo: y.kehys, sarja: "Kehysmenot" });
      data.push({ v: y.v, arvo: y.ulkop, sarja: "Kehyksen ulkopuoliset" });
    }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 280,
      marginLeft: 80,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d" },
      y: { label: "Miljoonaa €", grid: true, tickFormat: (v: number) => formatEur(v * 1e6) },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.areaY(data, { x: "v", y: "arvo", fill: "sarja", fillOpacity: 0.7 }),
        Plot.line(data, { x: "v", y: "arvo", stroke: "sarja", strokeWidth: 2 }),
        Plot.dot(data, {
          x: "v",
          y: "arvo",
          fill: "sarja",
          r: 3,
          title: (d: any) => `${d.sarja}\n${d.v}: ${formatEur(d.arvo * 1e6)}`,
        }),
      ],
    });
    host.appendChild(plot);
  }, [selectedH]);

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <label>Vuosi:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          {[2027, 2028, 2029, 2030].map((y) => (
            <button key={y} className={year === y ? "on" : ""} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
        <span style={{ color: "var(--fg-dim)" }}>|</span>
        <label>Mittari:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          <button className={metric === "kaikki" ? "on" : ""} onClick={() => setMetric("kaikki")}>Kaikki</button>
          <button className={metric === "kehys" ? "on" : ""} onClick={() => setMetric("kehys")}>Vain kehysmenot</button>
          <button className={metric === "ulkop" ? "on" : ""} onClick={() => setMetric("ulkop")}>Vain kehyksen ulkopuoliset</button>
        </div>
      </div>

      <div ref={barHost} className="plot-host" style={{ minHeight: 300 }} />
      <div className="panel-meta" style={{ marginTop: 8 }}>
        💡 Klikkaa hallinnonalan nimeä alla olevassa taulukossa nähdäksesi sen aikasarjan.
      </div>

      <table className="data" style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Hallinnonala</th>
            <th className="num">Kaikki</th>
            <th className="num hide-mobile">Kehys</th>
            <th className="num hide-mobile">Ulkop.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.num}
              className="clickable"
              style={r.num === selected ? { background: "var(--accent-soft)" } : undefined}
              onClick={() => setSelected(r.num)}
            >
              <td>{r.num}</td>
              <td style={{ fontSize: 13 }}>
                {r.nimi}
                <Link
                  to={`/?paaluokka=${r.num}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginLeft: 10, fontSize: 11, color: "var(--accent)" }}
                >
                  → Yleiskuvaan
                </Link>
              </td>
              <td className="num">{formatEur(r.y.kaikki * 1e6)}</td>
              <td className="num hide-mobile">{formatEur(r.y.kehys * 1e6)}</td>
              <td className="num hide-mobile">{formatEur(r.y.ulkop * 1e6)}</td>
              <td>
                <button className="ghost" onClick={(e) => { e.stopPropagation(); setSelected(r.num); }}>
                  Aikasarja →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedH ? (
        <div className="panel" style={{ marginTop: 18, background: "var(--grad-subtle)" }}>
          <div className="panel-title">
            {selectedH.num} · {selectedH.nimi} — aikasarja 2027–2030
          </div>
          <div className="panel-meta">
            Kehysmenot (kehyssääntö kattaa) vs. kehyksen ulkopuoliset (mm. suhdannelauteiset).
          </div>
          <div ref={tsHost} className="plot-host" style={{ minHeight: 280 }} />
          <table className="data" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Vuosi</th><th className="num">Kehys</th><th className="num">Ulkop.</th><th className="num">Yhteensä</th></tr>
            </thead>
            <tbody>
              {selectedH.vuodet.map((y) => (
                <tr key={y.v}>
                  <td>{y.v}</td>
                  <td className="num">{formatEur(y.kehys * 1e6)}</td>
                  <td className="num">{formatEur(y.ulkop * 1e6)}</td>
                  <td className="num"><b>{formatEur(y.kaikki * 1e6)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

// ============================================================
// 3. Verotus
// ============================================================

function Verotus({ d }: { d: Analytics }) {
  const [view, setView] = useState<"verotulot" | "veromuutokset">("verotulot");

  const stackHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (view !== "verotulot") return;
    const host = stackHost.current;
    if (!host) return;
    host.innerHTML = "";
    const data: Array<{ v: number; kategoria: string; arvo: number }> = [];
    for (const v of d.verotulot) {
      for (const [y, arvo] of Object.entries(v.mrd)) {
        data.push({ v: Number(y), kategoria: v.kategoria, arvo });
      }
    }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 360,
      marginLeft: 80,
      marginRight: 160,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d" },
      y: { label: "Mrd €", grid: true },
      color: { legend: true, scheme: "tableau10", label: "Verolaji" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.areaY(data, {
          x: "v",
          y: "arvo",
          fill: "kategoria",
          fillOpacity: 0.85,
          title: (d: any) => `${d.kategoria}\n${d.v}: ${d.arvo} mrd €`,
        }),
      ],
    });
    host.appendChild(plot);
  }, [d.verotulot, view]);

  // Veromuutokset: yksittäiset toimenpiteet vuosittain
  const diffHost = useRef<HTMLDivElement | null>(null);
  const [year, setYear] = useState(2027);
  useEffect(() => {
    if (view !== "veromuutokset") return;
    const host = diffHost.current;
    if (!host) return;
    const data = d.veromuutokset
      .map((v) => ({ nimi: v.nimi, arvo: v.vaikutus_m_eur[String(year)] ?? 0 }))
      .filter((x) => x.arvo !== 0)
      .sort((a, b) => a.arvo - b.arvo);
    if (data.length === 0) { host.innerHTML = "<div class='loading'>Ei muutoksia tälle vuodelle.</div>"; return; }
    host.innerHTML = "";
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: Math.max(300, data.length * 28 + 40),
      marginLeft: 320,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: {
        label: `Vaikutus valtion verotuottoon ${year} (M€)`,
        grid: true,
        tickFormat: (v: number) => formatEur(v * 1e6),
      },
      y: { label: null, domain: data.map((d) => d.nimi) },
      marks: [
        Plot.ruleX([0], { stroke: "var(--fg-dim)" }),
        Plot.barX(data, {
          x: "arvo",
          y: "nimi",
          fill: (d: any) => (d.arvo >= 0 ? "#16a34a" : "#dc2626"),
          title: (d: any) => `${d.nimi}\n${d.arvo >= 0 ? "+" : ""}${formatEur(d.arvo * 1e6)}`,
          inset: 1,
        }),
        Plot.text(data, {
          x: "arvo",
          y: "nimi",
          text: (d: any) => `${d.arvo >= 0 ? "  " : ""}${d.arvo >= 0 ? "+" : ""}${formatEur(d.arvo * 1e6)}`,
          textAnchor: "start",
          dx: 6,
          fontSize: 11,
          fill: "var(--fg-dim)",
        }),
      ],
    });
    host.appendChild(plot);
  }, [d.veromuutokset, view, year]);

  return (
    <>
      <div className="filter-chips">
        <button className={view === "verotulot" ? "on" : ""} onClick={() => setView("verotulot")}>
          Verotulojen kehitys
        </button>
        <button className={view === "veromuutokset" ? "on" : ""} onClick={() => setView("veromuutokset")}>
          Veroperustemuutosten vaikutus
        </button>
      </div>

      {view === "verotulot" ? (
        <>
          <div ref={stackHost} className="plot-host" style={{ minHeight: 360, marginTop: 14 }} />
          <table className="data" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Verolaji</th>
                {[2026,2027,2028,2029,2030].map((y) => <th key={y} className="num">{y}</th>)}
                <th className="num hide-mobile">Kasvu­vauhti 2027–2030</th>
              </tr>
            </thead>
            <tbody>
              {d.verotulot.map((v) => (
                <tr key={v.kategoria}>
                  <td>{v.kategoria}</td>
                  {[2026,2027,2028,2029,2030].map((y) => (
                    <td key={y} className="num">{(v.mrd[String(y)] ?? 0).toFixed(1)} mrd</td>
                  ))}
                  <td className="num hide-mobile" style={{ color: v.vuosimuutos_pct >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {v.vuosimuutos_pct >= 0 ? "+" : ""}{v.vuosimuutos_pct.toFixed(1)} %/v
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <div className="toolbar" style={{ marginTop: 14 }}>
            <label>Vuosi:</label>
            <div className="filter-chips" style={{ marginTop: 0 }}>
              {[2027,2028,2029,2030].map((y) => (
                <button key={y} className={year === y ? "on" : ""} onClick={() => setYear(y)}>{y}</button>
              ))}
            </div>
          </div>
          <div ref={diffHost} className="plot-host" style={{ minHeight: 300 }} />
          <div className="panel-meta" style={{ marginTop: 8 }}>
            🟢 = verotuloja lisäävä · 🔴 = verotuloja vähentävä. Pylvään pituus osoittaa vaikutuksen suuruuden valtion verotuottoon.
          </div>
        </>
      )}
    </>
  );
}

// ============================================================
// 4. Tasapaino — tulot, menot, alijäämä, velka
// ============================================================

function Tasapaino({ d }: { d: Analytics }) {
  const barHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = barHost.current;
    if (!host) return;
    host.innerHTML = "";
    const data: Array<{ v: number; sarja: string; arvo: number }> = [];
    for (const t of d.tasapaino) {
      data.push({ v: t.vuosi, sarja: "Tulot", arvo: t.tulot_mrd });
      data.push({ v: t.vuosi, sarja: "Menot", arvo: t.menot_mrd });
    }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 320,
      marginLeft: 70,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d" },
      y: { label: "Mrd €", grid: true },
      color: { legend: true, range: ["#16a34a", "#dc2626"], domain: ["Tulot", "Menot"] },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.barY(data, {
          x: "v",
          y: "arvo",
          fill: "sarja",
          fillOpacity: 0.85,
          title: (d: any) => `${d.sarja} ${d.v}: ${d.arvo} mrd €`,
          inset: 4,
          offset: "center" as any,
        }),
      ],
    });
    host.appendChild(plot);
  }, [d.tasapaino]);

  const deficitHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = deficitHost.current;
    if (!host) return;
    host.innerHTML = "";
    const data = d.tasapaino.map((t) => ({ v: t.vuosi, tasapaino: t.tasapaino_mrd, velka: t.velka_bkt_pct }));
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 320,
      marginLeft: 70,
      marginRight: 70,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d" },
      y: { label: "Alijäämä (mrd €)", grid: true },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.barY(data, {
          x: "v",
          y: "tasapaino",
          fill: "#dc2626",
          fillOpacity: 0.75,
          title: (d: any) => `${d.v}: alijäämä ${Math.abs(d.tasapaino)} mrd €, velka ${d.velka} % BKT`,
          inset: 4,
        }),
        Plot.text(data, {
          x: "v",
          y: "tasapaino",
          text: (d: any) => `${d.tasapaino} mrd €`,
          dy: 12,
          textAnchor: "middle",
          fontSize: 11,
          fill: "#fff",
          fontWeight: 600,
        }),
        Plot.text(data, {
          x: "v",
          y: 0,
          text: (d: any) => `velka ${d.velka} %`,
          dy: -10,
          textAnchor: "middle",
          fontSize: 10.5,
          fill: "var(--fg-dim)",
        }),
      ],
    });
    host.appendChild(plot);
  }, [d.tasapaino]);

  return (
    <>
      <h3 style={{ textTransform: "none", letterSpacing: 0, color: "var(--fg)", fontSize: 14, margin: "0 0 8px" }}>
        Tulot vs. menot
      </h3>
      <div ref={barHost} className="plot-host" style={{ minHeight: 320 }} />

      <h3 style={{ textTransform: "none", letterSpacing: 0, color: "var(--fg)", fontSize: 14, margin: "16px 0 8px" }}>
        Alijäämä ja velka-aste
      </h3>
      <div ref={deficitHost} className="plot-host" style={{ minHeight: 320 }} />

      <table className="data" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Vuosi</th>
            <th className="num">Tulot</th>
            <th className="num">Menot</th>
            <th className="num">Tasapaino</th>
            <th className="num">Velka / BKT</th>
            <th className="hide-mobile">Huomio</th>
          </tr>
        </thead>
        <tbody>
          {d.tasapaino.map((t) => (
            <tr key={t.vuosi}>
              <td>{t.vuosi}</td>
              <td className="num">{t.tulot_mrd} mrd</td>
              <td className="num">{t.menot_mrd} mrd</td>
              <td className="num" style={{ color: "var(--danger)" }}>{t.tasapaino_mrd} mrd</td>
              <td className="num">{t.velka_bkt_pct} %</td>
              <td className="hide-mobile" style={{ fontSize: 12, color: "var(--fg-dim)" }}>{t.huomio ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ============================================================
// 5. Kehyksen ulkopuoliset menot
// ============================================================

function Ulkopuoliset({ d }: { d: Analytics }) {
  const stackHost = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = stackHost.current;
    if (!host) return;
    host.innerHTML = "";
    const data: Array<{ v: number; kategoria: string; arvo: number }> = [];
    for (const u of d.ulkopuoliset_menot) {
      for (const [y, arvo] of Object.entries(u.mrd)) {
        data.push({ v: Number(y), kategoria: u.kategoria, arvo });
      }
    }
    const width = host.clientWidth || 900;
    const plot = Plot.plot({
      width,
      height: 400,
      marginLeft: 70,
      marginRight: 240,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d" },
      y: { label: "Mrd €", grid: true },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.areaY(data.filter((d) => d.arvo > 0), {
          x: "v",
          y: "arvo",
          fill: "kategoria",
          fillOpacity: 0.85,
          title: (d: any) => `${d.kategoria}\n${d.v}: ${d.arvo} mrd €`,
        }),
      ],
    });
    host.appendChild(plot);
  }, [d.ulkopuoliset_menot]);

  return (
    <>
      <div className="panel-meta">
        Kehyksen <b>ulkopuolelle</b> jäävät suhdannelauteiset menot, valtionvelan korkomenot,
        arvonlisävero­määrärahat ja muut automaattisesti muuttuvat erät. Näiden yhteissumma
        kasvaa 12,5 mrd €:sta (2026) 14,7 mrd €:oon (2030). Suurin kasvaja on korkomenot (+2,7 mrd €).
      </div>
      <div ref={stackHost} className="plot-host" style={{ minHeight: 400, marginTop: 14 }} />

      <table className="data" style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th>Kategoria</th>
            {[2026,2027,2028,2029,2030].map((y) => <th key={y} className="num">{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {d.ulkopuoliset_menot.map((u) => (
            <tr key={u.kategoria}>
              <td>{u.kategoria}</td>
              {[2026,2027,2028,2029,2030].map((y) => (
                <td key={y} className="num">{(u.mrd[String(y)] ?? 0).toFixed(1)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ============================================================
// 6. Haku pakettiin (vain tämän paketin dokumentteihin)
// ============================================================

interface Doc {
  id: string;
  title: string;
  source: string;
  /** Mistä avataan ulkoinen versio — PDF tai valto-sivu */
  open_url?: string;
  /** Reitti sovelluksen sisällä kun haluat jatkaa tutkimusta */
  internal_url?: string;
  icon: "pdf" | "md" | "data" | "link";
  text: string;
}

interface SearchHit {
  doc: Doc;
  /** Osumat: snippet tekstiä, indeksi johon osuu */
  snippets: Array<{ text: string; index: number }>;
  totalHits: number;
}

interface UpdateMetaLite {
  pdfs: Array<{ md_path: string; filename: string; title: string; source: string; local_path: string; url: string }>;
  links: Array<{ url: string; title: string; source: string; note: string }>;
  summary_path: string;
  sources_path: string;
}

function HakuPakettiin({ slug, d }: { slug: string; d: Analytics }) {
  const [q, setQ] = useState("");

  const metaQ = useQuery<UpdateMetaLite | null>({
    queryKey: ["kehysriihi_meta_for_search", slug],
    queryFn: async () => {
      const r = await fetch(staticUrl(`/updates/${slug}/index.json`));
      if (!r.ok) return null;
      return await r.json();
    },
  });

  // Kerää kaikki paketin tekstilähteet (summary, sources, PDF→MD, analytics-avainluvut).
  // Ladataan kerran tabin avauksessa ja pidetään muistissa.
  const docsQ = useQuery<Doc[]>({
    queryKey: ["kehysriihi_search_docs", slug, metaQ.data?.pdfs.length],
    enabled: !!metaQ.data,
    queryFn: async (): Promise<Doc[]> => {
      if (!metaQ.data) return [];
      const docs: Doc[] = [];

      // summary.md
      try {
        const r = await fetch(staticUrl(`/updates/${slug}/summary.md`));
        if (r.ok) {
          docs.push({
            id: "summary",
            title: "Tiivistelmä",
            source: "Paketin käsinkirjoitettu yhteenveto",
            icon: "md",
            text: await r.text(),
          });
        }
      } catch { /* ohitetaan */ }

      // sources.md
      try {
        const r = await fetch(staticUrl(`/updates/${slug}/sources.md`));
        if (r.ok) {
          docs.push({
            id: "sources",
            title: "Lähdeviitteet",
            source: "Paketin lähdeluettelo",
            icon: "md",
            text: await r.text(),
          });
        }
      } catch { /* ohitetaan */ }

      // PDF→MD -tiedostot
      for (const p of metaQ.data.pdfs) {
        try {
          const r = await fetch(staticUrl(p.md_path));
          if (r.ok) {
            docs.push({
              id: `pdf:${p.filename}`,
              title: p.title,
              source: `${p.source} · PDF → markdown`,
              open_url: staticUrl(p.local_path),
              icon: "pdf",
              text: await r.text(),
            });
          }
        } catch { /* ohitetaan */ }
      }

      // analytics.json — avainluvut ja hallinnonalat tekstinä haettavaksi
      const lines: string[] = [];
      lines.push("Avainluvut");
      for (const [k, v] of Object.entries(d.avainluvut)) {
        lines.push(`${k.replace(/_/g, " ")}: ${v}`);
      }
      lines.push("\nHallinnonalat 2027–2030 (M€, vuoden 2027 hinnoin)");
      for (const h of d.hallinnonalat) {
        for (const y of h.vuodet) {
          lines.push(`${h.num} ${h.nimi} ${y.v}: kaikki ${y.kaikki}, kehys ${y.kehys}, ulkop. ${y.ulkop}`);
        }
      }
      lines.push("\nVerotulot 2026–2030 (mrd €)");
      for (const v of d.verotulot) {
        lines.push(`${v.kategoria}: ${JSON.stringify(v.mrd)} (kasvu ${v.vuosimuutos_pct} %/v)`);
      }
      lines.push("\nVeroperustemuutosten vaikutus (M€)");
      for (const v of d.veromuutokset) {
        lines.push(`${v.nimi}: ${JSON.stringify(v.vaikutus_m_eur)}`);
      }
      lines.push("\nBudjettitalouden tasapaino (mrd €)");
      for (const t of d.tasapaino) {
        lines.push(`${t.vuosi}: tulot ${t.tulot_mrd}, menot ${t.menot_mrd}, tasapaino ${t.tasapaino_mrd}, velka ${t.velka_bkt_pct} % BKT` +
                   (t.huomio ? ` — ${t.huomio}` : ""));
      }
      lines.push("\nKehyksen ulkopuoliset menot (mrd €)");
      for (const u of d.ulkopuoliset_menot) {
        lines.push(`${u.kategoria}: ${JSON.stringify(u.mrd)}`);
      }
      docs.push({
        id: "data:analytics",
        title: "Analytiikkataulukot",
        source: "Strukturoidut luvut (analytics.json)",
        icon: "data",
        text: lines.join("\n"),
      });

      // Ulkoiset linkit — haku osuu otsikkoon ja kuvaukseen
      for (const l of metaQ.data.links) {
        docs.push({
          id: `link:${l.url}`,
          title: l.title,
          source: `${l.source} · ulkoinen linkki`,
          open_url: l.url,
          icon: "link",
          text: `${l.title}\n${l.source}\n${l.note}`,
        });
      }

      return docs;
    },
  });

  const hits: SearchHit[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    const docs = docsQ.data ?? [];
    if (query.length < 2) return [];
    const results: SearchHit[] = [];
    for (const doc of docs) {
      const hay = doc.text.toLowerCase();
      if (!hay.includes(query)) continue;
      const snippets: SearchHit["snippets"] = [];
      let idx = hay.indexOf(query);
      let total = 0;
      while (idx !== -1) {
        total++;
        if (snippets.length < 3) {
          const start = Math.max(0, idx - 80);
          const end = Math.min(doc.text.length, idx + query.length + 160);
          snippets.push({
            index: idx,
            text: (start > 0 ? "…" : "") + doc.text.slice(start, end) + (end < doc.text.length ? "…" : ""),
          });
        }
        idx = hay.indexOf(query, idx + query.length);
      }
      results.push({ doc, snippets, totalHits: total });
    }
    // järjestys: eniten osumia ensin, PDF:t ennen ulkoisia linkkejä
    results.sort((a, b) => {
      const order = { pdf: 0, md: 1, data: 2, link: 3 } as const;
      if (order[a.doc.icon] !== order[b.doc.icon]) return order[a.doc.icon] - order[b.doc.icon];
      return b.totalHits - a.totalHits;
    });
    return results;
  }, [q, docsQ.data]);

  const highlight = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#fef08a", padding: "0 2px", borderRadius: 3 }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const iconFor = (kind: Doc["icon"]) => {
    const common = { width: 16, height: 16, viewBox: "0 0 24 24" };
    if (kind === "pdf") return (
      <svg {...common}>
        <rect x="5" y="2" width="14" height="20" rx="2" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.4" />
        <text x="12" y="15" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#dc2626">PDF</text>
      </svg>
    );
    if (kind === "md") return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#eef2ff" stroke="#4f46e5" strokeWidth="1.4" />
        <path d="M 6 15 L 6 9 L 9 12 L 12 9 L 12 15" fill="none" stroke="#4f46e5" strokeWidth="1.4" />
      </svg>
    );
    if (kind === "data") return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="2" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.4" />
        <path d="M 8 16 L 8 12 M 12 16 L 12 8 M 16 16 L 16 14" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
    return (
      <svg {...common}>
        <path d="M 14 5 L 19 5 L 19 10 M 19 5 L 11 13 M 5 7 L 5 19 L 17 19 L 17 13" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <>
      <div className="panel-meta" style={{ marginBottom: 10 }}>
        Haku kohdistuu <b>vain tämän paketin</b> dokumentteihin: PDF:ien tekstisisältöön
        (pdfplumber-puretut MD:t), tiivistelmään, lähdeluetteloon sekä strukturoituihin
        analytiikkalukuihin. Yläpalkin globaali haku ei vaikuta täällä.
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hae esim. 'alijäämä', 'puolustus', 'yhteisövero', 'hyvinvointialueet'…"
          autoFocus
          style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
        />
      </div>

      {docsQ.isLoading ? (
        <div className="loading">Ladataan paketin dokumentteja hakua varten…</div>
      ) : q.trim().length < 2 ? (
        <div className="callout">
          Kirjoita vähintään kaksi merkkiä. Paketti sisältää{" "}
          <b>{docsQ.data?.length ?? 0}</b> hakukelpoista kohdetta
          ({docsQ.data?.filter((d) => d.icon === "pdf").length ?? 0} PDF-dokumenttia,{" "}
          {docsQ.data?.filter((d) => d.icon === "md").length ?? 0} tekstitiivistelmää,{" "}
          strukturoidut analytiikkaluvut + ulkoiset linkit).
        </div>
      ) : hits.length === 0 ? (
        <div className="loading">Ei osumia hakusanalla &quot;{q}&quot;.</div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "var(--fg-dim)", marginBottom: 10 }}>
            {hits.length} dokumenttia, yhteensä {hits.reduce((s, h) => s + h.totalHits, 0)} osumaa
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {hits.map((h) => (
              <div key={h.doc.id} className="panel" style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                    <span style={{ flexShrink: 0, marginTop: 2 }}>{iconFor(h.doc.icon)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{highlight(h.doc.title, q)}</div>
                      <div style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 2 }}>
                        {h.doc.source} · <b>{h.totalHits}</b> osuma{h.totalHits === 1 ? "" : "a"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {h.doc.open_url ? (
                      <a href={h.doc.open_url} target="_blank" rel="noreferrer">
                        <button className="icon-btn">
                          {h.doc.icon === "link" ? "Avaa linkki ↗" : h.doc.icon === "pdf" ? "Avaa PDF ↗" : "Avaa ↗"}
                        </button>
                      </a>
                    ) : null}
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {h.snippets.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      padding: "8px 12px",
                      background: "var(--bg)",
                      borderLeft: "3px solid var(--accent)",
                      borderRadius: 4,
                    }}>
                      {highlight(s.text, q)}
                    </div>
                  ))}
                  {h.totalHits > h.snippets.length ? (
                    <div style={{ fontSize: 11.5, color: "var(--fg-dim)", fontStyle: "italic" }}>
                      + {h.totalHits - h.snippets.length} muuta osumaa…
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ============================================================
// 7. Linkit muuhun sovelluksen dataan
// ============================================================

function Linkit({ d }: { d: Analytics }) {
  const L = d.linkit_sovelluksen_dataan;
  const cards = [
    {
      to: "/",
      label: "Yleiskuva",
      title: "Hallinnonalojen historia ja drill-down",
      text: L.hallinnonalat_yleiskuva,
    },
    {
      to: "/julkinen-talous",
      label: "Julkinen talous",
      title: "EDP-velka 1975→ ja COFOG-menot",
      text: L.julkinen_talous_velka,
    },
    {
      to: "/julkinen-talous#eu-vertailu",
      label: "EU-vertailu",
      title: "Suomen COFOG-profiili 12 maan rinnalla",
      text: L.eu_vertailu,
    },
    {
      to: "/vertailu",
      label: "Vuosivertailu",
      title: "2026 vs. 2027 momenttitasolla",
      text: L.vertailu_2026_2027,
    },
    {
      to: "/taulukko",
      label: "Taulukko",
      title: "Rivitasoinen talousarvio + XLSX-vienti",
      text: "Filtteröi vuoden 2026 talousarviorivit ja vertaa yksittäisten momenttien muutoksia suhteessa JTS 2027–2030 -kehystasoon.",
    },
    {
      to: "/tiivistelma",
      label: "Tiivistelmä",
      title: "Koko aineiston profiili",
      text: "Näet kuinka monta momenttia, pääluokkaa ja lukua sovelluksen nykyinen talousarviodata sisältää — kontekstina kehyslukujen lukemiseen.",
    },
  ];
  return (
    <>
      <div className="panel-meta" style={{ marginBottom: 14 }}>
        Kehysriihen luvut eivät ole irrallinen saareke — niitä voi vertailla sovelluksen muuhun
        dataan. Alla linkit relevantteihin näkymiin.
      </div>
      <div className="update-grid">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="update-card">
            <div className="update-card-date">
              <span className="update-card-tag">{c.label}</span>
            </div>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            <div className="update-card-meta">
              <span className="update-card-open">Avaa →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
