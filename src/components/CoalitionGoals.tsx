import { useEffect, useMemo, useState } from "react";
import { evaluateGoals } from "../data/coalition";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "../data/parties";

interface Props {
  partyIds: string[];
}

interface Preset {
  id: string;
  nimi: string;
  /** Funktio joka palauttaa tavoitearvot dimensioittain */
  build: (partyIds: string[]) => Record<string, number>;
}

const PRESETS: Preset[] = [
  {
    id: "centrist",
    nimi: "Keskitiet (5 / dim.)",
    build: () => Object.fromEntries(VALUE_DIMENSIONS.map((d) => [d.id, 5])),
  },
  {
    id: "coalition-mean",
    nimi: "Valitun koalition mediaani",
    build: (ids) => {
      const goals: Record<string, number> = {};
      VALUE_DIMENSIONS.forEach((d) => {
        const arvot = ids
          .map((pid) => PARTY_VALUES[pid]?.[d.id]?.arvo ?? 5)
          .sort((a, b) => a - b);
        if (arvot.length === 0) goals[d.id] = 5;
        else if (arvot.length % 2 === 1)
          goals[d.id] = arvot[(arvot.length - 1) / 2];
        else
          goals[d.id] =
            (arvot[arvot.length / 2 - 1] + arvot[arvot.length / 2]) / 2;
      });
      return goals;
    },
  },
  {
    id: "fiscal-hawk",
    nimi: "Tiukan sopeutuksen ohjelma",
    build: () => ({
      fiscal_tightness: 9,
      tax_level: 3,
      redistribution: 3,
      climate: 5,
      eu: 7,
      security: 9,
      immigration: 4,
      public_services: 4,
      education: 5,
      business_subsidies: 4,
      rural: 4,
      social_security: 3,
    }),
  },
  {
    id: "social-investment",
    nimi: "Hyvinvointi-investointi -ohjelma",
    build: () => ({
      fiscal_tightness: 4,
      tax_level: 8,
      redistribution: 8,
      climate: 9,
      eu: 8,
      security: 7,
      immigration: 7,
      public_services: 9,
      education: 9,
      business_subsidies: 4,
      rural: 5,
      social_security: 9,
    }),
  },
  {
    id: "green-transition",
    nimi: "Vihreän siirtymän ohjelma",
    build: () => ({
      fiscal_tightness: 5,
      tax_level: 7,
      redistribution: 7,
      climate: 10,
      eu: 9,
      security: 7,
      immigration: 7,
      public_services: 8,
      education: 9,
      business_subsidies: 3,
      rural: 6,
      social_security: 7,
    }),
  },
];

/**
 * Hallitusohjelma-tavoitteet & ristiveto-analyysi.
 * Käyttäjä asettaa per dimensio tavoitearvot (0–10) liukureilla, ja
 * näkee millä tavoin kunkin valitun puolueen kanta poikkeaa tavoitteesta.
 */
