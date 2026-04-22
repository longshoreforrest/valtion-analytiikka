import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatEur } from "../data/format";

export interface TreemapCell {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
}

interface Props {
  rows: TreemapCell[];
  height?: number;
  onSelect?: (cell: TreemapCell) => void;
}

/**
 * Yhden tason treemap: jokainen rivi on yksi suorakulmio. Klikkaus kutsuu
 * onSelect:ia, jolla kutsuja voi porautua seuraavalle tasolle. Värit tulevat
 * kategorialliselta skaalalta id:n perusteella, jolloin sama kategoria säilyttää
 * värinsä näkymän yli.
 */
export default function DrilldownTreemap({ rows, height = 560, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;
    host.innerHTML = "";

    if (!rows.length) {
      host.innerHTML = `<div class="loading">Ei dataa tällä tasolla.</div>`;
      return;
    }

    const width = host.clientWidth || 1100;
    const h = height;

    const root = d3
      .hierarchy<{ children?: TreemapCell[]; id?: string; label?: string; value?: number }>({
        children: rows,
      })
      .sum((d) => (d as TreemapCell).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const rootR = root as d3.HierarchyRectangularNode<any>;
    d3.treemap<any>().size([width, h]).paddingOuter(2).paddingInner(2).round(true)(rootR);

    const color = d3.scaleOrdinal<string, string>(d3.schemeTableau10).domain(rows.map((r) => r.id));

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", h)
      .attr("viewBox", `0 0 ${width} ${h}`)
      .style("display", "block")
      .style("background", "transparent");

    const node = svg
      .append("g")
      .selectAll<SVGGElement, d3.HierarchyRectangularNode<any>>("g")
      .data(rootR.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .style("cursor", onSelect ? "pointer" : "default");

    node
      .append("rect")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d) => color((d.data as TreemapCell).id))
      .attr("fill-opacity", 0.9)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .attr("rx", 4)
      .attr("ry", 4)
      .append("title")
      .text((d) => {
        const c = d.data as TreemapCell;
        return `${c.label}${c.sublabel ? `\n${c.sublabel}` : ""}\n${formatEur(c.value)}`;
      });

    node
      .filter((d) => d.x1 - d.x0 > 80 && d.y1 - d.y0 > 28)
      .append("foreignObject")
      .attr("x", 6)
      .attr("y", 4)
      .attr("width", (d) => Math.max(0, d.x1 - d.x0 - 8))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0 - 8))
      .append("xhtml:div")
      .attr("style", "font-size: 11px; color: #0f172a; font-weight: 600; line-height: 1.25; overflow: hidden; text-shadow: 0 1px 2px rgba(255,255,255,0.4);")
      .html((d) => {
        const c = d.data as TreemapCell;
        return `<div>${escapeHtml(c.label)}</div>
          <div style="font-weight:400; margin-top:2px; font-variant-numeric: tabular-nums;">
            ${escapeHtml(formatEur(c.value))}
          </div>`;
      });

    if (onSelect) {
      node.on("click", (_ev, d) => onSelect(d.data as TreemapCell));
      node
        .on("mouseenter", function () {
          d3.select(this).select("rect").attr("fill-opacity", 1).attr("stroke", "#2563eb").attr("stroke-width", 2);
        })
        .on("mouseleave", function () {
          d3.select(this).select("rect").attr("fill-opacity", 0.9).attr("stroke", "#ffffff").attr("stroke-width", 1.5);
        });
    }

    host.appendChild(svg.node()!);
  }, [rows, height, onSelect]);

  return <div ref={hostRef} className="plot-host" style={{ minHeight: height }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
