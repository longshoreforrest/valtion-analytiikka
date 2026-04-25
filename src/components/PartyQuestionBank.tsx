import { useMemo, useState } from "react";
import {
  POLITICAL_QUESTIONS,
  type Aikaperspektiivi,
  type Kattavuus,
} from "../data/political_questions";
import { PARTIES } from "../data/parties";
import { useSearch } from "../data/search";
import QuestionExplainer from "./QuestionExplainer";

const KATTAVUUS_LABEL: Record<Kattavuus, string> = {
  kattaa: "Kattaa",
  osittain: "Osittain",
  puuttuu: "Puuttuu",
};
const KATTAVUUS_BADGE: Record<Kattavuus, string> = {
  kattaa: "success",
  osittain: "warn",
  puuttuu: "danger",
};
const AIKA_LABEL: Record<Aikaperspektiivi, string> = {
  vuosi: "Vuosi",
  vaalikausi: "Vaalikausi",
  ylivaalikautinen: "Ylivaalikautinen",
  vaikuttavuus: "Vaikuttavuus",
};

const AIKA_VALUES: Aikaperspektiivi[] = [
  "vuosi",
  "vaalikausi",
  "ylivaalikautinen",
  "vaikuttavuus",
];
const KATTAVUUS_VALUES: Kattavuus[] = ["kattaa", "osittain", "puuttuu"];

interface Props {
  initialPartyFilter?: string;
}

