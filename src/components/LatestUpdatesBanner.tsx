import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "../data/format";

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
  count: number;
  updates: IndexListItem[];
}

const CATEGORY_LABEL: Record<string, string> = {
  kehysriihi: "Kehysriihi",
  budjettiesitys: "Budjettiesitys",
  tilinpaatos: "Tilinpäätös",
  muu: "Muu",
};

/**
 * Etusivulla näytettävä kompakti banneri uusimmista päivityspaketeista.
 * Linkki yksittäiseen pakettiin jos vain yksi, muuten listanäkymään.
 */
export default function LatestUpdatesBanner() {
  const indexQ = useQuery<IndexList | null>({
    queryKey: ["updates_index"],
    queryFn: async () => {
      const r = await fetch("/updates/index.json");
      if (!r.ok) return null;
      return await r.json();
    },
  });

  if (!indexQ.data || indexQ.data.count === 0) return null;

  const latest = indexQ.data.updates[0];
  const target = indexQ.data.count === 1
    ? `/paivitykset/${latest.slug}`
    : "/paivitykset";

  return (
    <Link to={target} className="latest-updates-banner">
      <div className="lub-pulse" aria-hidden="true" />
      <div className="lub-body">
        <div className="lub-eyebrow">
          <span className="lub-tag">{CATEGORY_LABEL[latest.category] ?? latest.category}</span>
          <span className="lub-date">{formatDate(latest.event_date)}</span>
          <span className="lub-label">Uusin päivitys</span>
        </div>
        <div className="lub-title">{latest.title}</div>
        <div className="lub-sub">{latest.subtitle}</div>
        {latest.highlights.length > 0 ? (
          <div className="lub-highlights">
            {latest.highlights.slice(0, 2).map((h, i) => (
              <span key={i} className="lub-highlight">▸ {h}</span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="lub-arrow" aria-hidden="true">→</div>
    </Link>
  );
}
