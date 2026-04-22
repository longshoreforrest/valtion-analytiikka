import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { query, getBuildMeta } from "../data/duckdb";
import { formatEur } from "../data/format";
import { useSearch } from "../data/search";
import DataAttribution from "../components/DataAttribution";
import ExportXlsxButton from "../components/ExportXlsxButton";

interface Row {
  vuosi: number;
  dokumentti: string;
  paaluokka_num: number;
  paaluokka_nimi: string;
  luku_num: string;
  luku_nimi: string;
  momentti_num: string;
  momentti_nimi: string;
  maararaha_eur: number | null;
  toteutuma_edellinen_eur: number | null;
}

type SortCol = "maararaha_eur" | "vuosi" | "paaluokka_nimi" | "momentti_nimi" | "toteutuma_edellinen_eur";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 200;

export default function TablePage() {
  const { query: search, matches, highlight } = useSearch();
  const metaQ = useQuery({ queryKey: ["build_meta"], queryFn: getBuildMeta });

  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set(["Hallituksen esitys"]));
  const [selectedPaaluokat, setSelectedPaaluokat] = useState<Set<number>>(new Set());
  const [minEur, setMinEur] = useState<string>("");
  const [sortCol, setSortCol] = useState<SortCol>("maararaha_eur");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const paaluokatQ = useQuery({
    queryKey: ["paaluokka_list"],
    queryFn: () => query<{ paaluokka_num: number; paaluokka_nimi: string }>(
      `SELECT DISTINCT paaluokka_num, paaluokka_nimi FROM budget ORDER BY paaluokka_num`
    ),
  });

  const rowsQ = useQuery({
    queryKey: ["table_rows", Array.from(selectedYears).sort(), Array.from(selectedDocs).sort(), Array.from(selectedPaaluokat).sort()],
    enabled: !!metaQ.data,
    queryFn: async () => {
      const conds: string[] = [];
      if (selectedYears.size > 0) {
        conds.push(`vuosi IN (${Array.from(selectedYears).join(",")})`);
      }
      if (selectedDocs.size > 0) {
        const docs = Array.from(selectedDocs).map((d) => `'${d.replace(/'/g, "''")}'`).join(",");
        conds.push(`dokumentti IN (${docs})`);
      }
      if (selectedPaaluokat.size > 0) {
        conds.push(`paaluokka_num IN (${Array.from(selectedPaaluokat).join(",")})`);
      }
      const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      return query<Row>(`
        SELECT vuosi, dokumentti, paaluokka_num, paaluokka_nimi,
               luku_num, luku_nimi, momentti_num, momentti_nimi,
               maararaha_eur, toteutuma_edellinen_eur
        FROM budget
        ${where}
      `);
    },
  });

  const filtered = useMemo(() => {
    const min = minEur ? Number(minEur.replace(/[^\d]/g, "")) : null;
    const rows = (rowsQ.data ?? []).filter((r) => {
      if (min != null && (r.maararaha_eur ?? 0) < min) return false;
      if (!matches(r.paaluokka_nimi, r.luku_nimi, r.momentti_nimi, r.momentti_num, r.luku_num, r.dokumentti))
        return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = (a as any)[sortCol];
      const bv = (b as any)[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "fi") * dir;
    });
    return rows;
  }, [rowsQ.data, matches, minEur, sortCol, sortDir]);

  const totalSum = useMemo(
    () => filtered.reduce((s, r) => s + (r.maararaha_eur ?? 0), 0),
    [filtered]
  );

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggle = <T,>(set: Set<T>, item: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setter(next);
    setPage(0);
  };

  const years = metaQ.data?.years ?? [];
  const docs = metaQ.data?.doc_types ?? [];
  const paaluokat = paaluokatQ.data ?? [];

  const sortHeader = (col: SortCol, label: string, align: "left" | "right" = "left") => (
    <th
      className="sortable"
      style={{ textAlign: align }}
      onClick={() => {
        if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("desc"); }
      }}
    >
      {label} {sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <>
      <h1>Taulukko</h1>
      <p className="lede">
        Rivitason näkymä koko aineistoon. Yhdistä vuosia, dokumenttityyppejä ja
        hallinnonaloja. Ylhäällä oleva avoin hakukenttä suodattaa tämänkin näkymän
        — hakusana osuu pääluokan, luvun, momentin ja dokumentin nimiin.
      </p>

      <div className="panel">
        <div className="panel-title">Suodattimet</div>

        <h3>Vuosi</h3>
        <div className="filter-chips">
          <button className={selectedYears.size === 0 ? "on" : ""} onClick={() => { setSelectedYears(new Set()); setPage(0); }}>
            Kaikki
          </button>
          {years.map((y) => (
            <button key={y} className={selectedYears.has(y) ? "on" : ""} onClick={() => toggle(selectedYears, y, setSelectedYears)}>
              {y}
            </button>
          ))}
        </div>

        <h3>Dokumenttityyppi</h3>
        <div className="filter-chips">
          {docs.map((d) => (
            <button key={d} className={selectedDocs.has(d) ? "on" : ""} onClick={() => toggle(selectedDocs, d, setSelectedDocs)}>
              {d}
            </button>
          ))}
        </div>

        <h3>Pääluokka</h3>
        <div className="filter-chips">
          <button className={selectedPaaluokat.size === 0 ? "on" : ""} onClick={() => { setSelectedPaaluokat(new Set()); setPage(0); }}>
            Kaikki
          </button>
          {paaluokat.map((p) => (
            <button
              key={p.paaluokka_num}
              className={selectedPaaluokat.has(p.paaluokka_num) ? "on" : ""}
              onClick={() => toggle(selectedPaaluokat, p.paaluokka_num, setSelectedPaaluokat)}
              title={p.paaluokka_nimi}
            >
              {p.paaluokka_num}
            </button>
          ))}
        </div>

        <h3>Minimimäärä (€)</h3>
        <input
          type="text"
          inputMode="numeric"
          placeholder="esim. 10000000"
          value={minEur}
          onChange={(e) => { setMinEur(e.target.value); setPage(0); }}
          style={{ width: 200 }}
        />
      </div>

      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="panel-title">
              Tulokset {filtered.length.toLocaleString("fi-FI")} riviä · yhteensä {formatEur(totalSum)}
            </div>
            <div className="panel-meta">
              Näytetään sivu {page + 1} / {pageCount} (200 riviä/sivu).
              {search ? <> Haku: "<b>{search}</b>"</> : null}
            </div>
          </div>
          <ExportXlsxButton
            rows={filtered as unknown as Array<Record<string, unknown>>}
            filename={`valtion-budjetti-${new Date().toISOString().slice(0, 10)}.xlsx`}
            sheetName="Budjetti"
            columns={[
              { header: "Vuosi", key: "vuosi", width: 8 },
              { header: "Dokumentti", key: "dokumentti", width: 26 },
              { header: "Pääluokka", key: "paaluokka_num", width: 10 },
              { header: "Pääluokan nimi", key: "paaluokka_nimi", width: 42 },
              { header: "Luvun numero", key: "luku_num", width: 10 },
              { header: "Luvun nimi", key: "luku_nimi", width: 36 },
              { header: "Momentin numero", key: "momentti_num", width: 10 },
              { header: "Momentin nimi", key: "momentti_nimi", width: 56 },
              { header: "Määräraha (€)", key: "maararaha_eur", width: 16 },
              { header: "Toteutuma t-1 (€)", key: "toteutuma_edellinen_eur", width: 18 },
            ]}
          />
        </div>

        {rowsQ.isLoading ? (
          <div className="loading">Ladataan DuckDB-kyselyä…</div>
        ) : filtered.length === 0 ? (
          <div className="loading">Ei tuloksia. Kokeile laajentaa suodattimia tai tyhjentää haku.</div>
        ) : (
          <>
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table className="data">
                <thead>
                  <tr>
                    {sortHeader("vuosi", "Vuosi")}
                    <th>Dokumentti</th>
                    {sortHeader("paaluokka_nimi", "Pääluokka")}
                    <th>Luku</th>
                    {sortHeader("momentti_nimi", "Momentti")}
                    {sortHeader("maararaha_eur", "Määräraha", "right")}
                    {sortHeader("toteutuma_edellinen_eur", "Toteutuma t-1", "right")}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.vuosi}</td>
                      <td style={{ fontSize: 12, color: "var(--fg-dim)" }}>{r.dokumentti}</td>
                      <td>
                        <div style={{ fontSize: 12.5 }}>{highlight(r.paaluokka_nimi)}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{r.paaluokka_num}</div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>
                        <div>{highlight(r.luku_nimi)}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{r.luku_num}</div>
                      </td>
                      <td style={{ fontSize: 12.5 }}>
                        <div>{highlight(r.momentti_nimi)}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{r.momentti_num}</div>
                      </td>
                      <td className="num">{formatEur(r.maararaha_eur)}</td>
                      <td className="num">{formatEur(r.toteutuma_edellinen_eur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <div style={{ color: "var(--fg-dim)", fontSize: 12.5 }}>
                Rivit {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Edellinen</button>
                <span style={{ alignSelf: "center", fontSize: 12.5, color: "var(--fg-dim)" }}>Sivu {page + 1} / {pageCount}</span>
                <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                  Seuraava →
                </button>
              </div>
            </div>
          </>
        )}

        <DataAttribution sourceId="vm-tae" detail="Rivitason näkymä koko aineistoon" />
      </div>
    </>
  );
}
