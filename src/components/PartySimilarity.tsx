import { useMemo } from "react";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "../data/parties";

/**
 * Kosini-similariteetti puolueiden arvomalleista. Heatmap-matriisi
 * jossa solu = kahden puolueen samankaltaisuus 0–1.
 */
function partyVector(pid: string): number[] {
  const profile = PARTY_VALUES[pid];
  if (!profile) return VALUE_DIMENSIONS.map(() => 0);
  return VALUE_DIMENSIONS.map((d) => profile[d.id]?.arvo ?? 0);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    // Keskitetään 5:n ympärille jotta cosine-similariteetti on
    // mielekäs asteikolla joka kulkee 0..10 (muuten kaikki vektorit
    // ovat liki samansuuntaisia origosta katsoen).
    const ai = a[i] - 5;
    const bi = b[i] - 5;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

interface Props {
  /** Klikkaus solusta (pid1, pid2) */
  onCellClick?: (a: string, b: string) => void;
  /** Mukana olevat puolueet — jos undefined tai tyhjä, näytetään kaikki */
  partyIds?: string[];
}

export default function PartySimilarity({ onCellClick, partyIds }: Props) {
  const order = useMemo(() => {
    const set = partyIds && partyIds.length > 0 ? new Set(partyIds) : null;
    return [...PARTIES]
      .filter((p) => (set ? set.has(p.id) : true))
      .sort((a, b) => b.paikat - a.paikat)
      .map((p) => p.id);
  }, [partyIds]);

  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    order.forEach((a) => {
      m[a] = {};
      order.forEach((b) => {
        m[a][b] = cosine(partyVector(a), partyVector(b));
      });
    });
    return m;
  }, [order]);

  // Värittäminen: -1 = punainen, 0 = neutraali, +1 = sininen
  const color = (v: number): string => {
    if (v >= 0) {
      // valkoinen → indigo
      const t = Math.min(1, v);
      const r = Math.round(238 - (238 - 79) * t);
      const g = Math.round(242 - (242 - 70) * t);
      const b = Math.round(255 - (255 - 229) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
    // valkoinen → vermilion
    const t = Math.min(1, -v);
    const r = Math.round(238 + (225 - 238) * t);
    const g = Math.round(242 - (242 - 29) * t);
    const b = Math.round(255 - (255 - 72) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const partyMap = useMemo(() => {
    const m = new Map<string, (typeof PARTIES)[number]>();
    PARTIES.forEach((p) => m.set(p.id, p));
    return m;
  }, []);

  if (order.length < 2) {
    return (
      <div className="similarity-empty">
        Valitse vähintään kaksi puoluetta nähdäksesi samankaltaisuusmatriisin.
      </div>
    );
  }

  return (
    <div className="similarity-table-wrap">
      <table className="similarity-table">
        <thead>
          <tr>
            <th></th>
            {order.map((id) => {
              const p = partyMap.get(id)!;
              return (
                <th key={id} title={p.nimi}>
                  <span style={{ color: p.vari }}>{p.lyhenne}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {order.map((rowId) => {
            const rowParty = partyMap.get(rowId)!;
            return (
              <tr key={rowId}>
                <th title={rowParty.nimi} scope="row">
                  <span style={{ color: rowParty.vari }}>{rowParty.lyhenne}</span>
                </th>
                {order.map((colId) => {
                  const v = matrix[rowId][colId];
                  const isDiag = rowId === colId;
                  return (
                    <td
                      key={colId}
                      style={{
                        background: isDiag ? "#0f172a" : color(v),
                        color: isDiag ? "#fff" : v > 0.45 ? "#fff" : "#0b1222",
                        cursor: onCellClick && !isDiag ? "pointer" : "default",
                      }}
                      onClick={() => !isDiag && onCellClick?.(rowId, colId)}
                      title={`${rowParty.lyhenne} ↔ ${
                        partyMap.get(colId)!.lyhenne
                      }: ${(v * 100).toFixed(0)} %`}
                    >
                      {isDiag ? "—" : v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="similarity-legend">
        <span>
          <span className="sw" style={{ background: color(-1) }} /> erilainen
        </span>
        <span>
          <span className="sw" style={{ background: color(0) }} /> neutraali
        </span>
        <span>
          <span className="sw" style={{ background: color(1) }} /> samanmielinen
        </span>
      </div>
    </div>
  );
}
