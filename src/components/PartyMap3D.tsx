import { useEffect, useMemo, useRef, useState } from "react";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "../data/parties";

/**
 * 3D-projektio puolueista valittujen kolmen dimension kautta.
 *
 * Toteutus on puhtaasti SVG-pohjainen: ei kolmansia kirjastoja. Käyttäjä
 * voi pyörittää näkymää kolmella tavalla:
 *  1) Klikkaa ja raahaa SVG:n päällä — yaw vaakaan, pitch pystyyn
 *  2) Liukurit yaw / pitch
 *  3) "Pyörittele" -nappi käynnistää automaattisen pyörittelyn
 *
 * Projektio on pseudo-perspektiivinen: pisteet jotka ovat lähempänä katsojaa
 * piirretään suurempina ja kirkkaampina.
 */

type Vec3 = { x: number; y: number; z: number };

function rotate(p: Vec3, yaw: number, pitch: number): Vec3 {
  // Yaw rotates around Y axis, pitch around X axis
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  const cp = Math.cos(pitch),
    sp = Math.sin(pitch);

  // Yaw
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const y1 = p.y;
  // Pitch
  const y2 = y1 * cp - z1 * sp;
  const z2 = y1 * sp + z1 * cp;
  const x2 = x1;

  return { x: x2, y: y2, z: z2 };
}

interface AxisInfo {
  id: string;
  nimi: string;
}