export default function PartyQuestionBank({ initialPartyFilter }: Props) {
  // "all" = kaikki puolueet mukana. Yksittäinen puolue-id = vain ne kysymykset
  // joita kyseinen puolue esittää.
  const [partyFilter, setPartyFilter] = useState<string>(
    initialPartyFilter ?? "all"
  );
  // Aikaperspektiivi ja kattavuus: tyhjä joukko = kaikki sallittu
  const [aikaFilter, setAikaFilter] = useState<Set<Aikaperspektiivi>>(
    new Set()
  );
  const [kattavuusFilter, setKattavuusFilter] = useState<Set<Kattavuus>>(
    new Set()
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [explained, setExplained] = useState<Set<string>>(new Set());

  const toggleExplain = (id: string) => {
    setExplained((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    // varmista että kortti on auki kun selittäjä avataan
    setExpanded((s) => {
      const n = new Set(s);
      n.add(id);
      return n;
    });
  };
  const { matches } = useSearch();

  const toggleAika = (v: Aikaperspektiivi) =>
    setAikaFilter((s) => {
      const n = new Set(s);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });
  const toggleKattavuus = (v: Kattavuus) =>
    setKattavuusFilter((s) => {
      const n = new Set(s);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });

  const visible = useMemo(() => {
    return POLITICAL_QUESTIONS.filter((q) => {
      if (partyFilter !== "all" && !q.esittäjät.includes(partyFilter))
        return false;
      if (aikaFilter.size > 0 && !aikaFilter.has(q.aikaperspektiivi))
        return false;
      if (kattavuusFilter.size > 0 && !kattavuusFilter.has(q.kattavuus))
        return false;
      // tekstihaku osuu otsikkoon, kysymykseen tai teemaan
      if (
        !matches(q.otsikko) &&
        !matches(q.kysymys) &&
        !matches(q.teema) &&
        !q.nykyiset.some((n) => matches(n)) &&
        !(q.puuttuvaData ?? []).some((n) => matches(n))
      )
        return false;
      return true;
    });
  }, [partyFilter, aikaFilter, kattavuusFilter, matches]);

  const activeFilterCount =
    (partyFilter !== "all" ? 1 : 0) + aikaFilter.size + kattavuusFilter.size;
  const resetAll = () => {
    setPartyFilter("all");
    setAikaFilter(new Set());
    setKattavuusFilter(new Set());
  };

  const toggle = (id: string) => {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="qb-wrap">
      <div className="qb-filters">
        <div className="qb-filter-row">
          <span className="qb-filter-label">Puolue</span>
          <div className="qb-filter-chips">
            <button
              type="button"
              className={`qb-chip ${partyFilter === "all" ? "on" : ""}`}
              onClick={() => setPartyFilter("all")}
            >
              Kaikki
            </button>
            {PARTIES.map((p) => {
              const on = partyFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`qb-chip party-chip ${on ? "on" : ""}`}
                  onClick={() => setPartyFilter(on ? "all" : p.id)}
                  title={p.nimi}
                  style={
                    on
                      ? {
                          background: `${p.vari}1f`,
                          borderColor: p.vari,
                          color: p.vari,
                        }
                      : undefined
                  }
                >
                  <span
                    className="party-chip-dot"
                    style={{ background: p.vari }}
                  />
                  <b>{p.lyhenne}</b>
                </button>
              );
            })}
          </div>
        </div>
        <div className="qb-filter-row">
          <span className="qb-filter-label">Aikaperspektiivi</span>
          <div className="qb-filter-chips">
            {AIKA_VALUES.map((v) => {
              const on = aikaFilter.has(v);
              return (
                <button
                  key={v}
                  type="button"
                  className={`qb-chip ${on ? "on" : ""}`}
                  onClick={() => toggleAika(v)}
                  aria-pressed={on}
                >
                  {AIKA_LABEL[v]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="qb-filter-row">
          <span className="qb-filter-label">Kattavuus</span>
          <div className="qb-filter-chips">
            {KATTAVUUS_VALUES.map((v) => {
              const on = kattavuusFilter.has(v);
              return (
                <button
                  key={v}
                  type="button"
                  className={`qb-chip qb-chip-${KATTAVUUS_BADGE[v]} ${on ? "on" : ""}`}
                  onClick={() => toggleKattavuus(v)}
                  aria-pressed={on}
                >
                  {KATTAVUUS_LABEL[v]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="qb-summary">
        Näytetään <b>{visible.length}</b> / {POLITICAL_QUESTIONS.length} kysymystä.
        {activeFilterCount > 0 ? (
          <button
            type="button"
            className="link-btn"
            onClick={resetAll}
            style={{ marginLeft: 10 }}
          >
            Tyhjennä suodattimet
          </button>
        ) : null}
      </div>

      <ul className="qb-list">
        {visible.map((q) => {
          const partyDots = q.esittäjät
            .map((id) => PARTIES.find((p) => p.id === id))
            .filter(Boolean);
          const isOpen = expanded.has(q.id);
          return (
            <li key={q.id} className={`qb-card ${isOpen ? "open" : ""}`}>
              <div
                className="qb-head"
                onClick={() => toggle(q.id)}
                role="button"
                tabIndex={0}
              >
                <div className="qb-head-main">
                  <div className="qb-title">
                    <span
                      className={`badge ${KATTAVUUS_BADGE[q.kattavuus]}`}
                      title="Kuinka hyvin sovellus voi vastata kysymykseen nykydatalla"
                    >
                      {KATTAVUUS_LABEL[q.kattavuus]}
                    </span>
                    <span>{q.otsikko}</span>
                  </div>
                  <div className="qb-meta">
                    <span className="qb-teema">{q.teema}</span>
                    <span className="qb-aika">
                      ⏱ {AIKA_LABEL[q.aikaperspektiivi]}
                    </span>
                    <span className="qb-parties">
                      {partyDots.map((p) =>
                        p ? (
                          <span
                            key={p.id}
                            className="qb-pdot"
                            style={{ background: p.vari }}
                            title={p.nimi}
                          >
                            {p.lyhenne}
                          </span>
                        ) : null
                      )}
                    </span>
                  </div>
                </div>
                <div className="qb-toggle">{isOpen ? "−" : "+"}</div>
              </div>

              {isOpen ? (
                <div className="qb-body">
                  <p className="qb-question">"{q.kysymys}"</p>
                  <div className="qb-actions">
                    <button
                      type="button"
                      className={`qb-explain-btn ${explained.has(q.id) ? "on" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExplain(q.id);
                      }}
                    >
                      {explained.has(q.id)
                        ? "− Sulje analyyttinen selitys"
                        : "💡 Selitä analyyttisesti — miksi puolueet näin?"}
                    </button>
                  </div>
                  {explained.has(q.id) ? (
                    <QuestionExplainer questionId={q.id} />
                  ) : null}
                  <div className="qb-grid">
                    <div>
                      <h4>Sovelluksen tarjoamat aineistot</h4>
                      {q.nykyiset.length ? (
                        <ul>
                          {q.nykyiset.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">
                          Ei vielä lähdettä sovelluksessa.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4>Mitä lisädataa tarvittaisiin</h4>
                      {q.puuttuvaData?.length ? (
                        <ul>
                          {q.puuttuvaData.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">
                          Nykydata riittää keskustelevalle vastaukselle.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4>Mistä sidosryhmät hakevat tietoa nyt</h4>
                      <ul>
                        {q.nykyisetLähteet.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                      {q.lähdeUrl ? (
                        <p>
                          <a
                            href={q.lähdeUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Avaa esimerkki ↗
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
