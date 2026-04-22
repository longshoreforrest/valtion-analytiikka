import { Link } from "react-router-dom";
import { sourceById } from "../data/sources";

interface Props {
  sourceId: string;
  detail?: string;
}

/**
 * Lähdemerkintä visualisoinnin alle. Linkki vie /lahteet-sivulle samaan
 * anchoriin jotta käyttäjä näkee koko kuvan lähteestä.
 */
export default function DataAttribution({ sourceId, detail }: Props) {
  const s = sourceById(sourceId);
  if (!s) return null;
  return (
    <div className="source-tag">
      <span>Lähde:</span>
      <Link to={`/lahteet#${s.id}`}>{s.nimi}</Link>
      {detail ? <span>· {detail}</span> : null}
      <span>· lisenssi {s.lisenssi}</span>
    </div>
  );
}
