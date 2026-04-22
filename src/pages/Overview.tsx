import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBuildMeta, query } from "../data/duckdb";
import { formatEur, formatDate } from "../data/format";
import DrilldownTreemap, { TreemapCell } from "../components/DrilldownTreemap";
import TimeSeriesChart, { TimePoint } from "../components/TimeSeriesChart";
import Breadcrumb, { Crumb } from "../components/Breadcrumb";
import DataAttribution from "../components/DataAttribution";
import HierarchyMiniMap, { HierarchyLevel } from "../components/HierarchyMiniMap";
import { useSearch } from "../data/search";

/**
 * Drilldown-polku kuvaa mille tasolle käyttäjä on porautunut.
 * Tyhjä polku = pääluokkataso. paaluokka_num = luku-taso. +luku_num = momentti-taso.
 * +momentti_num = yksittäisen momentin detaljinäkymä (aikasarja).
 */
interface Path {
  paaluokka_num?: number;
  paaluokka_nimi?: string;
  luku_num?: string;
  luku_nimi?: string;
  momentti_num?: string;
  momentti_nimi?: string;
}

interface Totals { vuosi: number; yhteensa_eur: number; momentteja: number }

export default function Overview() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [path, setPath] = useState<Path>({});
  const { matches, highlight } = useSearch();

  const metaQ = useQuery({ queryKey: ["build_meta"], queryFn: () => getBuildMeta() });

  const totalsQ = useQuery({
    queryKey: ["totals"],
    queryFn: () => query<Totals>(`
      SELECT vuosi,
             SUM(maararaha_eur)::BIGINT AS yhteensa_eur,
             COUNT(*)::BIGINT AS momentteja
      FROM budget
      WHERE dokumentti = 'Hallituksen esitys'
      GROUP BY vuosi
      ORDER BY vuosi
    `),
  });

  const activeYear = selectedYear ?? (totalsQ.data?.length ? totalsQ.data[totalsQ.data.length - 1].vuosi : null);
  const level: "paaluokka" | "luku" | "momentti" | "detalji" =
    path.momentti_num ? "detalji" :
    path.luku_num ? "momentti" :
    path.paaluokka_num ? "luku" : "paaluokka";

  // Kaikki pääluokat pysyvät aina saatavilla minikarttaa varten
  const allPaaluokatQ = useQuery({
    queryKey: ["all_paaluokat", activeYear],
    enabled: activeYear != null,
    queryFn: () =>
      query<{ paaluokka_num: number; paaluokka_nimi: string; yhteensa: number }>(`
        SELECT paaluokka_num, paaluokka_nimi, SUM(maararaha_eur)::BIGINT AS yhteensa
        FROM budget
        WHERE vuosi = ${activeYear} AND dokumentti = 'Hallituksen esitys'
        GROUP BY paaluokka_num, paaluokka_nimi
        ORDER BY paaluokka_num
      `),
  });

  const lukuMiniQ = useQuery({
    queryKey: ["luku_mini", activeYear, path.paaluokka_num],
    enabled: activeYear != null && path.paaluokka_num != null,
    queryFn: () =>
      query<{ luku_num: string; luku_nimi: string; yhteensa: number }>(`
        SELECT luku_num, luku_nimi, SUM(maararaha_eur)::BIGINT AS yhteensa
        FROM budget
        WHERE vuosi = ${activeYear} AND dokumentti = 'Hallituksen esitys'
          AND paaluokka_num = ${path.paaluokka_num}
        GROUP BY luku_num, luku_nimi
        ORDER BY luku_num
      `),
  });

  const momMiniQ = useQuery({
    queryKey: ["mom_mini", activeYear, path.paaluokka_num, path.luku_num],
    enabled: activeYear != null && path.paaluokka_num != null && !!path.luku_num,
    queryFn: () =>
      query<{ momentti_num: string; momentti_nimi: string; maararaha: number }>(`
        SELECT momentti_num, momentti_nimi, maararaha_eur AS maararaha
        FROM budget
        WHERE vuosi = ${activeYear} AND dokumentti = 'Hallituksen esitys'
          AND paaluokka_num = ${path.paaluokka_num}
          AND luku_num = '${path.luku_num}'
          AND maararaha_eur > 0
        ORDER BY momentti_num
      `),
  });

  const cellsQ = useQuery({
    queryKey: ["cells", activeYear, level, path.paaluokka_num, path.luku_num],
    enabled: activeYear != null && level !== "detalji",
    queryFn: async (): Promise<TreemapCell[]> => {
      if (level === "paaluokka") {
        const rs = await query<{ paaluokka_num: number; paaluokka_nimi: string; yhteensa_eur: number; momentteja: number }>(`
          SELECT paaluokka_num, paaluokka_nimi,
                 SUM(maararaha_eur)::BIGINT AS yhteensa_eur,
                 COUNT(*)::BIGINT AS momentteja
          FROM budget
          WHERE vuosi = ${activeYear} AND dokumentti = 'Hallituksen esitys'
            AND maararaha_eur > 0
          GROUP BY paaluokka_num, paaluokka_nimi
          ORDER BY yhteensa_eur DESC
        `);
        return rs.map((r) => ({
          id: `p${r.paaluokka_num}`,
          label: r.paaluokka_nimi,
          sublabel: `Pääluokka ${r.paaluokka_num} · ${r.momentteja} momenttia`,
          value: r.yhteensa_eur,
        }));
      }
      if (level === "luku") {
        const rs = await query<{ luku_num: string; luku_nimi: string; yhteensa_eur: number; momentteja: number }>(`
          SELECT luku_num, luku_nimi,
                 SUM(maararaha_eur)::BIGINT AS yhteensa_eur,
                 COUNT(*)::BIGINT AS momentteja
          FROM budget
          WHERE vuosi = ${activeYear} AND dokumentti = 'Hallituksen esitys'
            AND paaluokka_num = ${path.paaluokka_num}
            AND maararaha_eur > 0
          GROUP BY luku_num, luku_nimi
          ORDER BY yhteensa_eur DESC
        `);
        return rs.map((r) => ({
          id: `l${r.luku_num}`,
          label: r.luku_nimi,
          sublabel: `Luku ${r.luku_num} · ${r.momentteja} momenttia`,
          value: r.yhteensa_eur,
        }));
      }
      // level === 'momentti'
      const rs = await query<{ momentti_num: string; momentti_nimi: string; maararaha_eur: number }>(`
        SELECT momentti_num, momentti_nimi, maararaha_eur
        FROM budget
        WHERE vuosi = ${activeYear} AND dokumentti = 'Hallituksen esitys'
          AND paaluokka_num = ${path.paaluokka_num}
          AND luku_num = '${path.luku_num}'
          AND maararaha_eur > 0
      `);
      return rs.map((r) => ({
        id: `m${r.momentti_num}`,
        label: r.momentti_nimi,
        sublabel: `Momentti ${r.momentti_num}`,
        value: r.maararaha_eur,
      }));
    },
  });

  const detailQ = useQuery({
    queryKey: ["detail", path.paaluokka_num, path.luku_num, path.momentti_num],
    enabled: level === "detalji",
    queryFn: () => query<any>(`
      SELECT vuosi, dokumentti, maararaha_eur, aiemmin_budjetoitu_eur,
             toteutuma_edellinen_eur, toteutuma_kaksi_vuotta_sitten_eur, info
      FROM budget
      WHERE paaluokka_num = ${path.paaluokka_num}
        AND luku_num = '${path.luku_num}'
        AND momentti_num = '${path.momentti_num}'
      ORDER BY vuosi, dokumentti
    `),
  });

  const subtreeTimeSeriesQ = useQuery({
    queryKey: ["subts", path.paaluokka_num, path.luku_num],
    enabled: level !== "paaluokka" && level !== "detalji",
    queryFn: () => query<{ vuosi: number; yhteensa: number }>(`
      SELECT vuosi, SUM(maararaha_eur)::BIGINT AS yhteensa
      FROM budget
      WHERE dokumentti = 'Hallituksen esitys'
        AND paaluokka_num = ${path.paaluokka_num}
        ${path.luku_num ? `AND luku_num = '${path.luku_num}'` : ""}
      GROUP BY vuosi
      ORDER BY vuosi
    `),
  });

  const crumbs: Crumb[] = useMemo(() => {
    const cs: Crumb[] = [{ label: "Kaikki hallinnonalat", onClick: () => setPath({}) }];
    if (path.paaluokka_num != null) {
      cs.push({
        label: `${path.paaluokka_num} · ${path.paaluokka_nimi}`,
        onClick: () => setPath({ paaluokka_num: path.paaluokka_num, paaluokka_nimi: path.paaluokka_nimi }),
      });
    }
    if (path.luku_num) {
      cs.push({
        label: `Luku ${path.luku_num} · ${path.luku_nimi}`,
        onClick: () =>
          setPath({
            paaluokka_num: path.paaluokka_num,
            paaluokka_nimi: path.paaluokka_nimi,
            luku_num: path.luku_num,
            luku_nimi: path.luku_nimi,
          }),
      });
    }
    if (path.momentti_num) {
      cs.push({ label: `Momentti ${path.momentti_num} · ${path.momentti_nimi}` });
    }
    return cs;
  }, [path]);

  const onSelect = (cell: TreemapCell) => {
    if (level === "paaluokka") {
      const paa = Number(cell.id.slice(1));
      setPath({ paaluokka_num: paa, paaluokka_nimi: cell.label });
    } else if (level === "luku") {
      setPath({
        ...path,
        luku_num: cell.id.slice(1),
        luku_nimi: cell.label,
      });
    } else if (level === "momentti") {
      setPath({
        ...path,
        momentti_num: cell.id.slice(1),
        momentti_nimi: cell.label,
      });
    }
  };

  const visibleCells = useMemo(() => {
    return (cellsQ.data ?? []).filter((c) => matches(c.label, c.sublabel));
  }, [cellsQ.data, matches]);

  const headerTotal = useMemo(() => {
    return visibleCells.reduce((s, c) => s + c.value, 0);
  }, [visibleCells]);

  const hierarchyLevels = useMemo((): HierarchyLevel[] => {
    const levels: HierarchyLevel[] = [];
    const paaluokat = allPaaluokatQ.data ?? [];
    if (paaluokat.length) {
      levels.push({
        title: "Pääluokat",
        activeKey: path.paaluokka_num != null ? String(path.paaluokka_num) : undefined,
        cells: paaluokat.map((p) => ({
          key: String(p.paaluokka_num),
          label: p.paaluokka_nimi,
          value: p.yhteensa,
        })),
        onSelect: (key, label) => {
          setPath({ paaluokka_num: Number(key), paaluokka_nimi: label });
        },
      });
    }
    if (path.paaluokka_num != null) {
      const luvut = lukuMiniQ.data ?? [];
      levels.push({
        title: "Luvut",
        activeKey: path.luku_num,
        cells: luvut.map((l) => ({
          key: l.luku_num,
          label: `${l.luku_num} ${l.luku_nimi}`,
          value: l.yhteensa,
        })),
        onSelect: (key, label) => {
          setPath({
            paaluokka_num: path.paaluokka_num,
            paaluokka_nimi: path.paaluokka_nimi,
            luku_num: key,
            luku_nimi: label.replace(/^[A-Za-z0-9]+ /, ""),
          });
        },
      });
    }
    if (path.luku_num) {
      const momentit = momMiniQ.data ?? [];
      levels.push({
        title: "Momentit",
        activeKey: path.momentti_num,
        cells: momentit.map((m) => ({
          key: m.momentti_num,
          label: `${m.momentti_num} ${m.momentti_nimi}`,
          value: m.maararaha,
        })),
        onSelect: (key, label) => {
          setPath({
            paaluokka_num: path.paaluokka_num,
            paaluokka_nimi: path.paaluokka_nimi,
            luku_num: path.luku_num,
            luku_nimi: path.luku_nimi,
            momentti_num: key,
            momentti_nimi: label.replace(/^[A-Za-z0-9]+ /, ""),
          });
        },
      });
    }
    return levels;
  }, [allPaaluokatQ.data, lukuMiniQ.data, momMiniQ.data, path]);

  const totalAllPaaluokat = useMemo(
    () => (allPaaluokatQ.data ?? []).reduce((s, p) => s + Number(p.yhteensa), 0),
    [allPaaluokatQ.data]
  );

  const timeseries: TimePoint[] = useMemo(() => {
    if (level === "paaluokka") {
      return (totalsQ.data ?? []).map((t) => ({ vuosi: t.vuosi, arvo: t.yhteensa_eur, sarja: "Kaikki" }));
    }
    return (subtreeTimeSeriesQ.data ?? []).map((t) => ({
      vuosi: t.vuosi,
      arvo: t.yhteensa,
      sarja: path.luku_nimi ?? path.paaluokka_nimi ?? "Valittu",
    }));
  }, [level, totalsQ.data, subtreeTimeSeriesQ.data, path]);

  const err = totalsQ.error ?? cellsQ.error ?? detailQ.error;

  return (
    <>
      <div className="hero">
        <h1>Yleiskuva</h1>
        <p className="lede">
          Porautuva näkymä Suomen valtion talousarvioon. Klikkaa treemap-laatikkoa tai
          taulukkoriviä mennäksesi syvemmälle: <b>hallinnonala → luku → momentti → aikasarja</b>.
          Käytä yläpalkin hakua rajataksesi näkyvää dataa. Kaikki luvut jäljitettävissä
          alkuperäisiin avoimen datan lähteisiin.
        </p>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <Link to="/julkinen-talous" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="label">Julkinen talous kokonaisuudessaan</div>
          <div className="value" style={{ fontSize: 16, fontWeight: 600 }}>Valtio + kunnat + ST</div>
          <div className="sub">StatFin: EDP-velka 1975→, COFOG 1990→, kvartaalit 1999→</div>
        </Link>
        <Link to="/vertailu" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="label">Vuosivertailu</div>
          <div className="value" style={{ fontSize: 16, fontWeight: 600 }}>Valitse 2+ vuotta</div>
          <div className="sub">Suurimmat erot pylväsgraafina, hajontakuvio, muutostaulukko →</div>
        </Link>
        <Link to="/taulukko" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="label">Taulukkonäkymä</div>
          <div className="value" style={{ fontSize: 16, fontWeight: 600 }}>Filtteröi ja lajittele</div>
          <div className="sub">Kaikki rivit chipeillä, minimisumma, lajittelu sarakkeittain →</div>
        </Link>
      </div>

      {err ? (
        <div className="error">
          Datan lataus epäonnistui: {(err as Error).message}. Tarkista että{" "}
          <code>public/data/budget.parquet</code> on ajettu (<code>npm run data</code>).
        </div>
      ) : null}

      <div className="toolbar">
        <label htmlFor="year">Budjettivuosi:</label>
        <select
          id="year"
          value={activeYear ?? ""}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {(totalsQ.data ?? []).map((t) => (
            <option key={t.vuosi} value={t.vuosi}>{t.vuosi}</option>
          ))}
        </select>
        {metaQ.data ? (
          <span className="badge">Aineisto päivitetty {formatDate(metaQ.data.generated_at)}</span>
        ) : null}
        {path.paaluokka_num != null ? (
          <button onClick={() => setPath({})}>← Takaisin yleiskuvaan</button>
        ) : null}
      </div>

      <Breadcrumb crumbs={crumbs} />

      {hierarchyLevels.length > 0 ? (
        <HierarchyMiniMap
          levels={hierarchyLevels}
          rootLabel={`Valtion talousarvio ${activeYear}`}
          rootValue={totalAllPaaluokat || undefined}
          onRootClick={() => setPath({})}
        />
      ) : null}

      {level !== "detalji" ? (
        <>
          <div className="grid cols-3">
            <div className="stat">
              <div className="label">Valittu yhteensä</div>
              <div className="value">{formatEur(headerTotal ?? null)}</div>
              <div className="sub">{levelLabel(level)}, vuosi {activeYear}</div>
            </div>
            <div className="stat">
              <div className="label">Laatikoita tässä näkymässä</div>
              <div className="value">{cellsQ.data?.length ?? "—"}</div>
              <div className="sub">Klikkaa porautuaksesi</div>
            </div>
            <div className="stat">
              <div className="label">Taso</div>
              <div className="value" style={{ fontSize: 16, fontWeight: 500 }}>{levelLabel(level)}</div>
              <div className="sub">Seuraava taso: {nextLevelLabel(level) ?? "detaljinäkymä"}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              Porautuva treemap — {levelLabel(level)}
            </div>
            <div className="panel-meta">
              Pinta-ala = määräraha. Klikkaa laatikkoa avataksesi sen sisällön.
            </div>
            {cellsQ.isLoading ? (
              <div className="loading">Ladataan DuckDB-kyselyä…</div>
            ) : visibleCells.length === 0 ? (
              <div className="loading">Ei tuloksia nykyisellä hakusanalla.</div>
            ) : (
              <DrilldownTreemap rows={visibleCells} onSelect={onSelect} />
            )}
            <DataAttribution sourceId="vm-tae" detail={`Talousarvio ${activeYear}`} />
          </div>

          {level !== "paaluokka" ? (
            <div className="panel">
              <div className="panel-title">Aikasarja — valittu kokonaisuus</div>
              <div className="panel-meta">
                Kaikkien valitun tason momenttien summa vuosittain. Hallituksen esityksen luvut.
              </div>
              <TimeSeriesChart data={timeseries} />
              <DataAttribution sourceId="vm-tae" detail="13 vuoden aikasarja" />
            </div>
          ) : (
            <div className="panel">
              <div className="panel-title">Kokonaismäärärahat vuosittain</div>
              <TimeSeriesChart data={timeseries} />
              <DataAttribution sourceId="vm-tae" detail="Kaikki hallinnonalat" />
            </div>
          )}

          <div className="panel">
            <div className="panel-title">Erät suuruusjärjestyksessä</div>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>{levelLabel(level)}</th>
                  <th className="num">Summa</th>
                  <th className="num">Osuus</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleCells.map((c, i) => {
                  const share = headerTotal && headerTotal > 0 ? c.value / headerTotal : 0;
                  return (
                    <tr key={c.id} className="clickable" onClick={() => onSelect(c)}>
                      <td>{i + 1}</td>
                      <td>
                        <div>{highlight(c.label)}</div>
                        {c.sublabel ? <div style={{ color: "var(--fg-dim)", fontSize: 12 }}>{highlight(c.sublabel)}</div> : null}
                      </td>
                      <td className="num">{formatEur(c.value)}</td>
                      <td className="num">{(share * 100).toFixed(1).replace(".", ",")} %</td>
                      <td>
                        <button className="ghost">Avaa →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <MomenttiDetalji path={path} rows={detailQ.data} loading={detailQ.isLoading} />
      )}
    </>
  );
}

function levelLabel(l: "paaluokka" | "luku" | "momentti" | "detalji"): string {
  switch (l) {
    case "paaluokka": return "Hallinnonalat";
    case "luku": return "Luvut";
    case "momentti": return "Momentit";
    case "detalji": return "Momentin yksityiskohdat";
  }
}

function nextLevelLabel(l: "paaluokka" | "luku" | "momentti" | "detalji"): string | null {
  if (l === "paaluokka") return "Luvut";
  if (l === "luku") return "Momentit";
  if (l === "momentti") return "Momentin aikasarja ja info";
  return null;
}

function MomenttiDetalji({ path, rows, loading }: { path: Path; rows: any[] | undefined; loading: boolean }) {
  if (loading) return <div className="loading">Ladataan momentin tietoja…</div>;
  if (!rows || !rows.length) return <div className="panel">Ei dataa tälle momentille.</div>;

  const byVuosi = new Map<number, any[]>();
  for (const r of rows) {
    if (!byVuosi.has(r.vuosi)) byVuosi.set(r.vuosi, []);
    byVuosi.get(r.vuosi)!.push(r);
  }

  const timeseries: TimePoint[] = [];
  for (const r of rows) {
    timeseries.push({ vuosi: r.vuosi, arvo: r.maararaha_eur, sarja: r.dokumentti });
  }

  const vuodet = Array.from(byVuosi.keys()).sort((a, b) => a - b);
  const latestInfo = rows.filter((r) => r.info).at(-1);

  return (
    <>
      <div className="panel">
        <div className="panel-title">{path.momentti_nimi}</div>
        <div className="panel-meta">
          {path.paaluokka_nimi} · Luku {path.luku_num} {path.luku_nimi} · Momentti {path.momentti_num}
        </div>
        <div className="grid cols-3" style={{ marginTop: 14 }}>
          <div className="stat">
            <div className="label">Viimeisin esitys</div>
            <div className="value">
              {formatEur(rows.filter((r) => r.dokumentti === "Hallituksen esitys").at(-1)?.maararaha_eur ?? null)}
            </div>
            <div className="sub">Hallituksen esitys, vuosi {vuodet.at(-1)}</div>
          </div>
          <div className="stat">
            <div className="label">Vuosien lukumäärä</div>
            <div className="value">{vuodet.length}</div>
            <div className="sub">Vuosivälillä {vuodet[0]}–{vuodet.at(-1)}</div>
          </div>
          <div className="stat">
            <div className="label">Dokumenttityyppejä</div>
            <div className="value">{new Set(rows.map((r) => r.dokumentti)).size}</div>
            <div className="sub">Esitys · VM:n ehdotus · Eduskunnan kirjelmä</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Määräraha aikasarjana — dokumenttityypeittäin</div>
        <div className="panel-meta">
          Vertaa hallituksen esitystä, valtiovarainministeriön ehdotusta ja eduskunnan kirjelmää.
          Eroavaisuudet kertovat siitä, miten esitys muuttui lainsäädäntöprosessin aikana.
        </div>
        <TimeSeriesChart data={timeseries} />
        <DataAttribution sourceId="vm-tae" detail={`Momentti ${path.momentti_num}, kaikki vuodet`} />
      </div>

      {latestInfo ? (
        <div className="panel">
          <div className="panel-title">Momentin info-osa (uusin)</div>
          <div className="panel-meta">Päätösosan lisätiedot alkuperäisestä talousarvioesityksestä.</div>
          <div style={{ whiteSpace: "pre-wrap", marginTop: 10, fontSize: 13 }}>{latestInfo.info}</div>
        </div>
      ) : null}

      <div className="panel">
        <div className="panel-title">Taulukko — kaikki dokumenttityypit × vuosi</div>
        <table className="data">
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Dokumentti</th>
              <th className="num">Määräraha</th>
              <th className="num">Aiemmin budjetoitu</th>
              <th className="num">Toteutuma t-1</th>
              <th className="num">Toteutuma t-2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.vuosi}</td>
                <td>{r.dokumentti}</td>
                <td className="num">{formatEur(r.maararaha_eur)}</td>
                <td className="num">{formatEur(r.aiemmin_budjetoitu_eur)}</td>
                <td className="num">{formatEur(r.toteutuma_edellinen_eur)}</td>
                <td className="num">{formatEur(r.toteutuma_kaksi_vuotta_sitten_eur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <DataAttribution sourceId="vm-tae" />
      </div>
    </>
  );
}
