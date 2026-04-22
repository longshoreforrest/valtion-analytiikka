import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { query, getBuildMeta } from "../data/duckdb";
import { formatEur, formatDate } from "../data/format";
import DataAttribution from "../components/DataAttribution";
import { SOURCES } from "../data/sources";

interface ColumnInfo { column_name: string; data_type: string; count: number; nulls: number }
interface GroupCount { key: string; rows: number; eur: number | null }

export default function DataSummary() {
  const metaQ = useQuery({ queryKey: ["build_meta"], queryFn: getBuildMeta });
  const navigate = useNavigate();

  const countsQ = useQuery({
    queryKey: ["summary_counts"],
    queryFn: async () => {
      const [{ n }] = await query<{ n: number }>("SELECT COUNT(*)::BIGINT AS n FROM budget");
      const cols = await query<any>(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'budget'
      `);
      const totals = await query<{ eur: number }>(`SELECT SUM(maararaha_eur)::BIGINT AS eur FROM budget WHERE dokumentti = 'Hallituksen esitys'`);
      const byYear = await query<GroupCount>(`
        SELECT CAST(vuosi AS VARCHAR) AS key,
               COUNT(*)::BIGINT AS rows,
               SUM(CASE WHEN dokumentti = 'Hallituksen esitys' THEN maararaha_eur ELSE NULL END)::BIGINT AS eur
        FROM budget
        GROUP BY vuosi
        ORDER BY vuosi
      `);
      const byDoc = await query<GroupCount>(`
        SELECT dokumentti AS key, COUNT(*)::BIGINT AS rows, SUM(maararaha_eur)::BIGINT AS eur
        FROM budget
        GROUP BY dokumentti
        ORDER BY rows DESC
      `);
      const byPaaluokka = await query<GroupCount>(`
        SELECT CAST(paaluokka_num AS VARCHAR) || ' ' || paaluokka_nimi AS key,
               COUNT(*)::BIGINT AS rows,
               SUM(CASE WHEN dokumentti = 'Hallituksen esitys' THEN maararaha_eur ELSE NULL END)::BIGINT AS eur
        FROM budget
        GROUP BY paaluokka_num, paaluokka_nimi
        ORDER BY paaluokka_num
      `);
      const nullity = await query<ColumnInfo>(`
        SELECT 'maararaha_eur' AS column_name, 'INT64' AS data_type,
               COUNT(*)::BIGINT AS count,
               SUM(CASE WHEN maararaha_eur IS NULL THEN 1 ELSE 0 END)::BIGINT AS nulls
        FROM budget
        UNION ALL
        SELECT 'toteutuma_edellinen_eur', 'INT64', COUNT(*), SUM(CASE WHEN toteutuma_edellinen_eur IS NULL THEN 1 ELSE 0 END) FROM budget
        UNION ALL
        SELECT 'toteutuma_kaksi_vuotta_sitten_eur', 'INT64', COUNT(*), SUM(CASE WHEN toteutuma_kaksi_vuotta_sitten_eur IS NULL THEN 1 ELSE 0 END) FROM budget
        UNION ALL
        SELECT 'info', 'VARCHAR', COUNT(*), SUM(CASE WHEN info IS NULL OR info = '' THEN 1 ELSE 0 END) FROM budget
        UNION ALL
        SELECT 'aiemmin_budjetoitu_eur', 'INT64', COUNT(*), SUM(CASE WHEN aiemmin_budjetoitu_eur IS NULL THEN 1 ELSE 0 END) FROM budget
      `);
      const topMom = await query<any>(`
        SELECT paaluokka_nimi, luku_nimi, momentti_nimi, vuosi, maararaha_eur
        FROM budget
        WHERE dokumentti = 'Hallituksen esitys' AND maararaha_eur IS NOT NULL
        ORDER BY maararaha_eur DESC
        LIMIT 10
      `);
      const distincts = await query<any>(`
        SELECT
          COUNT(DISTINCT paaluokka_num)::BIGINT AS paaluokat,
          COUNT(DISTINCT paaluokka_num || '-' || luku_num)::BIGINT AS luvut,
          COUNT(DISTINCT paaluokka_num || '-' || luku_num || '-' || momentti_num)::BIGINT AS momentit
        FROM budget
      `);
      return {
        totalRows: Number(n),
        columns: cols,
        totalEur: totals[0]?.eur ?? 0,
        byYear,
        byDoc,
        byPaaluokka,
        nullity,
        topMom,
        distincts: distincts[0],
      };
    },
  });

  const charSize = useMemo(() => {
    if (!metaQ.data) return null;
    // raaka koko arvio build_meta.json:n pohjalta: lataa tiedoston koon selainpuolelta
    return null;
  }, [metaQ.data]);
  void charSize;

  if (countsQ.isLoading || !countsQ.data) {
    return (
      <>
        <h1>Aineistotiivistelmä</h1>
        <div className="loading">Lasketaan DuckDB-kyselyillä aineiston tilastoja…</div>
      </>
    );
  }

  const d = countsQ.data;
  const vuosiväli = d.byYear.length > 0 ? `${d.byYear[0].key}–${d.byYear[d.byYear.length - 1].key}` : "—";

  return (
    <>
      <h1>Aineistotiivistelmä</h1>
      <p className="lede">
        Yleiskuva siihen, mitä dataa sovellukseen on nyt kytketty. Kaikki luvut laskettu
        suoraan selaimessa DuckDB-Wasm:lla rekisteröidystä Parquet-tiedostosta.
      </p>

      <div className="grid cols-3">
        <div className="stat">
          <div className="label">Rivejä yhteensä</div>
          <div className="value">{d.totalRows.toLocaleString("fi-FI")}</div>
          <div className="sub">Yksittäisiä talousarvion momentteja</div>
        </div>
        <div className="stat">
          <div className="label">Sarakkeita</div>
          <div className="value">{d.columns.length}</div>
          <div className="sub">Parquetin tietomalli</div>
        </div>
        <div className="stat">
          <div className="label">Budjettivuosia</div>
          <div className="value">{d.byYear.length}</div>
          <div className="sub">{vuosiväli}</div>
        </div>
        <div className="stat">
          <div className="label">Hallinnonaloja</div>
          <div className="value">{d.distincts?.paaluokat ?? "—"}</div>
          <div className="sub">Pääluokkia datassa</div>
        </div>
        <div className="stat">
          <div className="label">Lukuja</div>
          <div className="value">{Number(d.distincts?.luvut ?? 0).toLocaleString("fi-FI")}</div>
          <div className="sub">Pääluokka × luku -uniikkeja</div>
        </div>
        <div className="stat">
          <div className="label">Momentteja (uniikki)</div>
          <div className="value">{Number(d.distincts?.momentit ?? 0).toLocaleString("fi-FI")}</div>
          <div className="sub">Pääluokka × luku × momentti</div>
        </div>
        <div className="stat">
          <div className="label">Dokumenttityyppejä</div>
          <div className="value">{d.byDoc.length}</div>
          <div className="sub">Esitys · VM · Eduskunta</div>
        </div>
        <div className="stat">
          <div className="label">Määrärahoja yhteensä (HE, kaikki vuodet)</div>
          <div className="value">{formatEur(Number(d.totalEur))}</div>
          <div className="sub">Hallituksen esitykset summattuna</div>
        </div>
        <div className="stat">
          <div className="label">Aineisto päivitetty</div>
          <div className="value" style={{ fontSize: 16, fontWeight: 500 }}>
            {metaQ.data ? formatDate(metaQ.data.generated_at) : "—"}
          </div>
          <div className="sub">
            {metaQ.data ? `${metaQ.data.sources_fetched.length} CSV · ${metaQ.data.missing.length} puuttui` : ""}
          </div>
        </div>
      </div>

      <h2>Sarakkeet</h2>
      <div className="panel">
        <table className="data">
          <thead>
            <tr>
              <th>Sarake</th>
              <th>Tyyppi</th>
              <th className="num">NULL-arvoja</th>
              <th className="num">NULL-osuus</th>
            </tr>
          </thead>
          <tbody>
            {d.columns.map((c: any) => {
              const nul = d.nullity.find((n) => n.column_name === c.column_name);
              const nulls = nul ? Number(nul.nulls) : null;
              const pct = nulls != null ? nulls / d.totalRows : null;
              return (
                <tr key={c.column_name}>
                  <td><code>{c.column_name}</code></td>
                  <td><code>{c.data_type}</code></td>
                  <td className="num">{nulls != null ? nulls.toLocaleString("fi-FI") : "—"}</td>
                  <td className="num">{pct != null ? (pct * 100).toFixed(1).replace(".", ",") + " %" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="panel-meta" style={{ marginTop: 8 }}>
          NULL-osuuden suuruus kertoo mitkä kentät on kattavasti täytetty (esim. <code>info</code> on pääosin tyhjä,
          <code>toteutuma_*</code> puuttuu uusilla vuosilla koska data tulee vasta vuoden lopussa).
        </div>
      </div>

      <h2>Rivit vuosittain</h2>
      <div className="panel">
        <table className="data">
          <thead>
            <tr>
              <th>Vuosi</th>
              <th className="num">Rivejä</th>
              <th className="num">Määräraha (HE)</th>
            </tr>
          </thead>
          <tbody>
            {d.byYear.map((y) => (
              <tr key={y.key}>
                <td>{y.key}</td>
                <td className="num">{Number(y.rows).toLocaleString("fi-FI")}</td>
                <td className="num">{y.eur != null ? formatEur(Number(y.eur)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Rivit dokumenttityypeittäin</h2>
      <div className="panel">
        <table className="data">
          <thead>
            <tr>
              <th>Dokumentti</th>
              <th className="num">Rivejä</th>
              <th className="num">Osuus</th>
              <th className="num">Summa (€)</th>
            </tr>
          </thead>
          <tbody>
            {d.byDoc.map((doc) => (
              <tr key={doc.key}>
                <td>{doc.key}</td>
                <td className="num">{Number(doc.rows).toLocaleString("fi-FI")}</td>
                <td className="num">{((Number(doc.rows) / d.totalRows) * 100).toFixed(1).replace(".", ",")} %</td>
                <td className="num">{doc.eur != null ? formatEur(Number(doc.eur)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Hallinnonalat — rivit ja suuruus</h2>
      <div className="panel">
        <table className="data">
          <thead>
            <tr>
              <th>Pääluokka</th>
              <th className="num">Rivejä</th>
              <th className="num">Määrärahat (HE, yhteensä)</th>
            </tr>
          </thead>
          <tbody>
            {d.byPaaluokka.map((p) => (
              <tr key={p.key}>
                <td>{p.key}</td>
                <td className="num">{Number(p.rows).toLocaleString("fi-FI")}</td>
                <td className="num">{p.eur != null ? formatEur(Number(p.eur)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>10 suurinta yksittäistä momenttia (HE, yli kaikki vuodet)</h2>
      <div className="panel">
        <table className="data">
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Pääluokka</th>
              <th>Luku</th>
              <th>Momentti</th>
              <th className="num">Määräraha</th>
            </tr>
          </thead>
          <tbody>
            {d.topMom.map((r: any, i: number) => (
              <tr key={i}>
                <td>{r.vuosi}</td>
                <td style={{ fontSize: 12.5 }}>{r.paaluokka_nimi}</td>
                <td style={{ fontSize: 12.5 }}>{r.luku_nimi}</td>
                <td style={{ fontSize: 12.5 }}>{r.momentti_nimi}</td>
                <td className="num">{formatEur(Number(r.maararaha_eur))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Liitettyjen lähteiden yhteenveto</h2>
      <div className="panel">
        <table className="data">
          <thead>
            <tr>
              <th>Lähde</th>
              <th>Tyyppi</th>
              <th>Status</th>
              <th>Lisenssi</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.id} className="clickable" onClick={() => navigate(`/lahteet#${s.id}`)}>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.nimi}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>{s.ylläpitäjä}</div>
                </td>
                <td><span className="chip">{s.tyyppi}</span></td>
                <td>
                  <span className={`badge ${s.status === "käytössä" ? "success" : s.status === "suunniteltu" ? "warn" : "muted"}`}>
                    {s.status}
                  </span>
                </td>
                <td style={{ fontSize: 12.5 }}>{s.lisenssi}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="panel-meta" style={{ marginTop: 8 }}>
          Klikkaa riviä siirtyäksesi lähteen täyteen kuvaukseen.
        </div>
      </div>

      <DataAttribution sourceId="vm-tae" detail="Kaikki tämän sivun luvut DuckDB-aggregoimaa" />
    </>
  );
}
