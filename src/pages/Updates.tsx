import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearch } from "../data/search";
import { formatDate } from "../data/format";
import { IconPdf, IconMarkdown, IconExternal } from "../components/Icons";
import KehysriihiAnalytics from "../components/KehysriihiAnalytics";

/**
 * Päivityspaketti = yksi yhtenäinen katsaus johonkin ajankohtaiseen
 * tapahtumaan (esim. kehysriihi, budjettiesitys). Data tulee
 * public/updates/index.json (lista) ja public/updates/<slug>/index.json
 * (paketin sisältö). Paketit rakennetaan scripts/fetch_updates.py:llä.
 */

interface IndexListItem {
  slug: string;
  title: string;
  subtitle: string;
  event_date: string;
  published: string;
  category: string;
  pdf_count: number;
  link_count: number;
  highlights: string[];
}

interface IndexList {
  generated_at: string;
  count: number;
  updates: IndexListItem[];
}

interface PdfEntry {
  url: string;
  local_path: string;
  md_path: string;
  filename: string;
  title: string;
  published: string;
  source: string;
  size_kb: number;
}

interface LinkEntry {
  url: string;
  title: string;
  source: string;
  note: string;
}

interface UpdateMeta {
  slug: string;
  title: string;
  subtitle: string;
  event_date: string;
  published: string;
  category: string;
  highlights: string[];
  pdfs: PdfEntry[];
  links: LinkEntry[];
  summary_path: string;
  sources_path: string;
  generated_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  kehysriihi: "Kehysriihi",
  budjettiesitys: "Budjettiesitys",
  tilinpaatos: "Tilinpäätös",
  muu: "Muu",
};

