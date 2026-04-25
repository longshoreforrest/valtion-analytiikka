import { useMemo } from "react";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
  type Party,
  type ValueDimension,
} from "../data/parties";

interface Props {
  /** Puolue-id:t jotka piirretään päällekkäin (max ~4 luettavuuden takia) */
  selected: string[];
  /** Korostettu puolue, jonka rivi lihavoidaan */
  highlight?: string;
  /** Klikkaus dimensioon */
  onDimensionClick?: (dimensionId: string) => void;
  /** Rajatut dimensiot — jos undefined tai tyhjä, näytetään kaikki */
  dimensionIds?: string[];
}

/**
 * Radar / tutkakaavio puolueiden arvomallista. Akselit = dimensiot, kehä = 0–10.
 * Käyttää inline SVG:tä, ei ulkoisia kirjastoja.
 */
export default function PartyRadar({
  selected,
  highlight,
  onDimensionClick,
  dimensionIds,
}: Props) {
  const size = 460;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = size / 2 - 110;

  /** Aktiiviset dimensiot. Säilytetään VALUE_DIMENSIONS-järjestys jotta
   *  akselien sijainti pysyy stabiilina kun käyttäjä toggleaa. */
  const dims = useMemo(() => {
    if (!dimensionIds || dimensionIds.length === 0) return VALUE_DIMENSIONS;
    const set = new Set(dimensionIds);
    return VALUE_DIMENSIONS.filter((d) => set.has(d.id));
  }, [dimensionIds]);

  const partyMap = useMemo(() => {
    const m = new Map<string, Party>();
    PARTIES.forEach((p) => m.set(p.id, p));
    return m;
  }, []);

  const angle = (i: number, n: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;

  const point = (axisIdx: number, value: number, n: number) => {
    const a = angle(axisIdx, n);
    const r = (value / 10) * radius;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const polygonForParty = (partyId: string) => {
    const profile = PARTY_VALUES[partyId];
    if (!profile) return "";
    return dims.map((d, i) => {
      const v = profile[d.id]?.arvo ?? 0;
      const p = point(i, v, dims.length);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");
  };

  // Akseliviivojen ja ringin generointi
  const rings = [2, 4, 6, 8, 10];

  if (dims.length < 3) {
    return (
      <div className="party-radar-wrap radar-empty">
        <svg
          width="100%"
          viewBox={`0 0 ${size} ${size + 12}`}
          role="img"
          aria-label="Radar tarvitsee vähintään kolme dimensiota"
        >
          <circle cx={cx} cy={cy} r={radius} fill="#fafbff" stroke="#e8eaf0" />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontSize={14}
            fill="#5b6473"
            fontWeight={600}
          >
            Valitse vähintään 3 dimensiota
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize={12}
            fill="#9aa3b2"
          >
            radarin piirtämiseksi
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="party-radar-wrap">
      <svg width="100%" viewBox={`0 0 ${size} ${size + 12}`} role="img"
           aria-label="Puolueiden arvomallin radar-kuvaaja">
        {/* Renkaat */}
        {rings.map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={(r / 10) * radius}
            fill="none"
            stroke="#e2e6ee"
            strokeDasharray={r === 10 ? "0" : "2 3"}
            strokeWidth={r === 10 ? 1.2 : 1}
          />
        ))}

        {/* Akselit ja nimet */}
        {dims.map((d, i) => {
          const a = angle(i, dims.length);
          const xEnd = cx + radius * Math.cos(a);
          const yEnd = cy + radius * Math.sin(a);
          const xLabel = cx + (radius + 24) * Math.cos(a);
          const yLabel = cy + (radius + 24) * Math.sin(a);
          // labelin alignment akselin kulman mukaan
          const right = Math.cos(a) > 0.2;
          const left = Math.cos(a) < -0.2;
          const anchor = right ? "start" : left ? "end" : "middle";
          // pilko pitkät otsikot kahteen riviin
          const words = d.nimi.split(" ");
          let line1 = words.join(" ");
          let line2: string | null = null;
          if (line1.length > 20) {
            const mid = Math.ceil(words.length / 2);
            line1 = words.slice(0, mid).join(" ");
            line2 = words.slice(mid).join(" ");
          }
          return (
            <g
              key={d.id}
              className={onDimensionClick ? "axis-clickable" : ""}
              style={{ cursor: onDimensionClick ? "pointer" : "default" }}
              onClick={() => onDimensionClick?.(d.id)}
            >
              <line
                x1={cx}
                y1={cy}
                x2={xEnd}
                y2={yEnd}
                stroke="#dde2eb"
                strokeWidth={1}
              />
              <text
                x={xLabel}
                y={yLabel}
                textAnchor={anchor}
                fontSize={10.5}
                fill="#36404f"
                fontWeight={600}
                style={{ pointerEvents: "none" }}
              >
                {line1}
              </text>
              {line2 ? (
                <text
                  x={xLabel}
                  y={yLabel + 12}
                  textAnchor={anchor}
                  fontSize={10.5}
                  fill="#36404f"
                  fontWeight={600}
                  style={{ pointerEvents: "none" }}
                >
                  {line2}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Puolueiden polygonit */}
        {selected.map((pid) => {
          const party = partyMap.get(pid);
          if (!party) return null;
          const isHi = highlight && pid === highlight;
          return (
            <g key={pid}>
              <polygon
                points={polygonForParty(pid)}
                fill={party.vari}
                fillOpacity={isHi ? 0.32 : 0.18}
                stroke={party.vari}
                strokeWidth={isHi ? 2.4 : 1.6}
              />
              {dims.map((d, i) => {
                const v = PARTY_VALUES[pid]?.[d.id]?.arvo ?? 0;
                const p = point(i, v, dims.length);
                return (
                  <circle
                    key={`${pid}-${d.id}`}
                    cx={p.x}
                    cy={p.y}
                    r={isHi ? 3.2 : 2.4}
                    fill={party.vari}
                    stroke="#fff"
                    strokeWidth={1}
                  >
                    <title>{`${party.lyhenne} · ${d.nimi}: ${v}/10\n${
                      PARTY_VALUES[pid]?.[d.id]?.perustelu ?? ""
                    }`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* Renkaiden numerot */}
        {rings.map((r) => (
          <text
            key={r}
            x={cx + 4}
            y={cy - (r / 10) * radius - 2}
            fontSize={9}
            fill="#9aa3b2"
            fontWeight={500}
          >
            {r}
          </text>
        ))}
      </svg>

      <div className="party-radar-legend">
        {selected.map((pid) => {
          const party = partyMap.get(pid);
          if (!party) return null;
          return (
            <span
              key={pid}
              className={`legend-item ${highlight === pid ? "is-highlight" : ""}`}
              style={{ borderColor: party.vari, color: party.vari }}
            >
              <span className="legend-dot" style={{ background: party.vari }} />
              {party.lyhenne}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Apufunktio joka palauttaa dimensioiden määritelmän muiden komponenttien käyttöön. */
export function getDimension(id: string): ValueDimension | undefined {
  return VALUE_DIMENSIONS.find((d) => d.id === id);
}
