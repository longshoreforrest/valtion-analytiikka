import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PARTIES,
  PARTY_VALUES,
  VALUE_DIMENSIONS,
} from "../data/parties";
import { partyCoverage } from "../data/political_questions";
import PartyRadar from "../components/PartyRadar";
import DimensionFilter from "../components/DimensionFilter";
import PartyFilter from "../components/PartyFilter";
import PartyQuickFilter from "../components/PartyQuickFilter";
import PartySimilarity from "../components/PartySimilarity";
import PartyMap2D from "../components/PartyMap2D";
import PartyMap3D from "../components/PartyMap3D";
import StakeholderNetwork from "../components/StakeholderNetwork";
import PartyQuestionBank from "../components/PartyQuestionBank";
import CoalitionPCA from "../components/CoalitionPCA";
import CoalitionFriction from "../components/CoalitionFriction";
import CoalitionGoals from "../components/CoalitionGoals";

const TABS = [
  { id: "yleiskatsaus", label: "Yleiskatsaus" },
  { id: "edustajat", label: "Edustajat" },
  { id: "arvomalli", label: "Arvomalli (radar)" },
  { id: "samankaltaisuus", label: "Samankaltaisuus" },
  { id: "kartta2d", label: "2D-kartta" },
  { id: "kartta3d", label: "3D-kartta" },
  { id: "koalitio", label: "Koalitiosimulaattori" },
  { id: "sidosryhmat", label: "Sidosryhmät" },
  { id: "kysymykset", label: "Kysymyspankki" },
  { id: "vaikuttavuus", label: "Vaikuttavuus & vaalikaudet" },
  { id: "lahteet", label: "Lähteet ja varaukset" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function PoliittinenAnalyysi() {
  const [tab, setTab] = useState<TabId>("yleiskatsaus");
  const [selectedParties, setSelectedParties] = useState<string[]>([
    "kok",
    "ps",
    "sdp",
    "vihr",
  ]);
  const [highlightParty, setHighlightParty] = useState<string | undefined>(undefined);

  const togglePartySelection = (id: string) => {
    setSelectedParties((arr) =>
      arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
    );
  };

  return (
    <div>
      <div className="hero">
        <div className="hero-tags">
          <span className="hero-tag hero-tag-period">
            Vaalikausi 2023–2027
          </span>
          <span className="hero-tag hero-tag-snapshot">
            Tilannekuva: huhtikuu 2026
          </span>
        </div>
        <h1>Poliittinen analyysi</h1>
        <p className="lede">
          Suomen eduskuntapuolueet, niiden edustajat budjettineuvotteluissa,
          arvomalli ja sidosryhmäverkosto. Mukana kysymyspankki josta näet
          mihin puolueiden esittämiin kysymyksiin sovellus voi nyt vastata ja
          mihin tarvitaan lisädataa. Kaikki arviot ovat avoimesti perusteltuja
          ja lähdeviitattuja — ks. <a href="#lahteet" onClick={(e) => {
            e.preventDefault();
            setTab("lahteet");
          }}>Lähteet ja varaukset</a>.
        </p>
      </div>

      <div className="pa-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "yleiskatsaus" ? (
        <YleiskatsausTab
          onSelectParty={(id) => {
            setHighlightParty(id);
            setSelectedParties((arr) => arr.includes(id) ? arr : [...arr, id]);
            setTab("arvomalli");
          }}
          onGoToTab={setTab}
        />
      ) : null}

      {tab === "edustajat" ? <EdustajatTab /> : null}

      {tab === "arvomalli" ? (
        <ArvomalliTab
          selected={selectedParties}
          highlight={highlightParty}
          onToggleParty={togglePartySelection}
          onSetParties={setSelectedParties}
          onHighlight={setHighlightParty}
        />
      ) : null}

      {tab === "samankaltaisuus" ? (
        <SamankaltaisuusTab
          selectedParties={selectedParties}
          onCellClick={(a, b) => {
            setSelectedParties([a, b]);
            setHighlightParty(a);
            setTab("arvomalli");
          }}
          onGoToLahteet={() => setTab("lahteet")}
        />
      ) : null}

      {tab === "kartta2d" ? (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>2D-kartta valittavilla akseleilla</h2>
          <p className="lede">
            Suora projektio kahdelle valitulle dimensiolle. Pisteen koko
            kuvaa eduskuntapaikkojen määrää (2023 vaalit). Vaihda akseleita
            pudotusvalikoista.
          </p>
          <PartyMap2D />
          <div className="source-tag">
            <span>Lähde:</span> Sovelluksen oma arvomalli (perustuu
            puolueohjelmiin, vaalikoneisiin ja hallitusohjelmaan).
          </div>
        </div>
      ) : null}

      {tab === "kartta3d" ? (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>3D-kartta — kolme valittavaa ulottuvuutta</h2>
          <p className="lede">
            Valitse <b>kolme</b> arvomallin dimensiota X, Y ja Z -akseleille.
            Pyöritä näkymää klikkaamalla ja raahaamalla, käytä liukureita
            tai paina <b>"▶︎ Pyörittele"</b> nähdäksesi puolueiden sijainnin
            avaruudessa eri kuvakulmista. Pisteen koko kuvaa eduskunta-
            paikkamäärää; lähemmät pisteet näkyvät suurempina ja
            kirkkaampina.
          </p>
          <PartyMap3D />
          <div className="source-tag">
            <span>Lähde:</span> Sovelluksen oma arvomalli (perustuu
            puolueohjelmiin, vaalikoneisiin ja hallitusohjelmaan).
          </div>
        </div>
      ) : null}

      {tab === "koalitio" ? <KoalitioTab /> : null}

      {tab === "sidosryhmat" ? (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Sidosryhmäverkosto</h2>
          <p className="lede">
            Vasemmalla puolueet, oikealla budjettipolitiikkaan vaikuttavat
            sidosryhmät: työmarkkinajärjestöt, ajatuspajat, tutkimuslaitokset,
            valtion elimet ja kansainväliset toimijat. Klikkaa solmua
            korostaaksesi sen yhteydet. Käyttämättä jätetyt yhteydet eivät
            tarkoita että vaikutusta ei olisi — vain että se ei ole ensisijainen.
          </p>
          <StakeholderNetwork />
          <div className="source-tag">
            <span>Lähde:</span> Sidosryhmien omat kotisivut, hallituksen ohjelma,
            valiokuntakuulemiset.
          </div>
        </div>
      ) : null}

      {tab === "kysymykset" ? (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>
            Kysymyspankki — mihin sovellus voi vastata, mihin ei
          </h2>
          <p className="lede">
            Kuratoituja kysymyksiä joita puolueiden edustajat tyypillisesti
            esittävät valtion budjetista. Kullakin kysymyksellä on{" "}
            <b className="badge success">Kattaa</b>,{" "}
            <b className="badge warn">Osittain</b> tai{" "}
            <b className="badge danger">Puuttuu</b> -merkintä joka kertoo
            voiko sovellus vastata nykydatalla. Tämä toimii myös{" "}
            <b>katvealueiden listana</b> tulevaa keskustelevaa AI-analytiikkaa
            varten — "puuttuu"-merkityt kysymykset tarvitsevat lisädataa.
          </p>
          <PartyQuestionBank />
        </div>
      ) : null}

      {tab === "vaikuttavuus" ? <VaikuttavuusTab /> : null}

      {tab === "lahteet" ? <LahteetTab /> : null}
    </div>
  );
}

