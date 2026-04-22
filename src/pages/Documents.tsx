import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearch } from "../data/search";
import { formatDate } from "../data/format";
import { IconPdf, IconMarkdown, IconExternal, IconClose } from "../components/Icons";

interface PdfItem {
  tag: string;
  tagLabel: string;
  title: string;
  year: number | null;
  issued: string;
  organization: string;
  abstract: string;
  filename: string;
  local_path: string;
  size_kb: number;
  valto_item_url: string;
  valto_download_url: string;
  md_path?: string;
  text_length?: number;
  text_excerpt?: string;
}

interface PdfIndex {
  generated_at: string;
  count: number;
  total_kb: number;
  source: string;
  license: string;
  items: PdfItem[];
}

type ViewMode = "pdf" | "md";

const TAG_ORDER = ["budjettikatsaus", "jts", "talousarvioehdotus", "taloudellinen_katsaus", "tilinpaatos"];
const TAG_LABEL: Record<string, string> = {
  budjettikatsaus: "Budjettikatsaus",
  jts: "Julkisen talouden suunnitelma",
  talousarvioehdotus: "Talousarvioehdotus",
  taloudellinen_katsaus: "Taloudellinen katsaus",
  tilinpaatos: "Valtion tilinpäätös",
};

export default function Documents() {
  const { query: searchQ, matches, highlight } = useSearch();
  const [selected, setSelected] = useState<PdfItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("pdf");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const indexQ = useQuery<PdfIndex | null>({
    queryKey: ["pdf_index"],
    queryFn: async () => {
      const r = await fetch("/pdfs/index.json");
      if (!r.ok) return null;
      return (await r.json()) as PdfIndex;
    },
  });

  // Haku osuu otsikkoon, tiivistelmään ja MD-excerptiin (~8000 merkkiä/julkaisu)
  const filtered = useMemo(() => {
    const all = indexQ.data?.items ?? [];
    return all.filter((it) => {
      if (tagFilter && it.tag !== tagFilter) return false;
      return matches(
        it.title,
        it.abstract,
        it.organization,
        String(it.year ?? ""),
        TAG_LABEL[it.tag],
        it.text_excerpt
      );
    });
  }, [indexQ.data, tagFilter, matches]);

  const byYear = useMemo(() => {
    const m = new Map<number, PdfItem[]>();
    for (const it of filtered) {
      const y = it.year ?? 0;
      if (!m.has(y)) m.set(y, []);
      m.get(y)!.push(it);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  useEffect(() => {
    if (selected && !filtered.find((f) => f.filename === selected.filename)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  const tagCounts = useMemo(() => {
    const all = indexQ.data?.items ?? [];
    const counts: Record<string, number> = {};
    for (const it of all) counts[it.tag] = (counts[it.tag] ?? 0) + 1;
    return counts;
  }, [indexQ.data]);

  // Lataa MD-sisällön lazy-muotoisesti valitulle dokumentille
  const mdQ = useQuery<string | null>({
    queryKey: ["md_content", selected?.md_path],
    enabled: !!selected?.md_path && viewMode === "md",
    queryFn: async () => {
      if (!selected?.md_path) return null;
      const r = await fetch(selected.md_path);
      if (!r.ok) return null;
      return await r.text();
    },
  });

  const hasSearchHit = (it: PdfItem): boolean => {
    if (!searchQ.trim()) return false;
    const q = searchQ.toLowerCase();
    return (it.text_excerpt ?? "").toLowerCase().includes(q);
  };

  const firstMatch = (text: string | undefined, q: string): string | null => {
    if (!text || !q.trim()) return null;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx < 0) return null;
    const start = Math.max(0, idx - 80);
    const end = Math.min(text.length, idx + q.length + 140);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  };

  return (
    <>
      <h1>Dokumentit</h1>
      <p className="lede">
        Valtiovarainministeriön ja valtioneuvoston viralliset talousarvio-julkaisut
        PDF-muodossa. Avautuvat sovelluksen sisällä. Kaikille julkaisuille on tuotettu
        myös <b>markdown-versio</b>, jota käytetään hakuun — kirjoitettu sana löytyy
        vaikka se olisi julkaisun sivulla 47.
      </p>

      {indexQ.isLoading ? (
        <div className="loading">Ladataan PDF-indeksiä…</div>
      ) : !indexQ.data || indexQ.data.count === 0 ? (
        <div className="callout">
          PDF-kirjastoa ei ole vielä rakennettu. Aja:{" "}
          <code>scripts/.venv/bin/python scripts/fetch_pdfs.py</code> ja{" "}
          <code>scripts/.venv/bin/python scripts/extract_pdfs_to_md.py</code>
        </div>
      ) : (
        <>
          <div className="callout">
            <b>{indexQ.data.count}</b> julkaisua · yhteensä{" "}
            {(indexQ.data.total_kb / 1024).toFixed(1)} MB · päivitetty{" "}
            {formatDate(indexQ.data.generated_at)} · Lähde:{" "}
            <a href="https://julkaisut.valtioneuvosto.fi/home" target="_blank" rel="noreferrer">
              Valto-julkaisuarkisto
            </a>
          </div>

          <div className="toolbar">
            <label>Tyyppi:</label>
            <div className="filter-chips" style={{ marginTop: 0 }}>
              <button className={tagFilter == null ? "on" : ""} onClick={() => setTagFilter(null)}>
                Kaikki ({indexQ.data.count})
              </button>
              {TAG_ORDER.filter((t) => tagCounts[t]).map((t) => (
                <button
                  key={t}
                  className={tagFilter === t ? "on" : ""}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                >
                  {TAG_LABEL[t]} ({tagCounts[t]})
                </button>
              ))}
            </div>
            <span style={{ marginLeft: "auto", color: "var(--fg-dim)", fontSize: 12 }}>
              {filtered.length} näkyvissä{searchQ ? <> · haku "<b>{searchQ}</b>"</> : null}
            </span>
          </div>

          {selected ? (
            <div className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div className="panel-title">{selected.title}</div>
                  <div className="panel-meta">
                    <span className="chip">{TAG_LABEL[selected.tag]}</span>{" "}
                    {selected.year} · {selected.organization} ·{" "}
                    {(selected.size_kb / 1024).toFixed(1)} MB
                    {selected.text_length ? ` · ${Math.round(selected.text_length / 1000)}k merkkiä tekstiä` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div className="view-switch" role="tablist">
                    <button
                      className={viewMode === "pdf" ? "active" : ""}
                      onClick={() => setViewMode("pdf")}
                    >
                      <IconPdf size={14} /> PDF
                    </button>
                    <button
                      className={viewMode === "md" ? "active" : ""}
                      onClick={() => setViewMode("md")}
                      disabled={!selected.md_path}
                    >
                      <IconMarkdown size={14} /> Markdown
                    </button>
                  </div>
                  <a href={selected.local_path} target="_blank" rel="noreferrer">
                    <button className="icon-btn">
                      <IconExternal /> Uudessa välilehdessä
                    </button>
                  </a>
                  <a href={selected.valto_item_url} target="_blank" rel="noreferrer">
                    <button className="icon-btn ghost">
                      <IconExternal /> Valto
                    </button>
                  </a>
                  <button className="icon-btn ghost" onClick={() => setSelected(null)} aria-label="Sulje">
                    <IconClose /> Sulje
                  </button>
                </div>
              </div>

              {selected.abstract ? (
                <div style={{
                  marginTop: 14,
                  padding: "12px 16px",
                  background: "var(--grad-subtle)",
                  borderRadius: 10,
                  fontSize: 13.5,
                  color: "var(--fg)",
                  lineHeight: 1.6,
                }}>
                  <b style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--fg-dim)" }}>
                    Tiivistelmä
                  </b>
                  <div style={{ marginTop: 6 }}>{selected.abstract}</div>
                </div>
              ) : null}

              {viewMode === "pdf" ? (
                <iframe
                  src={selected.local_path}
                  title={selected.title}
                  style={{
                    width: "100%",
                    height: "82vh",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    marginTop: 14,
                    background: "#fff",
                  }}
                />
              ) : (
                <div
                  className="md-view"
                  style={{
                    marginTop: 14,
                    padding: "28px 36px",
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    maxHeight: "82vh",
                    overflowY: "auto",
                  }}
                >
                  {mdQ.isLoading ? (
                    <div className="loading">Puretaan markdown…</div>
                  ) : mdQ.data ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdQ.data}</ReactMarkdown>
                  ) : (
                    <div className="loading">Markdown-versiota ei ole saatavilla.</div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {byYear.map(([year, items]) => (
            <div key={year} className="panel">
              <div className="panel-title">{year || "Vuotta ei tiedossa"}</div>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>Tyyppi</th>
                    <th>Julkaisu</th>
                    <th className="num">Koko</th>
                    <th>Julkaistu</th>
                    <th style={{ width: 190 }}>Avaa</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const hit = hasSearchHit(it);
                    const snippet = hit ? firstMatch(it.text_excerpt, searchQ) : null;
                    return (
                      <tr key={it.filename}>
                        <td>
                          <span className="chip">{TAG_LABEL[it.tag]}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
                               onClick={() => { setSelected(it); setViewMode("pdf"); }}>
                            {highlight(it.title)}
                          </div>
                          {it.abstract ? (
                            <div style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 3, lineHeight: 1.45 }}>
                              {highlight(it.abstract.slice(0, 180) + (it.abstract.length > 180 ? "…" : ""))}
                            </div>
                          ) : null}
                          {snippet ? (
                            <div style={{ color: "var(--fg)", fontSize: 12, marginTop: 6, padding: "6px 10px", background: "#fef9c3", borderRadius: 6, lineHeight: 1.5 }}>
                              <b style={{ fontSize: 10, color: "#854d0e", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                ⌕ Osuma tekstistä:
                              </b>{" "}
                              {highlight(snippet)}
                            </div>
                          ) : null}
                        </td>
                        <td className="num">{(it.size_kb / 1024).toFixed(1)} MB</td>
                        <td style={{ fontSize: 12.5, color: "var(--fg-dim)" }}>{it.issued}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="icon-btn"
                              onClick={() => { setSelected(it); setViewMode("pdf"); }}
                              title="Avaa PDF"
                            >
                              <IconPdf size={14} /> PDF
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => { setSelected(it); setViewMode("md"); }}
                              disabled={!it.md_path}
                              title="Avaa teksti"
                            >
                              <IconMarkdown size={14} /> MD
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </>
  );
}
