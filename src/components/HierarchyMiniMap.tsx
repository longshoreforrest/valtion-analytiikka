import { useMemo, useState } from "react";
import * as d3 from "d3";
import { formatEur } from "../data/format";

/**
 * Kevyt polkuvisualisointi. Näytetään jokainen hierarkian taso yhtenä vaakarivinä
 * icicle-tyylisesti: laatikon leveys vastaa sen osuutta tason kokonaissummasta,
 * valittu polku korostetaan ja muut himmennetään. Klikkaus kutsuu callbackin.
 *
 * Ideana on antaa käyttäjälle kokonaisuuden tuntu: näet kuinka iso pala valittu
 * hallinnonala on koko talousarviosta, mitkä luvut ovat suurimpia sen sisällä jne.
 */

export interface HierarchyLevel {
  /** Esim. "Hallinnonalat" */
  title: string;
  /** Käyttäjän nykyisellä polulla olevan solun tunniste, jos mikään */
  activeKey?: string;
  cells: Array<{ key: string; label: string; value: number }>;
  onSelect?: (key: string, label: string) => void;
}

interface Props {
  levels: HierarchyLevel[];
  rootLabel?: string;
  rootValue?: number;
  onRootClick?: () => void;
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  sublabel: string;
  levelTitle: string;
}

export default function HierarchyMiniMap({ levels, rootLabel = "Kaikki hallinnonalat", rootValue, onRootClick }: Props) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  const color = useMemo(() => {
    const all = new Set<string>();
    for (const lvl of levels) for (const c of lvl.cells) all.add(c.key);
    return d3.scaleOrdinal<string, string>(d3.schemeTableau10).domain(Array.from(all));
  }, [levels]);

  return (
    <div className="hierarchy-map">
      <div className="hm-root">
        <span>
          <span style={{ cursor: onRootClick ? "pointer" : "default", color: onRootClick ? "var(--accent)" : "inherit" }}
                onClick={onRootClick}>
            ▣
          </span>{" "}
          <strong>{rootLabel}</strong>
        </span>
        {rootValue != null ? <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatEur(rootValue)}</span> : null}
      </div>

      {levels.map((lvl, i) => {
        const total = lvl.cells.reduce((s, c) => s + (c.value || 0), 0) || 1;
        return (
          <div key={i} className="hm-row">
            <div className="hm-row-label">{lvl.title}</div>
            <div className="hm-cells">
              {lvl.cells.map((c) => {
                const widthPct = (100 * (c.value || 0)) / total;
                const isActive = lvl.activeKey === c.key;
                const hasActive = lvl.activeKey != null;
                const dim = hasActive && !isActive;
                const pctText = `${widthPct.toFixed(1).replace(".", ",")} %`;
                return (
                  <div
                    key={c.key}
                    className={`hm-cell${isActive ? " active" : ""}${dim ? " dim" : ""}`}
                    style={{
                      width: `${Math.max(0.5, widthPct)}%`,
                      background: color(c.key),
                    }}
                    onClick={() => lvl.onSelect?.(c.key, c.label)}
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      setTip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        label: c.label,
                        sublabel: `${formatEur(c.value)} · ${pctText}`,
                        levelTitle: lvl.title,
                      });
                    }}
                    onMouseMove={(e) => {
                      setTip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : null);
                    }}
                    onMouseLeave={() => setTip(null)}
                  >
                    {widthPct > 4 ? (
                      <span className="hm-cell-label">{c.label}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {tip ? (
        <div
          className="hm-tooltip"
          style={{
            position: "fixed",
            left: Math.max(12, Math.min(window.innerWidth - 340, tip.x - 160)),
            top: Math.max(12, tip.y - 8),
            transform: "translateY(-100%)",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600, color: "var(--fg-dim)", marginBottom: 3 }}>
            {tip.levelTitle}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", lineHeight: 1.35 }}>
            {tip.label}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-dim)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            {tip.sublabel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
