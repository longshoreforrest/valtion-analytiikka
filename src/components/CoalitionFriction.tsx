import { useMemo } from "react";
import { dimensionFrictions } from "../data/coalition";
import { PARTIES } from "../data/parties";

interface Props {
  partyIds: string[];
}

/**
 * "Missä kenkä puristaa" -näkymä: dimensiokohtainen hajonta valitulle
 * koalitiolle. Suurinta hajontaa korostetaan; pieniä punaisia palkkeja =
 * ristiveto, vihreitä = konsensus.
 */
export default function CoalitionFriction({ partyIds }: Props) {
  const partyMap = useMemo(() => {
    const m = new Map<string, (typeof PARTIES)[number]>();
    PARTIES.forEach((p) => m.set(p.id, p));
    return m;
  }, []);

  const frictions = useMemo(() => dimensionFrictions(partyIds), [partyIds]);

  if (partyIds.length === 0) {
    return (
      <div className="coalition-empty">
        Valitse ainakin yksi puolue nähdäksesi konsensus- ja ristivetoanalyysin.
      </div>
    );
  }

  // Hajonta-asteikko visuaaleille: 0…~3.5 (max teoriassa 5 jos arvot 0/10)
  const maxStd = Math.max(...frictions.map((f) => f.std), 1);

  // Värittäminen std:n mukaan: 0 = vihreä konsensus, korkea = oranssi/punainen
  function levelClass(std: number): string {
    const t = std / maxStd;
    if (t < 0.33) return "low";
    if (t < 0.66) return "mid";
    return "high";
  }

  const linePadX = 32;
  const lineW = 360;
  const sx = (v: number) => linePadX + (v / 10) * lineW;

  return (
    <div className="coalition-friction">
      <div className="friction-summary">
        <div className="friction-summary-stat">
          <span className="friction-stat-label">Suurin ristiveto</span>
          <span className="friction-stat-value">
            {frictions[0]?.nimi ?? "—"}{" "}
            <em>std {frictions[0]?.std.toFixed(2)}</em>
          </span>
        </div>
        <div className="friction-summary-stat">
          <span className="friction-stat-label">Vahvin konsensus</span>
          <span className="friction-stat-value">
            {frictions[frictions.length - 1]?.nimi ?? "—"}{" "}
            <em>std {frictions[frictions.length - 1]?.std.toFixed(2)}</em>
          </span>
        </div>
      </div>

      <ul className="friction-list">
        {frictions.map((f) => {
          const lvl = levelClass(f.std);
          return (
            <li key={f.dimensionId} className={`friction-row friction-${lvl}`}>
              <div className="friction-head">
                <div className="friction-title">
                  <span className={`friction-pill friction-pill-${lvl}`}>
                    {lvl === "high"
                      ? "Ristiveto"
                      : lvl === "mid"
                      ? "Eroavuus"
                      : "Konsensus"}
                  </span>
                  <b>{f.nimi}</b>
                </div>
                <div className="friction-stats">
                  <span title="Hajonta (std)">
                    σ <b>{f.std.toFixed(2)}</b>
                  </span>
                  <span title="Vaihteluväli min–max">
                    Δ <b>{f.range.toFixed(1)}</b>
                  </span>
                  <span title="Keskiarvo">
                    μ <b>{f.mean.toFixed(1)}</b>
                  </span>
                </div>
              </div>
              <svg
                width="100%"
                viewBox={`0 0 ${linePadX * 2 + lineW} 36`}
                className="friction-svg"
              >
                {/* Asteikko */}
                <line
                  x1={linePadX}
                  y1={20}
                  x2={linePadX + lineW}
                  y2={20}
                  stroke="#e2e6ee"
                  strokeWidth={1}
                />
                {[0, 5, 10].map((v) => (
                  <g key={v}>
                    <line
                      x1={sx(v)}
                      y1={16}
                      x2={sx(v)}
                      y2={24}
                      stroke="#cbd5e1"
                    />
                    <text
                      x={sx(v)}
                      y={34}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#9aa3b2"
                    >
                      {v}
                    </text>
                  </g>
                ))}
                {/* Vaihteluväli (kapea palkki min–max) */}
                <rect
                  x={sx(f.min.arvo)}
                  y={17}
                  width={Math.max(2, sx(f.max.arvo) - sx(f.min.arvo))}
                  height={6}
                  rx={3}
                  fill={
                    lvl === "high"
                      ? "#fee2e2"
                      : lvl === "mid"
                      ? "#fef3c7"
                      : "#dcfce7"
                  }
                />
                {/* Keskiarvon tikku */}
                <line
                  x1={sx(f.mean)}
                  y1={11}
                  x2={sx(f.mean)}
                  y2={29}
                  stroke="#0b1222"
                  strokeWidth={1.4}
                />
                {/* Pisteet */}
                {f.points.map((pt) => {
                  const p = partyMap.get(pt.partyId);
                  if (!p) return null;
                  return (
                    <g key={pt.partyId}>
                      <circle
                        cx={sx(pt.arvo)}
                        cy={20}
                        r={5.5}
                        fill={p.vari}
                        stroke="#fff"
                        strokeWidth={1.2}
                      >
                        <title>{`${p.lyhenne}: ${pt.arvo}/10`}</title>
                      </circle>
                      <text
                        x={sx(pt.arvo)}
                        y={9}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill={p.vari}
                      >
                        {p.lyhenne}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="friction-meta">
                Min:{" "}
                <b style={{ color: partyMap.get(f.min.partyId)?.vari }}>
                  {partyMap.get(f.min.partyId)?.lyhenne}
                </b>{" "}
                ({f.min.arvo}) · Max:{" "}
                <b style={{ color: partyMap.get(f.max.partyId)?.vari }}>
                  {partyMap.get(f.max.partyId)?.lyhenne}
                </b>{" "}
                ({f.max.arvo})
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