function YleiskatsausTab({
  onSelectParty,
  onGoToTab,
}: {
  onSelectParty: (id: string) => void;
  onGoToTab: (id: TabId) => void;
}) {
  const sorted = useMemo(
    () => [...PARTIES].sort((a, b) => b.paikat - a.paikat),
    []
  );
  const [filterParties, setFilterParties] = useState<string[]>(() =>
    PARTIES.map((p) => p.id)
  );
  const filterSet = useMemo(() => new Set(filterParties), [filterParties]);
  const visible = sorted.filter((p) => filterSet.has(p.id));

  const introCards: Array<{
    tab: TabId;
    otsikko: string;
    kuvaus: string;
    icon: string;
  }> = [
    {
      tab: "edustajat",
      otsikko: "Edustajat",
      kuvaus:
        "Kuka neuvottelee budjetista? Puolueiden puheenjohtajat, eduskuntaryhmäjohtajat ja keskeiset valiokuntavaikuttajat.",
      icon: "👥",
    },
    {
      tab: "arvomalli",
      otsikko: "Arvomalli (radar)",
      kuvaus:
        "12-akselinen tutkakaavio, joka näyttää puolueiden talous-, sosiaali- ja arvopainotukset 0–10 -asteikolla. Jokainen pistearvo on lähdeviitattu.",
      icon: "🎯",
    },
    {
      tab: "samankaltaisuus",
      otsikko: "Samankaltaisuus",
      kuvaus:
        "Kosini-similariteetin matriisi: kuka on lähellä kenenkin arvomallia ja missä on suurimmat erot.",
      icon: "🔗",
    },
    {
      tab: "kartta2d",
      otsikko: "2D- ja 3D-kartta",
      kuvaus:
        "Sijoita puolueet kahdelle tai kolmelle valittavalle ulottuvuudelle. 3D-näkymää voi pyörittää.",
      icon: "🌐",
    },
    {
      tab: "sidosryhmat",
      otsikko: "Sidosryhmät",
      kuvaus:
        "Etujärjestöt, ajatuspajat, tutkimuslaitokset ja niiden yhteydet puolueisiin. Klikkaa viivaa nähdäksesi yhteyden tyypin ja lähteen.",
      icon: "🕸️",
    },
    {
      tab: "kysymykset",
      otsikko: "Kysymyspankki",
      kuvaus:
        "20 tyypillistä kysymystä joita puolueet esittävät budjetista. Jokainen on merkitty: kattaako sovellus vastauksen, vai tarvitaanko lisädataa.",
      icon: "❓",
    },
    {
      tab: "vaikuttavuus",
      otsikko: "Vaikuttavuus & vaalikaudet",
      kuvaus:
        "Yli vaalikauden menevät kysymykset (velka, väestö, ilmasto) ja politiikkatoimien vaikuttavuusarvioinnin lähteet.",
      icon: "📈",
    },
    {
      tab: "lahteet",
      otsikko: "Lähteet ja varaukset",
      kuvaus:
        "Mihin lähteisiin arvomalli perustuu, ja mitä rajoituksia mallin tulkintaan liittyy. Päivitysrytmi.",
      icon: "📚",
    },
  ];

  return (
    <div>
      <div className="panel intro-panel">
        <h2 style={{ marginTop: 0 }}>Mistä tässä on kyse?</h2>
        <p>
          <b>Poliittinen analyysi</b> -osio kokoaa yhteen Suomen
          eduskuntapuolueet, niiden edustajat budjettineuvotteluissa,
          arvopainotusten mallin sekä keskeisimmät kysymykset joita puolueet
          esittävät valtion budjetille. Tarkoituksena on, että <b>poliitikko,
          toimittaja, virkamies tai tutkija</b> löytää nopeasti vastauksen
          siihen <i>kuka, mitä ja miksi</i> nykyisessä budjettikeskustelussa —
          ja näkee mihin sovellus voi datan perusteella vastata ja mihin
          tarvitaan lisätietoa.
        </p>
        <p>
          Kaikki arviot pohjautuvat avoimiin lähteisiin (puolueohjelmat,
          hallitusohjelma, vaalikoneet 2023, vaihtoehtobudjetit) ja jokainen
          pistearvo on yksilöllisesti perusteltu lähdeviitteellä. Malli
          edustaa <b>tilannekuvaa huhtikuu 2026</b> ja päivittyy
          eduskuntavaalien sekä uusien hallitusohjelmien myötä.
        </p>
        <h3 style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--fg-dim)",
          fontWeight: 700,
          margin: "20px 0 10px",
        }}>
          Selaa osioita
        </h3>
        <div className="intro-cards">
          {introCards.map((c) => (
            <button
              key={c.tab}
              type="button"
              className="intro-card"
              onClick={() => onGoToTab(c.tab)}
            >
              <div className="intro-card-icon">{c.icon}</div>
              <div className="intro-card-title">{c.otsikko}</div>
              <div className="intro-card-desc">{c.kuvaus}</div>
              <div className="intro-card-cta">Avaa →</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Eduskuntapuolueet 2023–2027</h2>
        <p>
          Kahdeksan eduskuntapuoluetta + Liike Nyt. Hallituksessa{" "}
          <b>Kokoomus, Perussuomalaiset, RKP, KD</b>; oppositiossa loput.
          Klikkaa puoluekorttia avataksesi sen arvoprofiilin radar-näkymässä.
        </p>
        <PartyQuickFilter
          selected={filterParties}
          onChange={setFilterParties}
          rightHint="Tilannekuva huhtikuu 2026"
        />
      </div>
      <div className="party-cards">
        {visible.map((p) => {
          const cov = partyCoverage(p.id);
          return (
            <button
              key={p.id}
              className="party-card"
              onClick={() => onSelectParty(p.id)}
            >
              <div
                className="party-card-bar"
                style={{ background: p.vari }}
              />
              <div className="party-card-head">
                <span
                  className="party-card-letter"
                  style={{ background: p.vari }}
                >
                  {p.lyhenne[0]}
                </span>
                <div>
                  <div className="party-card-title">{p.nimi}</div>
                  <div className="party-card-sub">
                    {p.lyhenne} · {p.paikat} paikkaa ·{" "}
                    <span
                      className={`badge ${p.lohko === "hallitus" ? "success" : "muted"}`}
                    >
                      {p.lohko}
                    </span>
                  </div>
                </div>
              </div>
              <p className="party-card-desc">{p.kuvaus}</p>
              <div className="party-card-coverage">
                <span title="Sovellus voi vastata kysymyksiin">
                  ✓ {cov.kattaa}
                </span>
                <span title="Osittain vastattavissa">
                  ◐ {cov.osittain}
                </span>
                <span title="Tarvitsee lisädataa">
                  ✗ {cov.puuttuu}
                </span>
                <span className="party-card-coverage-label">
                  {cov.total} kysymystä
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EdustajatTab() {
  const [filterParties, setFilterParties] = useState<string[]>(() =>
    PARTIES.map((p) => p.id)
  );
  const filterSet = useMemo(() => new Set(filterParties), [filterParties]);
  const visible = PARTIES.filter((p) => filterSet.has(p.id));
  return (
    <div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Edustajat budjettineuvotteluissa</h2>
        <p className="lede">
          Kuhunkin puolueeseen on listattu keskeiset henkilöt jotka osallistuvat
          budjetin valmisteluun ja eduskuntakäsittelyyn. Listat eivät ole
          tyhjentäviä; käytännön työtä tekee laajempi verkosto avustajia,
          virkamiehiä ja eduskuntaryhmän asiantuntijoita.
        </p>
        <PartyQuickFilter
          selected={filterParties}
          onChange={setFilterParties}
          rightHint="Tilannekuva huhtikuu 2026"
        />
      </div>
      <div className="grid cols-2">
        {visible.map((p) => (
          <div key={p.id} className="panel">
            <div className="edustaja-head">
              <span
                className="party-card-letter"
                style={{ background: p.vari }}
              >
                {p.lyhenne[0]}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {p.nimi}
                </div>
                <div className="muted">
                  {p.lyhenne} · {p.paikat} paikkaa ·{" "}
                  <span
                    className={`badge ${p.lohko === "hallitus" ? "success" : "muted"}`}
                  >
                    {p.lohko}
                  </span>
                </div>
              </div>
            </div>
            <table className="data" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Rooli</th>
                  <th>Henkilö</th>
                </tr>
              </thead>
              <tbody>
                {p.edustajat.map((e) => (
                  <tr key={e.nimi}>
                    <td>
                      {e.rooli}
                      {e.budjettirooli ? (
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          {e.budjettirooli}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <b>{e.nimi}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="source-tag">
              <a href={p.kotisivu} target="_blank" rel="noreferrer">
                Kotisivu ↗
              </a>{" "}
              ·{" "}
              <a href={p.ohjelmaUrl} target="_blank" rel="noreferrer">
                Ohjelma ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArvomalliTab({
  selected,
  highlight,
  onToggleParty,
  onSetParties,
  onHighlight,
}: {
  selected: string[];
  highlight: string | undefined;
  onToggleParty: (id: string) => void;
  onSetParties: (next: string[]) => void;
  onHighlight: (id: string | undefined) => void;
}) {
  const [showDimDetail, setShowDimDetail] = useState<string | null>(null);
  const [activeDimensions, setActiveDimensions] = useState<string[]>(() =>
    VALUE_DIMENSIONS.map((d) => d.id)
  );

  // Jos käyttäjä piilottaa juuri sen dimension, jonka detalji on auki, suljetaan paneeli.
  const dimDetailVisible =
    showDimDetail && activeDimensions.includes(showDimDetail);
  const dim = dimDetailVisible
    ? VALUE_DIMENSIONS.find((d) => d.id === showDimDetail)
    : null;

  return (
    <div className="arvomalli-layout">
      <div className="panel arvomalli-radar-panel">
        <h2 style={{ marginTop: 0 }}>Arvomallin radar</h2>
        <p className="lede">
          Asteikko 0–10. Klikkaa radarin akselia nähdäksesi sen tulkinnan ja
          puolueiden perustelut. Puolue- ja dimensiosuodattimet löytyvät
          oikealta sivupaneelista.
        </p>
        <PartyRadar
          selected={selected}
          highlight={highlight}
          onDimensionClick={(id) => setShowDimDetail(id)}
          dimensionIds={activeDimensions}
        />
        <div className="source-tag">
          <span>Lähde:</span> Sovelluksen oma arvomalli — pisteet perustuvat
          julkisiin puolueohjelmiin, hallitusohjelmaan, vaalikoneisiin ja
          puolueiden vaihtoehtobudjetteihin. Yksinkertaistus, jonka
          tarkoitus on havainnollistaa eroja.
        </div>
        {dim ? (
          <div className="dim-detail">
            <h3>{dim.nimi}</h3>
            <p className="lede" style={{ marginBottom: 8 }}>
              <b>0:</b> {dim.matala} <br />
              <b>10:</b> {dim.korkea}
            </p>
            <p className="muted">
              Kytkös sovelluksen näkymiin: {dim.kytkeytyy}
            </p>
            <table className="data">
              <thead>
                <tr>
                  <th>Puolue</th>
                  <th>Arvo</th>
                  <th>Perustelu ja lähde</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((pid) => {
                  const p = PARTIES.find((x) => x.id === pid)!;
                  const score = PARTY_VALUES[pid]?.[dim.id];
                  if (!score) return null;
                  return (
                    <tr key={pid}>
                      <td>
                        <span
                          className="party-toggle-dot"
                          style={{ background: p.vari }}
                        />{" "}
                        {p.lyhenne}
                      </td>
                      <td className="num">{score.arvo}</td>
                      <td>
                        {score.perustelu}
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          {score.lähdeUrl ? (
                            <a
                              href={score.lähdeUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {score.lähde} ↗
                            </a>
                          ) : (
                            score.lähde
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      <aside className="arvomalli-side">
        <div className="panel arvomalli-side-panel">
          <h3 className="side-h">Puolueet radarissa</h3>
          <PartyQuickFilter
            selected={selected}
            onChange={onSetParties}
          />
          <div className="party-toggle-chips" style={{ marginTop: 10 }}>
            {PARTIES.map((p) => {
              const on = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`party-toggle-chip ${on ? "on" : ""}`}
                  onClick={() => onToggleParty(p.id)}
                  onMouseEnter={() => on && onHighlight(p.id)}
                  onMouseLeave={() => onHighlight(undefined)}
                  title={p.nimi}
                  aria-pressed={on}
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
                    className="party-toggle-dot"
                    style={{ background: p.vari }}
                  />
                  <b>{p.lyhenne}</b>
                </button>
              );
            })}
          </div>
          <div className="side-quick">
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                selected.length === PARTIES.length
                  ? onSetParties([])
                  : onSetParties(PARTIES.map((p) => p.id))
              }
            >
              {selected.length === PARTIES.length
                ? "Tyhjennä"
                : "Valitse kaikki"}
            </button>
          </div>
        </div>
        <div className="panel arvomalli-side-panel">
          <h3 className="side-h">Dimensiot radarissa</h3>
          <DimensionFilter
            selected={activeDimensions}
            onChange={setActiveDimensions}
          />
        </div>
      </aside>
    </div>
  );
}

function SamankaltaisuusTab({
  selectedParties,
  onCellClick,
  onGoToLahteet,
}: {
  selectedParties: string[];
  onCellClick: (a: string, b: string) => void;
  onGoToLahteet: () => void;
}) {
  // Oletuksena kaikki puolueet, mutta kaikki radarissa olevat lisätään
  // automaattisesti — sopiva oletus kun käyttäjä siirtyy radarista tänne.
  const [included, setIncluded] = useState<string[]>(() => {
    const set = new Set([...PARTIES.map((p) => p.id)]);
    selectedParties.forEach((p) => set.add(p));
    return PARTIES.filter((p) => set.has(p.id)).map((p) => p.id);
  });

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>Puolueiden välinen samankaltaisuus</h2>
      <p className="lede">
        Kosini-similariteetti puolueiden arvomalleista (12 dimensiota).
        Asteikko –1…+1: <b>+1</b> = hyvin samankaltaiset arvopainotukset,{" "}
        <b>0</b> = ortogonaaliset (eri akseleilla),{" "}
        <b>–1</b> = vastakkaiset. Rajaa puolueet alla suodattimella —
        klikkaa solua avataksesi kaksi puoluetta vertailuna radarissa.
      </p>
      <PartyFilter
        selected={included}
        onChange={setIncluded}
        label="Mukana matriisissa"
      />
      <PartySimilarity onCellClick={onCellClick} partyIds={included} />
      <div className="source-tag">
        <span>Lähde:</span> Tämän sovelluksen arvomalli (ks.{" "}
        <a
          href="#lahteet"
          onClick={(e) => {
            e.preventDefault();
            onGoToLahteet();
          }}
        >
          Lähteet ja varaukset
        </a>
        ). Kahden puolueen vektorien välinen kosini, keskitettynä asteikon
        keskiarvoon (5).
      </div>
    </div>
  );
}

function KoalitioTab() {
  const [parties, setParties] = useState<string[]>(() =>
    PARTIES.filter((p) => p.lohko === "hallitus").map((p) => p.id)
  );
  const [view, setView] = useState<"pca" | "friction" | "goals">("pca");

  return (
    <div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Koalitiosimulaattori</h2>
        <p className="lede">
          Valitse puoluejoukko ja katso miten ne sijoittuvat suhteessa
          toisiinsa <b>PCA-projektiossa</b>, missä <b>"kenkä puristaa"</b>{" "}
          dimensiokohtaisesti, ja kuinka kaukana joukko on annetusta
          <b> tavoiteohjelmasta</b>. Kuin dynaaminen hallitusneuvottelija —
          koe miten valinta vaikuttaa ristivetoon reaaliajassa.
        </p>
        <PartyQuickFilter
          selected={parties}
          onChange={setParties}
          rightHint="Tilannekuva huhtikuu 2026"
        />
        <PartyFilter
          selected={parties}
          onChange={setParties}
          label="Mukana koalitiossa"
          presets={false}
        />
      </div>

      <div className="panel">
        <div className="koalitio-subtabs">
          <button
            type="button"
            className={view === "pca" ? "active" : ""}
            onClick={() => setView("pca")}
          >
            🧭 PCA-projektio
          </button>
          <button
            type="button"
            className={view === "friction" ? "active" : ""}
            onClick={() => setView("friction")}
          >
            ⚖️ Konsensus & ristiveto
          </button>
          <button
            type="button"
            className={view === "goals" ? "active" : ""}
            onClick={() => setView("goals")}
          >
            ⌖ Tavoiteohjelma
          </button>
        </div>

        {view === "pca" ? (
          <>
            <h3 style={{ marginTop: 16 }}>
              Mihin suuntaan puolueet asettuvat?
            </h3>
            <p className="lede">
              PCA (pääkomponenttianalyysi) löytää kaksi suuntaa, joissa
              juuri tämä puoluejoukko eroaa eniten — akselien tulkinnat
              näkyvät oikealla.
            </p>
            <CoalitionPCA partyIds={parties} />
          </>
        ) : null}

        {view === "friction" ? (
          <>
            <h3 style={{ marginTop: 16 }}>Missä kenkä puristaa?</h3>
            <p className="lede">
              Dimensiot järjestetty hajonnan (std) mukaan. Punaiset =
              suurin ristiveto, keltaiset = osittainen erimielisyys,
              vihreät = vahva konsensus.
            </p>
            <CoalitionFriction partyIds={parties} />
          </>
        ) : null}

        {view === "goals" ? (
          <>
            <h3 style={{ marginTop: 16 }}>
              Hallitusohjelma-tavoitteet & ristiveto
            </h3>
            <p className="lede">
              Aseta jokaiselle dimensiolle tavoitearvo (0–10) liukurilla
              tai valitse valmis ohjelmamalli. Näet etäisyyden tavoitteesta
              puolueittain ja missä ristiveto on suurinta.
            </p>
            <CoalitionGoals partyIds={parties} />
          </>
        ) : null}
      </div>
      <div className="source-tag">
        <span>Lähde:</span> Sovelluksen oma arvomalli (12 dimensiota,
        pisteet 0–10). PCA-akselit lasketaan juuri valitulle puoluejoukolle —
        ne eivät ole absoluuttisia. Tavoiteohjelman pisteet on käyttäjän
        asetettavissa.
      </div>
    </div>
  );
}

function VaikuttavuusTab() {
  return (
    <div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>
          Vaalikauden yli menevät kysymykset ja politiikkatoimien vaikuttavuus
        </h2>
        <p className="lede">
          Eduskunnan nelivuotinen sykli tuottaa poliittista kannustinta
          lyhyen aikavälin näkyvyyteen, mutta julkisen talouden suuret
          kysymykset (velka, väestö, ilmasto, sote-rakenne) ratkeavat vasta
          useamman vaalikauden aikana. Tällä sivulla nostetaan esiin niitä
          kysymyksiä joita sovellus voisi tukea kun datapohjaa täydennetään.
        </p>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Mitä on "vaikuttavuusarviointi"?</h3>
        <p>
          Vaikuttavuusarviointi (impact evaluation) selvittää onko jokin
          politiikkatoimi <b>tosiasiallisesti aiheuttanut</b> tavoitellun
          muutoksen. Se vaatii rinnalleen vertailuasetelman (joko aiemman
          trendin, vertailumaan tai vertailuryhmän), aikasarjadataa
          indikaattoreista ennen ja jälkeen toimen, sekä luotettavan
          lähtökohdan toimenpiteen ajoittamisesta.
        </p>
        <p>
          Sovelluksen nykytila tukee vaikuttavuusarviointia osittain: meillä on
          rivitasoinen budjettidata 2014→ ja julkisen talouden tilinpito
          1975→. Päätösmuutosten kytkeminen indikaattoreihin (PISA, Sotkanet,
          Tilastokeskuksen tulonjako) vaatii kuitenkin ulkoisen aineiston
          tuomista — listattuna alla.
        </p>
      </div>

      <div className="grid cols-2">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Yli vaalikauden meneviä teemoja</h3>
          <ul>
            <li>
              <b>Velkasuhde ja korkomenot</b> — 4–8 vuoden ura, herkkä
              korkojen muutoksille. Sovellus näyttää historian; ennusteet
              vaativat JTS:n ja Suomen Pankin oletukset.
            </li>
            <li>
              <b>Väestönmuutos ja sote-rahoitus</b> — palvelutarve kasvaa
              ikääntymisen myötä; rahoitusmalli on poliittisesti haastava
              jokaisella hallituksella.
            </li>
            <li>
              <b>Hiilineutraalisuustavoite 2035</b> — vaatii useamman
              hallituksen yhdensuuntaista politiikkaa; toimenpiteiden
              vaikuttavuusarviointi vasta kehittymässä.
            </li>
            <li>
              <b>Eläkejärjestelmän kestävyys</b> — eläkemenot kasvavat
              vuosikymmeniä, vaatii pitkän aikavälin sopimuksia.
            </li>
            <li>
              <b>Koulutusketjun rahoitus</b> — varhaiskasvatus → korkeakoulu,
              vaikutukset näkyvät vasta sukupolvien yli.
            </li>
            <li>
              <b>Puolustusbudjetin 2 % BKT -taso</b> — sitoutuminen NATO-
              jäsenenä, vaikutukset sopeutuksen muihin osiin.
            </li>
          </ul>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Lupausten ja toteumien linja</h3>
          <p>
            "Onko hallitus tehnyt mitä lupasi?" on kysymys joka edellyttää
            kolmea aineistoa rinnakkain:
          </p>
          <ol>
            <li>
              <b>Hallitusohjelma</b> — strukturoituina tavoitteina ja
              kärkihankkeina (sovelluksessa raakana PDF:nä, tarvittaisiin
              kaivettava indikaattorikartta).
            </li>
            <li>
              <b>Talousarvio</b> — momentit ja määrärahat vuosittain (✓ on
              sovelluksessa).
            </li>
            <li>
              <b>Toteuma</b> — Valtiokonttorin Talous-API kun saadaan
              käyttöön (status:{" "}
              <Link to="/lahteet#valtiokonttori-talous">
                vaatii selvitystä
              </Link>
              ).
            </li>
          </ol>
          <p>
            Kun kaikki kolme yhdistyvät rivitasolla, sovellus voi näyttää
            kuinka <i>tavoite → momentti → toteuma</i> -ketju toteutuu.
            Tämä on edellytys puolueriippumattomalle vaikuttavuusarvioinnille.
          </p>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>
          Mistä sidosryhmät hakevat vaikuttavuustiedon nyt
        </h3>
        <ul>
          <li>
            <a
              href="https://www.talouspolitiikanarviointineuvosto.fi/"
              target="_blank"
              rel="noreferrer"
            >
              Talouspolitiikan arviointineuvosto
            </a>{" "}
            — vuosittainen arvio talouspolitiikan toimivuudesta
          </li>
          <li>
            <a href="https://www.vtv.fi" target="_blank" rel="noreferrer">
              Valtiontalouden tarkastusvirasto (VTV)
            </a>{" "}
            — tuloksellisuustarkastukset
          </li>
          <li>
            <a href="https://vatt.fi" target="_blank" rel="noreferrer">
              VATT — Valtion taloudellinen tutkimuskeskus
            </a>{" "}
            — vaikuttavuusarvioinnit ja mikrosimuloinnit
          </li>
          <li>
            <a
              href="https://valtioneuvosto.fi/julkaisut"
              target="_blank"
              rel="noreferrer"
            >
              Valtioneuvoston kanslian (VNK) tutkimustoiminta (TEAS / VN-TEAS)
            </a>{" "}
            — tutkimukset päätöksenteon tueksi
          </li>
          <li>
            <a
              href="https://www.eduskunta.fi/FI/lakiensaataminen/valiokunnat/tarkastusvaliokunta/Sivut/default.aspx"
              target="_blank"
              rel="noreferrer"
            >
              Eduskunnan tarkastusvaliokunta
            </a>{" "}
            — eduskunnan käsittelyssä olevat tilivelvollisuusasiat
          </li>
          <li>
            <a
              href="https://www.oecd.org/finland/"
              target="_blank"
              rel="noreferrer"
            >
              OECD Finland
            </a>{" "}
            — kahden vuoden välein Suomen talouspoliittinen arvio
          </li>
        </ul>
      </div>
    </div>
  );
}

function LahteetTab() {
  return (
    <div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }} id="lahteet">
          Lähteet ja varaukset
        </h2>
        <p className="lede">
          Tämä osio dokumentoi mistä poliittisen analyysin sisältö on
          johdettu, ja mitä rajoituksia sen tulkintaan liittyy.
        </p>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Arvomallin lähteet</h3>
        <ul>
          <li>
            <b>Hallitusohjelma 20.6.2023</b> — Pääministeri Petteri Orpon
            hallituksen ohjelma "Vahva ja välittävä Suomi".{" "}
            <a
              href="https://valtioneuvosto.fi/hallitusohjelma"
              target="_blank"
              rel="noreferrer"
            >
              valtioneuvosto.fi/hallitusohjelma ↗
            </a>
          </li>
          <li>
            <b>YLE Vaalikone 2023</b> — eduskuntavaalien vaalikone, joka
            sisältää puolueiden viralliset linjaukset noin 30 kysymykseen.{" "}
            <a
              href="https://yle.fi/uutiset/3-12793333"
              target="_blank"
              rel="noreferrer"
            >
              yle.fi/uutiset/3-12793333 ↗
            </a>
          </li>
          <li>
            <b>HS Vaalikone 2023</b> — Helsingin Sanomien vaalikoneen
            kysymykset.
          </li>
          <li>
            <b>Puolueiden vaihtoehtobudjetit 2024–2025</b> — oppositiopuolueet
            julkaisevat vuosittaisen vaihtoehtobudjettinsa, josta löytyy
            tarkennetut talouslinjaukset.
          </li>
          <li>
            <b>Puolueiden viralliset ohjelmat</b> — pitkän aikavälin
            puolueohjelmat, talouspolitiikkaohjelmat, ilmasto-ohjelmat.
            Linkit löytyvät Edustajat-välilehdeltä.
          </li>
          <li>
            <b>Kehysriihi 22.–23.4.2026</b> — viimeisin julkisen talouden
            suunnitelman (JTS) päivitys ja puolueiden välittömät reaktiot.
            Ks.{" "}
            <Link to="/paivitykset/2026-04-kehysriihi">
              Päivitykset → Kehysriihi 2026
            </Link>
            .
          </li>
        </ul>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Mitä arvomalli ei ole</h3>
        <ul>
          <li>
            <b>Ei tieteellinen mittaus.</b> Pisteet (0–10) ovat tulkintoja
            puolueiden julkisista linjauksista, eivät ekonometrisesti
            johdettuja arvoja. Eri tutkijat ja äänestäjät voivat perustellusti
            antaa eri pisteitä.
          </li>
          <li>
            <b>Ei seuraa puolueen sisäistä variaatiota.</b> Puolueissa on
            siipiä ja yksittäisiä kansanedustajia jotka eroavat puolueen
            virallisesta linjasta. Pisteet kuvaavat puolueen valtavirtaa.
          </li>
          <li>
            <b>Ei ennusta käyttäytymistä koalitioneuvotteluissa.</b>{" "}
            Hallituksessa puolue voi joutua tinkimään linjastaan tai päinvastoin
            saa läpi ydinasioita.
          </li>
          <li>
            <b>Aikariippuvainen.</b> Puolueiden linjaukset muuttuvat ajan
            myötä. Tämä malli on tilannekuva 2024–2026.
          </li>
        </ul>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Sidosryhmäkartan rajaukset</h3>
        <p>
          "Lähinnä puoluetta" -kytkös ei tarkoita että sidosryhmä toimisi
          puolueen alaisuudessa tai että muiden puolueiden vaikutus puuttuisi.
          Karttaa kannattaa lukea heuristisena oppaana siihen kenen aineistoja
          ja näkemyksiä eri puolueiden edustajat tyypillisesti käyttävät
          argumentaationsa tukena. Esim. EVA tuottaa raportteja koko
          eduskunnan käyttöön mutta sen kehys on liiketoimintapohjainen.
        </p>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Päivitysrytmi</h3>
        <p>
          Tämä mallidata on tarkoitus päivittää vähintään seuraavissa
          tilanteissa:
        </p>
        <ul>
          <li>
            Eduskuntavaalien jälkeen (uudet paikat, uudet puolueet, mahdollinen
            koalition vaihto)
          </li>
          <li>
            Hallitusohjelman julkaisu — käännetään uudet linjaukset arvomallin
            pisteiksi
          </li>
          <li>
            Vuosittaisen kehysriihen jälkeen — arvioidaan onko hallituspuolueiden
            linja siirtynyt aiotusta
          </li>
          <li>
            Puolueiden uusien strategisten ohjelmien julkaisun yhteydessä
          </li>
        </ul>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Suositeltu jatkokehitys</h3>
        <ol>
          <li>
            <b>Vaalikoneen vastaukset suoraan</b> — automatisoitu lataus
            YLE:n ja HS:n vaalikoneista, jolloin pisteet voidaan johtaa
            mekanismilla
          </li>
          <li>
            <b>Puolueiden vaihtoehtobudjetit datasarjana</b> — momentti-
            tasoisia muutoksia per puolue per vuosi
          </li>
          <li>
            <b>Ääntenkirjausanalyysi</b> — Eduskunnan äänestysrekisteristä
            voidaan johtaa puolueiden tosiasialliset etäisyydet
            valiokuntapäätöksissä (toinen mittaus arvomallille)
          </li>
          <li>
            <b>Keskusteleva analytiikka (LLM)</b> — kun arvomalli, kysymyspankki
            ja budjettidata ovat samassa rajapinnassa, käyttäjä voi kysyä
            "Mikä KOK:n vaihtoehto SDP:lle on koulutuksen rahoituksessa?" ja
            saada lähdeviitatun vastauksen.
          </li>
        </ol>
      </div>
    </div>
  );
}
