import { useMemo, useState } from "react";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "../data/parties";

/**
 * 2D-projektio puolueista valittujen kahden ulottuvuuden kautta.
 * Käyttäjä voi vaihtaa akseleita pudotusvalikoista.
 *
 * Periaate: yksinkertainen suora projektio kahdelle dimensiolle, jolloin
 * lukutarkkuus säilyy (toisin kuin PCA:ssa, jossa akselit ovat
 * lineaarikombinaatioita ja vaikeammin tulkittavissa).
 */
export default function PartyMap2D() {
  const dimensions = VALUE_DIMENSIONS;
  const [xDim, setXDim] = useState("fiscal_tightness");
  const [yDim, setYDim] = useState("public_services");

  const data = useMemo(() => {
    return PARTIES.map((p) => {
      const x = PARTY_VALUES[p.id]?.[xDim]?.arvo ?? 5;
      const y = PARTY_VALUES[p.id]?.[yDim]?.arvo ?? 5;
      return { ...p, x, y };
    });
  }, [xDim, yDim]);

  const w = 580;
  const h = 460;
  const pad = 60;
  const sx = (v: number) => pad + (v / 10) * (w - 2 * pad);
  const sy = (v: number) => h - pad - (v / 10) * (h - 2 * pad);

  const xLabel = dimensions.find((d) => d.id === xDim)!;
  const yLabel = dimensions.find((d) => d.id === yDim)!;

  // Vältetään päällekkäiset etiketit yksinkertaisella jitteröinnillä
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  function pickLabelPos(cx: number, cy: number, label: string) {
    const lw = label.length * 6.4 + 6;
    const lh = 16;
    const candidates = [
      { dx: 10, dy: -6 },
      { dx: -lw - 10, dy: -6 },
      { dx: 10, dy: 12 },
      { dx: -lw - 10, dy: 12 },
      { dx: 10, dy: -22 },
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
    placed.push({ x: cx + 10, y: cy - 6, w: lw, h: lh });
    return candidates[0];
  }

  return (
    <div className="party-map2d">
      <div className="party-map2d-controls">
        <label>
          X-akseli
          <select value={xDim} onChange={(e) => setXDim(e.target.value)}>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nimi}
              </option>
            ))}
          </select>
        </label>
        <label>
          Y-akseli
          <select value={yDim} onChange={(e) => setYDim(e.target.value)}>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nimi}
              </option>
            ))}
          </select>
        </label>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img"
           aria-label="Puolueiden 2D-projektio">
        {/* tausta */}
        <rect x={pad} y={pad} width={w - 2 * pad} height={h - 2 * pad}
              fill="#fafbff" stroke="#e8eaf0" />
        {/* keskiviiva */}
        <line x1={sx(5)} y1={pad} x2={sx(5)} y2={h - pad}
              stroke="#dde2eb" strokeDasharray="3 3" />
        <line x1={pad} y1={sy(5)} x2={w - pad} y2={sy(5)}
              stroke="#dde2eb" strokeDasharray="3 3" />
        {/* hila ja akselien luvut */}
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <g key={`gx-${v}`}>
            <line x1={sx(v)} y1={pad} x2={sx(v)} y2={h - pad}
                  stroke="#eef0f6" strokeWidth={0.5} />
            <text x={sx(v)} y={h - pad + 14} textAnchor="middle" fontSize={10}
                  fill="#9aa3b2">
              {v}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <g key={`gy-${v}`}>
            <line x1={pad} y1={sy(v)} x2={w - pad} y2={sy(v)}
                  stroke="#eef0f6" strokeWidth={0.5} />
            <text x={pad - 8} y={sy(v) + 3} textAnchor="end" fontSize={10}
                  fill="#9aa3b2">
              {v}
            </text>
          </g>
        ))}

        {/* X-akselin "matala/korkea" -tekstit */}
        <text x={pad} y={h - 18} fontSize={10.5} fill="#5b6473" fontWeight={600}>
          ← {xLabel.matala}
        </text>
        <text x={w - pad} y={h - 18} textAnchor="end" fontSize={10.5}
              fill="#5b6473" fontWeight={600}>
          {xLabel.korkea} →
        </text>

        {/* Y-akselin tekstit */}
        <text x={20} y={pad} fontSize={10.5} fill="#5b6473" fontWeight={600}
              transform={`rotate(-90, 20, ${pad})`}>
          ↑ {yLabel.korkea}
        </text>
        <text x={20} y={h - pad} fontSize={10.5} fill="#5b6473" fontWeight={600}
              transform={`rotate(-90, 20, ${h - pad})`}>
          {yLabel.matala} ↓
        </text>

        {/* Akselien otsikot */}
        <text x={w / 2} y={h - 4} textAnchor="middle" fontSize={12}
              fontWeight={650} fill="#0b1222">
          {xLabel.nimi}
        </text>
        <text x={14} y={h / 2} fontSize={12} fontWeight={650} fill="#0b1222"
              transform={`rotate(-90, 14, ${h / 2})`} textAnchor="middle">
          {yLabel.nimi}
        </text>

        {/* Pisteet ja etiketit */}
        {data.map((p) => {
          const cx = sx(p.x);
          const cy = sy(p.y);
          const r = 6 + Math.sqrt(p.paikat) * 1.5;
          const labelPos = pickLabelPos(cx, cy, p.lyhenne);
          return (
            <g key={p.id}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={p.vari}
                fillOpacity={0.85}
                stroke="#fff"
                strokeWidth={1.5}
              >
                <title>{`${p.nimi} (${p.paikat} paikkaa)\n${xLabel.nimi}: ${p.x}/10\n${yLabel.nimi}: ${p.y}/10`}</title>
              </circle>
              <text
                x={cx + labelPos.dx}
                y={cy + labelPos.dy}
                fontSize={11}
                fontWeight={600}
                fill="#0b1222"
              >
                {p.lyhenne}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
