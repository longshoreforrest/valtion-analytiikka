import { useMemo } from "react";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "../data/parties";
import { POLITICAL_QUESTIONS } from "../data/political_questions";

interface Props {
  questionId: string;
}

/**
 * Selittää visuaalisesti ja sanallisesti miksi tietyt puolueet asettuvat
 * samalla tavalla / eri tavalla annettuun poliittiseen kysymykseen.
 *
 * Toimintaperiaate:
 *  1) Otetaan kysymyksen ydinDimensiot (1–4 kpl arvomallin akseleita)
 *  2) Lasketaan jokaiselle puolueelle "kanta-pistemäärä" = ydindimensioiden
 *     keskiarvo. Tämä antaa karkean indikaattorin onko puolue tukijoita vai
 *     vastustajia esitykselle.
 *  3) Visualisoidaan jokaisen puolueen pisteet ydindimensioilla pylväinä
 *     ja generoidaan kuvaus näiden pohjalta.
 */
export default function QuestionExplainer({ questionId }: Props) {
  const q = useMemo(
    () => POLITICAL_QUESTIONS.find((x) => x.id === questionId),
    [questionId]
  );

  const dims = useMemo(() => {
    if (!q?.ydinDimensiot?.length) return [];
    return VALUE_DIMENSIONS.filter((d) => q.ydinDimensiot!.includes(d.id));
  }, [q]);

  const analysis = useMemo(() => {
    if (!q || dims.length === 0) return null;
    // Pisteet per puolue: keskiarvo ydindimensioista
    const perParty = PARTIES.map((p) => {
      const arvot = dims.map((d) => PARTY_VALUES[p.id]?.[d.id]?.arvo ?? 5);
      const score = arvot.reduce((s, v) => s + v, 0) / arvot.length;
      return { party: p, score, arvot };
    });
    const sorted = [...perParty].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];

    // Ryhmittele samankaltaisten klusteriin: yli 6.5 = "tyypillisesti tukee",
    // 4.5–6.5 = "neutraali / tilannekohtainen", alle 4.5 = "tyypillisesti vastustaa"
    // Huom: tämä on vain visualisoiva tulkinta, ei absoluuttinen ennuste.
    const supporters = perParty.filter((p) => p.score >= 6.5);
    const opponents = perParty.filter((p) => p.score <= 4.5);
    const middle = perParty.filter((p) => p.score > 4.5 && p.score < 6.5);

    // Suurin dimensiokohtainen ero
    const dimSpreads = dims.map((d) => {
      const arvot = PARTIES.map(
        (p) => PARTY_VALUES[p.id]?.[d.id]?.arvo ?? 5
      );
      return {
        d,
        spread: Math.max(...arvot) - Math.min(...arvot),
      };
    });
    const biggestSpread = dimSpreads.sort((a, b) => b.spread - a.spread)[0];

    return {
      perParty: sorted,
      supporters: supporters.sort((a, b) => b.score - a.score),
      opponents: opponents.sort((a, b) => a.score - b.score),
      middle,
      top,
      bottom,
      biggestSpread,
    };
  }, [q, dims]);

  if (!q) return null;
  if (dims.length === 0 || !analysis) {
    return (
      <div className="qb-explain-empty">
        Tähän kysymykseen ei ole vielä määritelty selittäviä ydindimensioita.
      </div>
    );
  }

  const lineW = 200;
  const linePadX = 16;
  const sx = (v: number) => linePadX + (v / 10) * lineW;

  return (
    <div className="qb-explain">
      <div className="qb-explain-text">
        <h4>Miksi puolueet asettuvat näin?</h4>
        <p>
          Tämä kysymys palautuu arvomallissa erityisesti seuraaviin
          dimensioihin:{" "}
          {dims.map((d, i) => (
            <span key={d.id}>
              <b>{d.nimi}</b>
              {i < dims.length - 1 ? ", " : ""}
            </span>
          ))}
          . Puolueet jotka ovat näissä korkeita asettuvat tyypillisesti
          samalla tavalla, ja erot tähän kysymykseen palautuvat juuri
          näihin painotuksiin.
        </p>

        {analysis.supporters.length > 0 ? (
          <p>
            <b>Tyypillisesti tukevat / korostavat:</b>{" "}
            {analysis.supporters.map((p, i) => (
              <span key={p.party.id}>
                <span
                  className="party-toggle-dot"
                  style={{ background: p.party.vari }}
                />{" "}
                <b style={{ color: p.party.vari }}>{p.party.lyhenne}</b>{" "}
                <span className="muted">
                  ({p.score.toFixed(1)}/10)
                </span>
                {i < analysis.supporters.length - 1 ? ", " : ""}
              </span>
            ))}
            .
          </p>
        ) : null}

        {analysis.opponents.length > 0 ? (
          <p>
            <b>Tyypillisesti vastustavat / aliarvostavat:</b>{" "}
            {analysis.opponents.map((p, i) => (
              <span key={p.party.id}>
                <span
                  className="party-toggle-dot"
                  style={{ background: p.party.vari }}
                />{" "}
                <b style={{ color: p.party.vari }}>{p.party.lyhenne}</b>{" "}
                <span className="muted">
                  ({p.score.toFixed(1)}/10)
                </span>
                {i < analysis.opponents.length - 1 ? ", " : ""}
              </span>
            ))}
            .
          </p>
        ) : null}

        {analysis.middle.length > 0 ? (
          <p className="muted" style={{ fontSize: 12.5 }}>
            <b>Tilannekohtainen / välimaastossa:</b>{" "}
            {analysis.middle
              .map((p) => `${p.party.lyhenne} (${p.score.toFixed(1)})`)
              .join(", ")}
            .
          </p>
        ) : null}

        <p>
          Suurin ero tähän kysymykseen syntyy dimensiossa{" "}
          <b>{analysis.biggestSpread.d.nimi}</b>: arvojen vaihtelu on{" "}
          {analysis.biggestSpread.spread.toFixed(1)} pistettä. Toinen pää
          (matala = "{analysis.biggestSpread.d.matala}") ja toinen pää
          (korkea = "{analysis.biggestSpread.d.korkea}") tuottaa eri
          johtopäätöksen tähän kysymykseen.
        </p>

        <p className="muted" style={{ fontSize: 12 }}>
          Tämä on visualisoiva tulkinta sovelluksen oman arvomallin pohjalta
          (12 dim, asteikko 0–10). Se ei korvaa puolueen tarkkaa kantaa
          yksittäiseen kysymykseen — sen voi varmistaa puolueen
          vaihtoehtobudjetista tai eduskuntakysymyksestä.
        </p>
      </div>

      <div className="qb-explain-grid">
        {dims.map((d) => {
          const arvot = PARTIES.map((p) => ({
            party: p,
            arvo: PARTY_VALUES[p.id]?.[d.id]?.arvo ?? 5,
          }));
          const sorted = [...arvot].sort((a, b) => b.arvo - a.arvo);
          return (
            <div key={d.id} className="qb-explain-dim">
              <div className="qb-explain-dim-head">
                <b>{d.nimi}</b>
                <span className="muted">
                  matala = {d.matala} · korkea = {d.korkea}
                </span>
              </div>
              <svg
                width="100%"
                viewBox={`0 0 ${linePadX * 2 + lineW} ${
                  PARTIES.length * 18 + 18
                }`}
                className="qb-explain-svg"
              >
                {/* Asteikko */}
                <line
                  x1={linePadX}
                  y1={10}
                  x2={linePadX + lineW}
                  y2={10}
                  stroke="#e2e6ee"
                  strokeWidth={1}
                />
                {[0, 5, 10].map((v) => (
                  <text
                    key={v}
                    x={sx(v)}
                    y={6}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill="#9aa3b2"
                  >
                    {v}
                  </text>
                ))}
                {sorted.map((row, i) => {
                  const y = 22 + i * 16;
                  const x = sx(row.arvo);
                  return (
                    <g key={row.party.id}>
                      <line
                        x1={linePadX}
                        y1={y}
                        x2={linePadX + lineW}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth={1}
                      />
                      <line
                        x1={sx(0)}
                        y1={y}
                        x2={x}
                        y2={y}
                        stroke={row.party.vari}
                        strokeOpacity={0.35}
                        strokeWidth={2.5}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={4.5}
                        fill={row.party.vari}
                        stroke="#fff"
                        strokeWidth={1}
                      >
                        <title>{`${row.party.nimi}: ${row.arvo}/10`}</title>
                      </circle>
                      <text
                        x={x + 8}
                        y={y + 3}
                        fontSize={10.5}
                        fontWeight={600}
                        fill={row.party.vari}
                      >
                        {row.party.lyhenne}
                      </text>
                      <text
                        x={linePadX + lineW + 6}
                        y={y + 3}
                        fontSize={10}
                        fontFamily="var(--mono)"
                        fill="#5b6473"
                      >
                        {row.arvo}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
