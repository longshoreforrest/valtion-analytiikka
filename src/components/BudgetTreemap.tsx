import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { formatEur } from "../data/format";

export interface TreemapRow {
  paaluokka_nimi: string;
  luku_nimi: string;
  momentti_nimi: string;
  maararaha_eur: number;
}

interface Props {
  rows: TreemapRow[];
  height?: number;
}

export default function BudgetTreemap({ rows, height = 620 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const hierarchy = useMemo(() => {
    const root: any = { name: "Valtion talousarvio", children: new Map() };
    for (const r of rows) {
      if (!r.maararaha_eur || r.maararaha_eur <= 0) continue;
      const paa = r.paaluokka_nimi || "(tuntematon)";
      const luku = r.luku_nimi || "(yleinen)";
      const mom = r.momentti_nimi || "(momentti)";
      let paaN = root.children.get(paa);
      if (!paaN) {
        paaN = { name: paa, children: new Map() };
        root.children.set(paa, paaN);
      }
      let lukuN = paaN.children.get(luku);
      if (!lukuN) {
        lukuN = { name: luku, children: new Map() };
        paaN.children.set(luku, lukuN);
      }
      lukuN.children.set(mom, { name: mom, value: r.maararaha_eur, paa, luku });
    }
    const toArr = (node: any): any => ({
      name: node.name,
      children: node.children
        ? Array.from(node.children.values()).map((c: any) =>
            c.children ? toArr(c) : c
          )
        : undefined,
      value: node.value,
    });
    return toArr(root);
  }, [rows]);

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;

    const width = host.clientWidth || 1100;
    const h = height;

    const root = d3.hierarchy(hierarchy).sum((d: any) => d.value || 0).sort(
      (a, b) => (b.value || 0) - (a.value || 0)
    );
    d3.treemap<any>().size([width, h]).paddingOuter(2).paddingInner(1).round(true)(root);

    const leaves = root.leaves().filter((n: any) => (n.x1 - n.x0) > 1 && (n.y1 - n.y0) > 1);
    const paaluokat = Array.from(new Set(leaves.map((n: any) => n.data.paa)));
    const color = d3.scaleOrdinal<string, string>(d3.schemeTableau10).domain(paaluokat);

    const plot = Plot.plot({
      width,
      height: h,
      margin: 0,
      style: { background: "transparent", color: "var(--fg)" },
      x: { axis: null, domain: [0, width] },
      y: { axis: null, domain: [h, 0] },
      marks: [
        Plot.rect(leaves, {
          x1: (d: any) => d.x0,
          x2: (d: any) => d.x1,
          y1: (d: any) => d.y0,
          y2: (d: any) => d.y1,
          fill: (d: any) => color(d.data.paa),
          fillOpacity: 0.85,
          stroke: "#0e1116",
          strokeWidth: 1,
          title: (d: any) =>
            `${d.data.paa}\n${d.data.luku}\n${d.data.name}\n${formatEur(d.data.value)}`,
        }),
        Plot.text(
          leaves.filter((n: any) => (n.x1 - n.x0) > 60 && (n.y1 - n.y0) > 20),
          {
            x: (d: any) => d.x0 + 4,
            y: (d: any) => d.y0 + 4,
            text: (d: any) => d.data.name,
            textAnchor: "start",
            dy: 10,
            fill: "#0e1116",
            fontSize: 10,
            fontWeight: 600,
            lineWidth: 20,
          }
        ),
      ],
    });

    host.replaceChildren(plot);
    return () => {
      plot.remove();
    };
  }, [hierarchy, height]);

  return <div ref={hostRef} className="plot-host" style={{ minHeight: height }} />;
}
