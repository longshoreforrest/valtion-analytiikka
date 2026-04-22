import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SOURCES, DataSource } from "../data/sources";
import { getBuildMeta } from "../data/duckdb";
import { formatDate } from "../data/format";
import { useSearch } from "../data/search";

const TYPE_LABELS: Record<DataSource["tyyppi"], string> = {
  budjetti: "Budjetti",
  toteutuma: "Toteutuma",
  tilasto: "Tilasto",
  hankinnat: "Hankinnat",
  vertailu: "EU-vertailu",
  etuudet: "Etuudet",
};

const STATUS_CLASS: Record<DataSource["status"], string> = {
  käytössä: "success",
  suunniteltu: "warn",
  kokeellinen: "muted",
};

const TYPE_ORDER: DataSource["tyyppi"][] = ["budjetti", "toteutuma", "tilasto", "hankinnat", "vertailu", "etuudet"];

export default function Sources() {
  const metaQ = useQuery({ queryKey: ["build_meta"], queryFn: getBuildMeta });
  const { query, matches, highlight } = useSearch();
  const [openId, setOpenId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<DataSource["tyyppi"] | null>(null);
  const [statusFilter, setStatusFilter] = useState<DataSource["status"] | null>(null);

  const filtered = useMemo(() => {
    return SOURCES.filter((s) => {
      if (typeFilter && s.tyyppi !== typeFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return matches(s.nimi, s.ylläpitäjä, s.kuvaus, s.rajapinta, TYPE_LABELS[s.tyyppi]);
    });
  }, [typeFilter, statusFilter, matches]);

  return (
    <>
      <h1>Tietolähteet</h1>
      <p className="lede">
        Kaikki sovelluksen laskennat perustuvat alla listattuihin avoimen datan lähteisiin.
        Rivi on tiivis yhteenveto — avaa klikkaamalla. Jokainen visualisointi linkittää
        vastaavaan riviin ankkurilla (esim. <code>#vm-tae</code>).
      </p>

      {metaQ.data ? (
        <div className="callout">
          Nykyinen aineisto rakennettu {formatDate(metaQ.data.generated_at)}. Rivejä:{" "}
          <b>{metaQ.data.row_count.toLocaleString("fi-FI")}</b>. Vuodet:{" "}
          {metaQ.data.years.join(", ")}. Dokumenttityypit: {metaQ.data.doc_types.join(" · ")}.
        </div>
      ) : null}

      <div className="toolbar">
        <label>Tyyppi:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          <button className={typeFilter == null ? "on" : ""} onClick={() => setTypeFilter(null)}>Kaikki</button>
          {TYPE_ORDER.map((t) => (
            <button key={t} className={typeFilter === t ? "on" : ""} onClick={() => setTypeFilter(typeFilter === t ? null : t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 12, color: "var(--fg-dim)", fontSize: 12 }}>|</span>
        <label>Tila:</label>
        <div className="filter-chips" style={{ marginTop: 0 }}>
          {(["käytössä", "suunniteltu", "kokeellinen"] as const).map((s) => (
            <button key={s} className={statusFilter === s ? "on" : ""} onClick={() => setStatusFilter(statusFilter === s ? null : s)}>
              {s}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", color: "var(--fg-dim)", fontSize: 12 }}>
          {filtered.length} / {SOURCES.length} lähdettä
          {query ? <> · haku "<b>{query}</b>"</> : null}
        </span>
      </div>

      <div className="src-list">
        {filtered.map((s) => {
          const open = openId === s.id;
          return (
            <div key={s.id} id={s.id}>
              <div
                className={`src-row ${open ? "open" : ""}`}
                onClick={() => setOpenId(open ? null : s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenId(open ? null : s.id); }}
              >
                <div>
                  <div className="src-name">{highlight(s.nimi)}</div>
                  <div className="src-desc">{highlight(s.kuvaus)}</div>
                </div>
                <div className="src-type" style={{ color: "var(--fg-dim)", fontSize: 12 }}>{highlight(s.ylläpitäjä)}</div>
                <div className="src-type">
                  <span className="chip">{TYPE_LABELS[s.tyyppi]}</span>
                </div>
                <div className="src-license" style={{ color: "var(--fg-dim)", fontSize: 12 }}>{s.lisenssi}</div>
                <div style={{ textAlign: "right" }}>
                  <span className={`badge ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                </div>
              </div>
              {open ? (
                <div className="src-detail">
                  <dl className="kv">
                    <dt>URL</dt>
                    <dd><a href={s.url} target="_blank" rel="noreferrer">{s.url}</a></dd>
                    <dt>Ylläpitäjä</dt>
                    <dd>{s.ylläpitäjä}</dd>
                    <dt>Kuvaus</dt>
                    <dd>{s.kuvaus}</dd>
                    <dt>Formaatit</dt>
                    <dd>{s.formaatti.join(", ")}</dd>
                    <dt>Lisenssi</dt>
                    <dd>
                      {s.lisenssiUrl ? (
                        <a href={s.lisenssiUrl} target="_blank" rel="noreferrer">{s.lisenssi}</a>
                      ) : s.lisenssi}
                    </dd>
                    {s.rajapinta ? (
                      <>
                        <dt>Rajapinta</dt>
                        <dd><code>{s.rajapinta}</code></dd>
                      </>
                    ) : null}
                    <dt>Käyttökohteet</dt>
                    <dd>{s.käyttökohteet.join(" · ")}</dd>
                  </dl>

                  {s.status === "suunniteltu" && (s.toteutusEhdotus || s.tarvitsenSinulta) ? (
                    <div style={{
                      marginTop: 18,
                      padding: "14px 16px",
                      borderRadius: 8,
                      background: s.toteutettavuus === "itsenäinen" ? "#ecfdf5" : "#fffbeb",
                      border: `1px solid ${s.toteutettavuus === "itsenäinen" ? "#a7f3d0" : "#fde68a"}`,
                    }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: s.toteutettavuus === "itsenäinen" ? "#065f46" : "#92400e",
                        }}>
                          {s.toteutettavuus === "itsenäinen" ? "✓ Pystyn toteuttamaan itsenäisesti" :
                           s.toteutettavuus === "vaatii päätöksen" ? "⚠ Tarvitsen sinulta päätöksen" :
                           s.toteutettavuus === "vaatii tunnukset" ? "⚠ Tarvitsen tunnukset palveluun" :
                           "⚠ Vaatii lisäselvitystä"}
                        </span>
                        {s.työarvio ? (
                          <span className="chip" style={{ fontSize: 11 }}>{s.työarvio}</span>
                        ) : null}
                      </div>
                      <dl className="kv" style={{ gridTemplateColumns: "180px 1fr" }}>
                        {s.toteutusEhdotus ? (
                          <>
                            <dt>Toteutusehdotus</dt>
                            <dd style={{ color: "var(--fg)" }}>{s.toteutusEhdotus}</dd>
                          </>
                        ) : null}
                        {s.tarvitsenSinulta ? (
                          <>
                            <dt>Mitä tarvitsen sinulta</dt>
                            <dd style={{ color: "var(--fg)", fontWeight: s.toteutettavuus === "itsenäinen" ? 400 : 500 }}>
                              {s.tarvitsenSinulta}
                            </dd>
                          </>
                        ) : null}
                      </dl>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {metaQ.data ? (
        <>
          <h2>Ladatut tiedostot ({metaQ.data.sources_fetched.length})</h2>
          <details className="panel">
            <summary style={{ cursor: "pointer", fontWeight: 500 }}>
              Näytä lista — {metaQ.data.missing.length} tiedostoa puuttui
            </summary>
            <table className="data" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Vuosi</th>
                  <th>Dokumentti</th>
                  <th>Pääluokka</th>
                  <th className="num">Rivit</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                {metaQ.data.sources_fetched.map((f, i) => (
                  <tr key={i}>
                    <td>{f.year}</td>
                    <td>{f.doc}</td>
                    <td>{f.paaluokka}</td>
                    <td className="num">{f.rivit}</td>
                    <td><a href={f.url} target="_blank" rel="noreferrer">linkki</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : null}
    </>
  );
}