export default function CoalitionGoals({ partyIds }: Props) {
  const partyMap = useMemo(() => {
    const m = new Map<string, (typeof PARTIES)[number]>();
    PARTIES.forEach((p) => m.set(p.id, p));
    return m;
  }, []);

  const initialGoals = useMemo(() => {
    return Object.fromEntries(VALUE_DIMENSIONS.map((d) => [d.id, 5])) as Record<
      string,
      number
    >;
  }, []);
  const [goals, setGoals] = useState<Record<string, number>>(initialGoals);

  // Kun puoluejoukko vaihtuu ja käyttäjä ei ole vielä muuttanut tavoitteita
  // kustomiksi, voi olla hyödyllistä tarjota oletukseksi koalition mediaani.
  // Pidetään kuitenkin hallinta käyttäjällä — tarjotaan presetit erikseen.
  useEffect(() => {
    // ei automaattista resetointia
  }, [partyIds]);

  const evaluation = useMemo(
    () => evaluateGoals(partyIds, goals),
    [partyIds, goals]
  );

  // Järjestä dimensiot ristivedon (max |delta puolueen ja tavoitteen välillä|) mukaan
  const sortedDims = useMemo(() => {
    const arr = evaluation.perDimension.map((d) => {
      const maxAbs = Math.max(
        ...d.deviations.map((x) => Math.abs(x.delta)),
        0
      );
      return { ...d, maxAbsDeviation: maxAbs };
    });
    return arr.sort((a, b) => b.maxAbsDeviation - a.maxAbsDeviation);
  }, [evaluation]);

  if (partyIds.length === 0) {
    return (
      <div className="coalition-empty">
        Valitse vähintään yksi puolue nähdäksesi tavoiteohjelma-analyysin.
      </div>
    );
  }

  const lineW = 320;
  const linePadX = 26;
  const sx = (v: number) => linePadX + (v / 10) * lineW;

  return (
    <div className="coalition-goals">
      <div className="goals-presets">
        <span className="dim-filter-label">Tavoiteohjelmamallit</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="dim-preset"
            onClick={() => setGoals(p.build(partyIds))}
            title={p.nimi}
          >
            {p.nimi}
          </button>
        ))}
        <button
          type="button"
          className="link-btn"
          onClick={() => setGoals(initialGoals)}
          style={{ marginLeft: "auto" }}
        >
          Nollaa (kaikki = 5)
        </button>
      </div>

      <div className="goals-totals">
        <h4 style={{ margin: "0 0 8px" }}>
          Etäisyys tavoitteesta puolueittain
        </h4>
        <div className="goals-distance-bars">
          {[...evaluation.perParty]
            .sort((a, b) => a.distance - b.distance)
            .map((row) => {
              const p = partyMap.get(row.partyId);
              if (!p) return null;
              // Maksimi mahdollinen etäisyys 0–10 -asteikolla = 10
              const widthPct = Math.min(100, (row.distance / 10) * 100 * 1.4);
              return (
                <div key={row.partyId} className="goals-distance-row">
                  <div className="goals-distance-label">
                    <span
                      className="party-toggle-dot"
                      style={{ background: p.vari }}
                    />
                    <b>{p.lyhenne}</b>{" "}
                    <span className="muted">{p.nimi}</span>
                  </div>
                  <div className="goals-distance-bar-wrap">
                    <div
                      className="goals-distance-bar"
                      style={{
                        width: `${widthPct}%`,
                        background: p.vari,
                      }}
                    />
                    <span className="goals-distance-value">
                      {row.distance.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          Etäisyys = juurikeskineliövirhe (RMS) puolueen kannan ja
          tavoiteohjelman välillä, asteikolla 0–10. Pieni luku =
          puolueen kanta lähellä tavoitetta, suuri = ristiveto.
        </p>
      </div>

      <h4 style={{ margin: "12px 0 6px" }}>
        Dimensiokohtainen ristiveto — järjestys: suurin poikkeama ensin
      </h4>
      <ul className="goals-dim-list">
        {sortedDims.map((d) => (
          <li key={d.dimensionId} className="goals-dim-row">
            <div className="goals-dim-head">
              <b>{d.nimi}</b>
              <span className="muted">
                Max poikkeama tavoitteesta: ±{d.maxAbsDeviation.toFixed(1)}
              </span>
            </div>
            <div className="goals-dim-controls">
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={goals[d.dimensionId] ?? 5}
                onChange={(e) =>
                  setGoals((g) => ({
                    ...g,
                    [d.dimensionId]: parseInt(e.target.value, 10),
                  }))
                }
              />
              <span className="goals-target-tag">
                tavoite {goals[d.dimensionId] ?? 5}
              </span>
            </div>
            <svg
              width="100%"
              viewBox={`0 0 ${linePadX * 2 + lineW} 30`}
              className="goals-dim-svg"
            >
              <line
                x1={linePadX}
                y1={18}
                x2={linePadX + lineW}
                y2={18}
                stroke="#e2e6ee"
                strokeWidth={1}
              />
              {[0, 5, 10].map((v) => (
                <text
                  key={v}
                  x={sx(v)}
                  y={29}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9aa3b2"
                >
                  {v}
                </text>
              ))}
              {/* Tavoitteen pystyviiva */}
              <line
                x1={sx(d.target)}
                y1={6}
                x2={sx(d.target)}
                y2={24}
                stroke="#0b1222"
                strokeWidth={1.6}
                strokeDasharray="2 2"
              />
              <text
                x={sx(d.target)}
                y={5}
                textAnchor="middle"
                fontSize={8.5}
                fontWeight={700}
                fill="#0b1222"
              >
                ⌖
              </text>
              {/* Pisteet ja deviation-viivat tavoitteeseen */}
              {d.deviations.map((dev) => {
                const p = partyMap.get(dev.partyId);
                if (!p) return null;
                return (
                  <g key={dev.partyId}>
                    <line
                      x1={sx(dev.arvo)}
                      y1={18}
                      x2={sx(d.target)}
                      y2={18}
                      stroke={p.vari}
                      strokeOpacity={0.4}
                      strokeWidth={1.2}
                    />
                    <circle
                      cx={sx(dev.arvo)}
                      cy={18}
                      r={4.5}
                      fill={p.vari}
                      stroke="#fff"
                      strokeWidth={1}
                    >
                      <title>{`${p.lyhenne}: ${dev.arvo}/10 (Δ ${
                        dev.delta > 0 ? "+" : ""
                      }${dev.delta.toFixed(1)})`}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
