import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { formatEur } from "../data/format";

export interface TimePoint {
  vuosi: number;
  arvo: number | null;
  sarja: string;
}

interface Props {
  data: TimePoint[];
  height?: number;
  yLabel?: string;
}

export default function TimeSeriesChart({ data, height = 280, yLabel = "Euroa" }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;
    const width = host.clientWidth || 900;

    const valid = data.filter((d) => d.arvo != null) as Array<TimePoint & { arvo: number }>;

    const plot = Plot.plot({
      width,
      height,
      marginLeft: 80,
      marginBottom: 32,
      style: { background: "transparent", color: "var(--fg)", fontSize: "12px" },
      x: { label: "Vuosi", tickFormat: "d", grid: true },
      y: {
        label: yLabel,
        grid: true,
        tickFormat: (v: number) => formatEur(v),
      },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.ruleY([0], { stroke: "var(--border)" }),
        Plot.line(valid, {
          x: "vuosi",
          y: "arvo",
          stroke: "sarja",
          strokeWidth: 2,
          curve: "monotone-x",
        }),
        Plot.dot(valid, {
          x: "vuosi",
          y: "arvo",
          fill: "sarja",
          r: 3,
          title: (d: TimePoint & { arvo: number }) =>
            `${d.sarja}\n${d.vuosi}: ${formatEur(d.arvo)}`,
        }),
      ],
    });

    host.replaceChildren(plot);
    return () => plot.remove();
  }, [data, height, yLabel]);

  return <div ref={hostRef} className="plot-host" style={{ minHeight: height }} />;
}
