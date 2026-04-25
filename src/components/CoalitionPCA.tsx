import { useMemo } from "react";
import {
  pcaForParties,
  projectParties,
  componentTopLoadings,
} from "../data/coalition";
import { PARTIES } from "../data/parties";

interface Props {
  partyIds: string[];
}

/**
 * 2D-PCA-projektio puoluejoukolle. Akselit = kaksi suurinta varianssin
 * suuntaa, ja niiden tulkinta näytetään loadings-paneelina kuvan vieressä.
 */
export default function CoalitionPCA({ partyIds }: Props) {
  const partyMap = useMemo(() => {
    const m = new Map<string, (typeof PARTIES)[number]>();
    PARTIES.forEach((p) => m.set(p.id, p));
    return m;
  }, []);

  const ready = partyIds.length >= 3;

  const pca = useMemo(() => {
    if (!ready) return null;
    return pcaForParties(partyIds, 3);
  }, [partyIds, ready]);

  const points = useMemo(() => {
    if (!pca) return [];
    return projectParties(pca, partyIds);
  }, [pca, partyIds]);

  if (!ready || !pca) {
    return (
      <div className="coalition-empty">
        Valitse vähintään kolme puoluetta nähdäksesi PCA-projektion.
      </div>
    );
  }

  // SVG-rajat
  const w = 560;
  const h = 380;
  const padX = 40;
  const padY = 40;

  // Akselien rajat
  const xs = points.map((p) => p.coords[0]);
  const ys = points.map((p) => p.coords[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xPad = (xMax - xMin || 1) * 0.18;
  const yPad = (yMax - yMin || 1) * 0.18;
  const xLo = xMin - xPad;
  const xHi = xMax + xPad;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const sx = (v: number) =>
    padX + ((v - xLo) / (xHi - xLo || 1)) * (w - 2 * padX);
  const sy = (v: number) =>
    h - padY - ((v - yLo) / (yHi - yLo || 1)) * (h - 2 * padY);

  const pc1 = componentTopLoadings(pca.components[0], 3);
  const pc2 = componentTopLoadings(pca.components[1], 3);

  const pc1Label = pc1.positive[0]?.nimi ?? "Komponentti 1";
  const pc1NegLabel = pc1.negative[0]?.nimi ?? "";
  const pc2Label = pc2.positive[0]?.nimi ?? "Komponentti 2";
  const pc2NegLabel = pc2.negative[0]?.nimi ?? "";

  // Sijoita label-asiat välttäen päällekkäisyyttä
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  function pickLabelPos(cx: number, cy: number, label: string) {
    const lw = label.length * 6.4 + 4;
    const lh = 14;
    const candidates = [
      { dx: 9, dy: -4 },
      { dx: -lw - 9, dy: -4 },
      { dx: 9, dy: 12 },
      { dx: -lw - 9, dy: 12 },
    ];
    for (const c of candidates) {
      const x = cx + c.dx;
      const y = cy + c.dy;
      const overlap = placed.some(
        (p) =>
          x < p.x + p.w + 2 &&
          x + lw + 2 > p.x &&
          y < p.y + p.h + 2 &&
          y + lh + 2 > p.y
      );
      if (!overlap) {
        placed.push({ x, y, w: lw, h: lh });
        return c;
      }
    }
    placed.push({ x: cx + 9, y: cy - 4, w: lw, h: lh });
    return candidates[0];
  }

  return (
    <div className="coalition-pca">
      <div className="coalition-pca-canvas">
        <svg
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Puolueiden PCA-projektio"
        >
          <rect
            x={padX}
            y={padY}
            width={w - 2 * padX}
            height={h - 2 * padY}
            fill="#fafbff"
            stroke="#e8eaf0"
          />
          {/* Origo-viivat */}
          <line
            x1={sx(0)}
            y1={padY}
            x2={sx(0)}
            y2={h - padY}
            stroke="#dde2eb"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={sy(0)}
            x2={w - padX}
            y2={sy(0)}
            stroke="#dde2eb"
            strokeDasharray="3 3"
          />

          {/* Suunta-otsikot */}
          <text
            x={w - padX}
            y={sy(0) - 6}
            textAnchor="end"
            fontSize={10.5}
            fill="#5b6473"
            fontWeight={600}
          >
            → korkea {pc1Label}
          </text>
          <text
            x={padX}
            y={sy(0) - 6}
            textAnchor="start"
            fontSize={10.5}
            fill="#5b6473"
            fontWeight={600}
          >
            ← korkea {pc1NegLabel}
          </text>
          <text
            x={sx(0) + 6}
            y={padY + 12}
            fontSize={10.5}
            fill="#5b6473"
            fontWeight={600}
          >
            ↑ korkea {pc2Label}
          </text>
          <text
            x={sx(0) + 6}
            y={h - padY - 4}
            fontSize={10.5}
            fill="#5b6473"
            fontWeight={600}
          >
            ↓ korkea {pc2NegLabel}
          </text>

          {/* Pisteet */}
          {points.map((pt) => {
            const p = partyMap.get(pt.partyId);
            if (!p) return null;
            const cx = sx(pt.coords[0]);
            const cy = sy(pt.coords[1]);
            const r = 6 + Math.sqrt(p.paikat) * 1.4;
            const lp = pickLabelPos(cx, cy, p.lyhenne);
            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={p.vari}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={1.4}
                >
                  <title>
                    {`${p.nimi}\nPC1: ${pt.coords[0].toFixed(2)}\nPC2: ${pt.coords[1].toFixed(2)}`}
                  </title>
                </circle>
                <text
                  x={cx + lp.dx}
                  y={cy + lp.dy}
                  fontSize={11}
                  fontWeight={700}
                  fill="#0b1222"
                >
                  {p.lyhenne}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="coalition-pca-side">
        <h4>Akselit selitettynä</h4>
        <div className="pca-axis-card pca-axis-x">
          <div className="pca-axis-head">
            <span className="pca-axis-name">PC1 — vaaka-akseli</span>
            <span className="pca-axis-explained">
              {Math.round((pca.explained[0] ?? 0) * 100)} % varianssia
            </span>
          </div>
          <div className="pca-axis-loadings">
            <div>
              <strong>→ korkea</strong>
              <ul>
                {pc1.positive.map((l) => (
                  <li key={l.dimensionId}>
                    {l.nimi}{" "}
                    <span className="muted">({l.loading.toFixed(2)})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong>← korkea</strong>
              <ul>
                {pc1.negative.map((l) => (
                  <li key={l.dimensionId}>
                    {l.nimi}{" "}
                    <span className="muted">({l.loading.toFixed(2)})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="pca-axis-card pca-axis-y">
          <div className="pca-axis-head">
            <span className="pca-axis-name">PC2 — pystyakseli</span>
            <span className="pca-axis-explained">
              {Math.round((pca.explained[1] ?? 0) * 100)} % varianssia
            </span>
          </div>
          <div className="pca-axis-loadings">
            <div>
              <strong>↑ korkea</strong>
              <ul>
                {pc2.positive.map((l) => (
                  <li key={l.dimensionId}>
                    {l.nimi}{" "}
                    <span className="muted">({l.loading.toFixed(2)})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong>↓ korkea</strong>
              <ul>
                {pc2.negative.map((l) => (
                  <li key={l.dimensionId}>
                    {l.nimi}{" "}
                    <span className="muted">({l.loading.toFixed(2)})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <p className="pca-help">
          PCA tiivistää 12-dimensioisen arvomallin muutamaan eniten
          eroja tuottavaan suuntaan. Akselit lasketaan{" "}
          <b>juuri valitulle puoluejoukolle</b> — kun vaihdat valintaa,
          akselien tulkinta päivittyy.
        </p>
      </aside>
    </div>
  );
}