export function UpdatesList() {
  const { matches, highlight } = useSearch();
  const indexQ = useQuery<IndexList | null>({
    queryKey: ["updates_index"],
    queryFn: async () => {
      const r = await fetch("/updates/index.json");
      if (!r.ok) return null;
      return await r.json();
    },
  });

  const filtered = useMemo(() => {
    const all = indexQ.data?.updates ?? [];
    return all.filter((u) =>
      matches(u.title, u.subtitle, u.category, ...u.highlights)
    );
  }, [indexQ.data, matches]);

  return (
    <>
      <div className="hero">
        <h1>Uusimmat päivitykset</h1>
        <p className="lede">
          Ajankohtaiset budjetti- ja talouspolitiikan tapahtumat yhtenäisenä
          kokoelmana: asiakirjat, tiivistelmät ja lähteet. Jokainen paketti
          sisältää PDF:t, niiden markdown-versiot ja linkit alkuperäisiin
          tiedotteisiin.
        </p>
      </div>

      {indexQ.isLoading ? (
        <div className="loading">Ladataan päivityksiä…</div>
      ) : !indexQ.data || indexQ.data.count === 0 ? (
        <div className="callout">
          Päivityspaketteja ei ole vielä kerätty. Aja{" "}
          <code>scripts/.venv/bin/python scripts/fetch_updates.py</code>
        </div>
      ) : (
        <>
          <div className="update-grid">
            {filtered.map((u) => (
              <Link key={u.slug} to={`/paivitykset/${u.slug}`} className="update-card">
                <div className="update-card-date">
                  <span className="update-card-tag">{CATEGORY_LABEL[u.category] ?? u.category}</span>
                  <span>{formatDate(u.event_date)}</span>
                </div>
                <h3>{highlight(u.title)}</h3>
                <p>{highlight(u.subtitle)}</p>
                {u.highlights.length > 0 ? (
                  <ul>
                    {u.highlights.map((h, i) => (
                      <li key={i}>{highlight(h)}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="update-card-meta">
                  <span>📄 {u.pdf_count} PDF</span>
                  <span>🔗 {u.link_count} linkkiä</span>
                  <span className="update-card-open">Avaa →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function UpdateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { highlight } = useSearch();
  const [pdfView, setPdfView] = useState<{ pdf: PdfEntry; mode: "pdf" | "md" } | null>(null);

  const metaQ = useQuery<UpdateMeta | null>({
    queryKey: ["update_meta", slug],
    queryFn: async () => {
      if (!slug) return null;
      const r = await fetch(`/updates/${slug}/index.json`);
      if (!r.ok) return null;
      return await r.json();
    },
    enabled: !!slug,
  });

  const summaryQ = useQuery<string | null>({
    queryKey: ["update_summary", slug],
    enabled: !!metaQ.data,
    queryFn: async () => {
      if (!metaQ.data) return null;
      const r = await fetch(metaQ.data.summary_path);
      if (!r.ok) return null;
      return await r.text();
    },
  });

  const sourcesQ = useQuery<string | null>({
    queryKey: ["update_sources", slug],
    enabled: !!metaQ.data,
    queryFn: async () => {
      if (!metaQ.data) return null;
      const r = await fetch(metaQ.data.sources_path);
      if (!r.ok) return null;
      return await r.text();
    },
  });

  const mdContentQ = useQuery<string | null>({
    queryKey: ["update_pdf_md", pdfView?.pdf.md_path],
    enabled: !!pdfView && pdfView.mode === "md",
    queryFn: async () => {
      if (!pdfView) return null;
      const r = await fetch(pdfView.pdf.md_path);
      if (!r.ok) return null;
      return await r.text();
    },
  });

  useEffect(() => { setPdfView(null); }, [slug]);

  if (metaQ.isLoading) return <div className="loading">Ladataan pakettia…</div>;
  if (!metaQ.data) return (
    <div className="callout">
      Pakettia ei löytynyt. <Link to="/paivitykset">Takaisin listaan</Link>
    </div>
  );

  const m = metaQ.data;

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Link to="/paivitykset" style={{ fontSize: 13, color: "var(--fg-dim)" }}>
          ← Päivitykset
        </Link>
      </div>

      <div className="hero">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
          <span className="chip" style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)", fontWeight: 600 }}>
            {CATEGORY_LABEL[m.category] ?? m.category}
          </span>
          <span style={{ color: "var(--fg-dim)", fontSize: 13 }}>
            Tapahtuma: {formatDate(m.event_date)}
          </span>
        </div>
        <h1>{highlight(m.title)}</h1>
        <p className="lede">{highlight(m.subtitle)}</p>
      </div>

      {m.category === "kehysriihi" ? (
        <KehysriihiAnalytics slug={m.slug} highlights={m.highlights} />
      ) : m.highlights.length > 0 ? (
        <div className="panel">
          <div className="panel-title">Avainkohdat</div>
          <ul className="clean" style={{ marginTop: 10 }}>
            {m.highlights.map((h, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{highlight(h)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="panel">
        <div className="panel-title">Tiivistelmä</div>
        {summaryQ.isLoading ? (
          <div className="loading">Ladataan…</div>
        ) : summaryQ.data ? (
          <div className="md-view" style={{ padding: 0, maxHeight: "none" }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryQ.data}</ReactMarkdown>
          </div>
        ) : null}
      </div>

      <div className="panel">
        <div className="panel-title">Ladatut asiakirjat ({m.pdfs.length})</div>
        {m.pdfs.length === 0 ? (
          <div className="panel-meta">Ei suoraan ladattuja PDF:iä tässä paketissa.</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Asiakirja</th>
                <th className="hide-mobile">Julkaistu</th>
                <th className="num hide-mobile">Koko</th>
                <th>Avaa</th>
              </tr>
            </thead>
            <tbody>
              {m.pdfs.map((p) => (
                <tr key={p.filename}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.title}</div>
                    <div style={{ color: "var(--fg-dim)", fontSize: 12, marginTop: 2 }}>
                      {p.source} · <a href={p.url} target="_blank" rel="noreferrer">alkuperäinen</a>
                    </div>
                  </td>
                  <td className="hide-mobile" style={{ fontSize: 12.5, color: "var(--fg-dim)" }}>{p.published}</td>
                  <td className="num hide-mobile">{(p.size_kb / 1024).toFixed(2)} MB</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="icon-btn" onClick={() => setPdfView({ pdf: p, mode: "pdf" })}>
                        <IconPdf size={14} /> PDF
                      </button>
                      <button className="icon-btn" onClick={() => setPdfView({ pdf: p, mode: "md" })}>
                        <IconMarkdown size={14} /> MD
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pdfView ? (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div className="panel-title">{pdfView.pdf.title}</div>
              <div className="panel-meta">
                {pdfView.mode === "pdf" ? "PDF-näkymä" : "Markdown-versio"} · {pdfView.pdf.source}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div className="view-switch">
                <button className={pdfView.mode === "pdf" ? "active" : ""} onClick={() => setPdfView({ ...pdfView, mode: "pdf" })}>
                  <IconPdf size={14} /> PDF
                </button>
                <button className={pdfView.mode === "md" ? "active" : ""} onClick={() => setPdfView({ ...pdfView, mode: "md" })}>
                  <IconMarkdown size={14} /> MD
                </button>
              </div>
              <a href={pdfView.pdf.url} target="_blank" rel="noreferrer">
                <button className="icon-btn"><IconExternal /> Alkuperäinen</button>
              </a>
              <button className="icon-btn ghost" onClick={() => setPdfView(null)}>Sulje</button>
            </div>
          </div>
          {pdfView.mode === "pdf" ? (
            <iframe
              src={pdfView.pdf.local_path}
              title={pdfView.pdf.title}
              style={{ width: "100%", height: "80vh", border: "1px solid var(--border)", borderRadius: 10, marginTop: 14, background: "#fff" }}
            />
          ) : (
            <div className="md-view" style={{ marginTop: 14, maxHeight: "80vh", overflowY: "auto" }}>
              {mdContentQ.isLoading ? (
                <div className="loading">Ladataan markdownia…</div>
              ) : mdContentQ.data ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdContentQ.data}</ReactMarkdown>
              ) : (
                <div className="loading">Markdown-versio ei saatavilla.</div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <div className="panel">
        <div className="panel-title">Linkit alkuperäisiin tiedotteisiin</div>
        <ul className="clean" style={{ marginTop: 10 }}>
          {m.links.map((l, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <a href={l.url} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
                {l.title}
              </a>
              <span style={{ color: "var(--fg-dim)", fontSize: 12.5 }}>
                {" "}— {l.source}
                {l.note ? ` · ${l.note}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="panel-title">Lähdeviitteet</div>
        {sourcesQ.data ? (
          <div className="md-view" style={{ padding: 0, maxHeight: "none" }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{sourcesQ.data}</ReactMarkdown>
          </div>
        ) : null}
      </div>

    </>
  );
}