export default function PartyMap3D() {
  const dimensions = VALUE_DIMENSIONS;
  const [xDim, setXDim] = useState("fiscal_tightness");
  const [yDim, setYDim] = useState("public_services");
  const [zDim, setZDim] = useState("climate");
  const [yaw, setYaw] = useState(0.5);
  const [pitch, setPitch] = useState(-0.4);
  const [autoRotate, setAutoRotate] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startYaw: number;
    startPitch: number;
  }>({ active: false, startX: 0, startY: 0, startYaw: 0, startPitch: 0 });

  // Auto-rotate: increment yaw 60 fps
  useEffect(() => {
    if (!autoRotate) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setYaw((y) => y + dt * 0.5);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [autoRotate]);

  const xAxis: AxisInfo = dimensions.find((d) => d.id === xDim)!;
  const yAxis: AxisInfo = dimensions.find((d) => d.id === yDim)!;
  const zAxis: AxisInfo = dimensions.find((d) => d.id === zDim)!;

  const w = 620;
  const h = 480;
  const cx = w / 2;
  const cy = h / 2 + 4;
  const unit = 18; // px per arvomalli-yksikkö
  const scale3d = 0.85;

  // Mapataan arvomalli (0..10) avaruuteen [-5..+5] kolmessa akselissa
  function dimToCoord(v: number): number {
    return (v - 5) * unit * scale3d;
  }

  function project(v: Vec3) {
    // Yksinkertainen perspektiivi: lähemmät pisteet (positiivinen z kameran suuntaan)
    // näkyvät isompina. Asteikkofaktori välillä [0.6, 1.4].
    const camZ = 12 * unit;
    const persp = camZ / (camZ - v.z);
    return {
      sx: cx + v.x * persp,
      sy: cy - v.y * persp,
      depth: v.z,
      persp,
    };
  }

  // Akselien päätepisteet — tähdet matrix:n vaikutuksen alla
  const axisLen = 5 * unit * scale3d;
  const axes = useMemo(
    () => [
      {
        id: "x",
        from: { x: -axisLen, y: 0, z: 0 },
        to: { x: axisLen, y: 0, z: 0 },
        color: "#0ea5e9",
        label: xAxis.nimi,
        labelEnd: { x: axisLen, y: 0, z: 0 },
      },
      {
        id: "y",
        from: { x: 0, y: -axisLen, z: 0 },
        to: { x: 0, y: axisLen, z: 0 },
        color: "#10b981",
        label: yAxis.nimi,
        labelEnd: { x: 0, y: axisLen, z: 0 },
      },
      {
        id: "z",
        from: { x: 0, y: 0, z: -axisLen },
        to: { x: 0, y: 0, z: axisLen },
        color: "#f59e0b",
        label: zAxis.nimi,
        labelEnd: { x: 0, y: 0, z: axisLen },
      },
    ],
    [xAxis, yAxis, zAxis]
  );

  // Kuution kulmat
  const cube = useMemo(() => {
    const a = axisLen;
    const corners: Vec3[] = [
      { x: -a, y: -a, z: -a },
      { x: a, y: -a, z: -a },
      { x: a, y: a, z: -a },
      { x: -a, y: a, z: -a },
      { x: -a, y: -a, z: a },
      { x: a, y: -a, z: a },
      { x: a, y: a, z: a },
      { x: -a, y: a, z: a },
    ];
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    return { corners, edges };
  }, []);

  // Puolueet 3D-koordinaatistossa
  const points = useMemo(() => {
    return PARTIES.map((p) => {
      const xv = PARTY_VALUES[p.id]?.[xDim]?.arvo ?? 5;
      const yv = PARTY_VALUES[p.id]?.[yDim]?.arvo ?? 5;
      const zv = PARTY_VALUES[p.id]?.[zDim]?.arvo ?? 5;
      const v: Vec3 = {
        x: dimToCoord(xv),
        y: dimToCoord(yv),
        z: dimToCoord(zv),
      };
      return { party: p, raw: { xv, yv, zv }, v };
    });
  }, [xDim, yDim, zDim]);

  // Pyöritetyt pisteet ja syvyysjärjestys
  const rotatedPoints = useMemo(() => {
    return points
      .map((p) => ({
        ...p,
        rv: rotate(p.v, yaw, pitch),
      }))
      .sort((a, b) => a.rv.z - b.rv.z); // takimmaiset ensin
  }, [points, yaw, pitch]);

  // Hiirikäsittely
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (autoRotate) setAutoRotate(false);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startYaw: yaw,
      startPitch: pitch,
    };
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setYaw(dragRef.current.startYaw + dx * 0.01);
    const newPitch = dragRef.current.startPitch + dy * 0.01;
    // Rajoitetaan pitch jotta näkymä ei käänny ylösalaisin
    setPitch(Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newPitch)));
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const reset = () => {
    setYaw(0.5);
    setPitch(-0.4);
  };

  return (
    <div className="party-map3d">
      <div className="party-map3d-controls">
        <label>
          <span className="ax-tag" style={{ background: "#0ea5e9" }}>
            X
          </span>
          <select value={xDim} onChange={(e) => setXDim(e.target.value)}>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nimi}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="ax-tag" style={{ background: "#10b981" }}>
            Y
          </span>
          <select value={yDim} onChange={(e) => setYDim(e.target.value)}>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nimi}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="ax-tag" style={{ background: "#f59e0b" }}>
            Z
          </span>
          <select value={zDim} onChange={(e) => setZDim(e.target.value)}>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nimi}
              </option>
            ))}
          </select>
        </label>
        <div className="party-map3d-rotate">
          <button
            type="button"
            className={`rotate-btn ${autoRotate ? "on" : ""}`}
            onClick={() => setAutoRotate((v) => !v)}
            title="Käynnistä / pysäytä automaattinen pyöritys"
          >
            {autoRotate ? "⏸ Pysäytä" : "▶︎ Pyörittele"}
          </button>
          <button
            type="button"
            className="rotate-btn ghost"
            onClick={reset}
            title="Palauta oletuskulma"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div className="party-map3d-sliders">
        <label>
          Vaakapyöritys
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={yaw}
            onChange={(e) => {
              setYaw(parseFloat(e.target.value));
              setAutoRotate(false);
            }}
          />
          <span className="num-tag">{Math.round((yaw * 180) / Math.PI)}°</span>
        </label>
        <label>
          Pystypyöritys
          <input
            type="range"
            min={-Math.PI / 2 + 0.1}
            max={Math.PI / 2 - 0.1}
            step={0.01}
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
          />
          <span className="num-tag">{Math.round((pitch * 180) / Math.PI)}°</span>
        </label>
      </div>

      <div className="party-map3d-canvas-wrap">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Puolueiden 3D-projektio"
          className="party-map3d-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Tausta */}
          <rect x={0} y={0} width={w} height={h} fill="#fafbff" />

          {/* Kuution viivat */}
          {cube.edges.map(([i, j], idx) => {
            const a = project(rotate(cube.corners[i], yaw, pitch));
            const b = project(rotate(cube.corners[j], yaw, pitch));
            const meanZ = (a.depth + b.depth) / 2;
            const front = meanZ > 0;
            return (
              <line
                key={idx}
                x1={a.sx}
                y1={a.sy}
                x2={b.sx}
                y2={b.sy}
                stroke={front ? "#cbd5e1" : "#e2e8f0"}
                strokeWidth={front ? 1.4 : 0.9}
                strokeDasharray={front ? "0" : "3 3"}
              />
            );
          })}

          {/* Hilakuviot kuution etupinnoille — kevyt apu silmälle */}
          {[-1, 0, 1].map((t) => {
            const v = t * (axisLen / 2);
            const a = project(rotate({ x: -axisLen, y: v, z: -axisLen }, yaw, pitch));
            const b = project(rotate({ x: axisLen, y: v, z: -axisLen }, yaw, pitch));
            return (
              <line
                key={`gh-${t}`}
                x1={a.sx}
                y1={a.sy}
                x2={b.sx}
                y2={b.sy}
                stroke="#eef0f6"
                strokeWidth={0.6}
              />
            );
          })}
          {[-1, 0, 1].map((t) => {
            const v = t * (axisLen / 2);
            const a = project(rotate({ x: v, y: -axisLen, z: -axisLen }, yaw, pitch));
            const b = project(rotate({ x: v, y: axisLen, z: -axisLen }, yaw, pitch));
            return (
              <line
                key={`gv-${t}`}
                x1={a.sx}
                y1={a.sy}
                x2={b.sx}
                y2={b.sy}
                stroke="#eef0f6"
                strokeWidth={0.6}
              />
            );
          })}

          {/* Akselit */}
          {axes.map((ax) => {
            const from = project(rotate(ax.from, yaw, pitch));
            const to = project(rotate(ax.to, yaw, pitch));
            return (
              <g key={ax.id}>
                <line
                  x1={from.sx}
                  y1={from.sy}
                  x2={to.sx}
                  y2={to.sy}
                  stroke={ax.color}
                  strokeWidth={1.6}
                  strokeOpacity={0.85}
                />
                <circle cx={to.sx} cy={to.sy} r={3.5} fill={ax.color} />
                <text
                  x={to.sx + 8}
                  y={to.sy + 4}
                  fontSize={11.5}
                  fill={ax.color}
                  fontWeight={700}
                >
                  {ax.label}
                </text>
              </g>
            );
          })}

          {/* Pisteet (puolueet) — projektoituna ja syvyysjärjestyksessä */}
          {rotatedPoints.map((p) => {
            const proj = project(p.rv);
            const baseR = 6 + Math.sqrt(p.party.paikat) * 1.5;
            const r = baseR * proj.persp;
            const opacity = 0.55 + 0.45 * Math.min(1, proj.persp / 1.4);
            return (
              <g key={p.party.id}>
                {/* Apuviiva pohjalle (z=−axisLen taso) — tukee 3D-tunnetta */}
                {(() => {
                  const baseRot = rotate(
                    { x: p.v.x, y: p.v.y, z: -axisLen },
                    yaw,
                    pitch
                  );
                  const baseProj = project(baseRot);
                  return (
                    <line
                      x1={proj.sx}
                      y1={proj.sy}
                      x2={baseProj.sx}
                      y2={baseProj.sy}
                      stroke={p.party.vari}
                      strokeOpacity={0.18}
                      strokeWidth={1}
                      strokeDasharray="2 3"
                    />
                  );
                })()}
                <circle
                  cx={proj.sx}
                  cy={proj.sy}
                  r={r}
                  fill={p.party.vari}
                  fillOpacity={opacity}
                  stroke="#fff"
                  strokeWidth={1.2 + proj.persp * 0.4}
                >
                  <title>
                    {`${p.party.nimi} (${p.party.paikat} paikkaa)\n${xAxis.nimi}: ${p.raw.xv}/10\n${yAxis.nimi}: ${p.raw.yv}/10\n${zAxis.nimi}: ${p.raw.zv}/10`}
                  </title>
                </circle>
                <text
                  x={proj.sx + r + 4}
                  y={proj.sy + 4}
                  fontSize={11 * Math.max(0.85, proj.persp)}
                  fontWeight={700}
                  fill="#0b1222"
                  fillOpacity={opacity}
                  style={{ pointerEvents: "none" }}
                >
                  {p.party.lyhenne}
                </text>
              </g>
            );
          })}

          {/* Käyttöohje pieni ohje-teksti vasemmassa alakulmassa */}
          <text x={12} y={h - 12} fontSize={10.5} fill="#9aa3b2">
            Pyöritä raahaamalla. Hiirellä piste = puolue.
          </text>
        </svg>
      </div>
    </div>
  );
}
