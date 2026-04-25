import { useMemo, useState } from "react";
import { PARTIES } from "../data/parties";
import { STAKEHOLDERS } from "../data/stakeholders";
import {
  getConnection,
  CONNECTION_TYPE_LABEL,
} from "../data/stakeholder_connections";

/**
 * Bipartite-verkko jossa vasemmalla puolueet ja oikealla sidosryhmät.
 *
 * Dynaamiset suodattimet:
 *  - Sidosryhmätyyppi (chip-lista, monivalinta)
 *  - Puolueet (chip-lista)
 *  - Sidosryhmähaku — kompakti lista jonka kautta voi valita yksittäisen
 *    sidosryhmän tarkasteluun
 *
 * Klikkaa viivaa → oikea sivupaneeli näyttää yhteyden tyypin,
 * kuvauksen ja lähdeviitteen.
 */
export default function StakeholderNetwork() {
  const allTypes = useMemo(
    () => Array.from(new Set(STAKEHOLDERS.map((s) => s.tyyppi))),
    []
  );

  const [highlight, setHighlight] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(allTypes)
  );
  const [selectedParties, setSelectedParties] = useState<Set<string>>(
    () => new Set(PARTIES.map((p) => p.id))
  );
  const [searchQ, setSearchQ] = useState("");
  const [activeLink, setActiveLink] = useState<{
    partyId: string;
    stakeholderId: string;
  } | null>(null);
  const [focusStakeholder, setFocusStakeholder] = useState<string | null>(null);

  const visibleStakeholders = useMemo(() => {
    let arr = STAKEHOLDERS.filter((s) => selectedTypes.has(s.tyyppi));
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          s.nimi.toLowerCase().includes(q) ||
          s.kuvaus.toLowerCase().includes(q) ||
          s.tyyppi.toLowerCase().includes(q)
      );
    }
    if (focusStakeholder) {
      arr = arr.filter((s) => s.id === focusStakeholder);
    }
    return arr;
  }, [selectedTypes, searchQ, focusStakeholder]);

  const visibleParties = useMemo(() => {
    return PARTIES.filter((p) => selectedParties.has(p.id));
  }, [selectedParties]);

  const toggleType = (t: string) => {
    setSelectedTypes((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };
  const toggleParty = (pid: string) => {
    setSelectedParties((s) => {
      const n = new Set(s);
      if (n.has(pid)) n.delete(pid);
      else n.add(pid);
      return n;
    });
  };

  // SVG-mittasuhteet — annetaan oikealle reilusti tilaa että nimet mahtuvat
  const stakeLabelW = 220;
  const partyW = 110;
  const w = 220 + stakeLabelW + 480; // ~920 oletuksena
  const partyH = 36;
  const stakeH = 26;
  const partyTopY = 50;
  const stakeTopY = 50;
  const leftX = partyW + 20; // puolueiden oikea reuna
  const rightX = w - stakeLabelW - 20; // viivan loppupiste oikealla
  const partyHeight = visibleParties.length * partyH + partyTopY + 30;
  const stakeHeight = visibleStakeholders.length * stakeH + stakeTopY + 30;
  const h = Math.max(partyHeight, stakeHeight, 320);

  const partyPos = (i: number) => ({
    x: leftX,
    y: partyTopY + i * partyH,
  });
  const stakePos = (i: number) => ({
    x: rightX,
    y: stakeTopY + i * stakeH,
  });

  const links = useMemo(() => {
    const arr: Array<{ partyId: string; stakeholderId: string }> = [];
    visibleParties.forEach((p) => {
      visibleStakeholders.forEach((s) => {
        if (s.lähinPuolueita.includes(p.id))
          arr.push({ partyId: p.id, stakeholderId: s.id });
      });
    });
    return arr;
  }, [visibleParties, visibleStakeholders]);

  const isHighlighted = (id: string) => {
    if (!highlight) return true;
    if (highlight === id) return true;
    if (PARTIES.some((p) => p.id === highlight)) {
      const s = STAKEHOLDERS.find((s) => s.id === id);
      return s?.lähinPuolueita.includes(highlight) ?? false;
    } else {
      const s = STAKEHOLDERS.find((s) => s.id === highlight);
      return s?.lähinPuolueita.includes(id) ?? false;
    }
  };

  const isLinkActive = (l: { partyId: string; stakeholderId: string }) => {
    if (highlight) {
      if (highlight !== l.partyId && highlight !== l.stakeholderId) return false;
    }
    return true;
  };

  const isLinkSelected = (l: { partyId: string; stakeholderId: string }) =>
    activeLink?.partyId === l.partyId &&
    activeLink?.stakeholderId === l.stakeholderId;

  const selectedDetails = activeLink
    ? {
        party: PARTIES.find((p) => p.id === activeLink.partyId),
        stakeholder: STAKEHOLDERS.find((s) => s.id === activeLink.stakeholderId),
        connection: getConnection(activeLink.stakeholderId, activeLink.partyId),
      }
    : null;

  const focusedStake = focusStakeholder
    ? STAKEHOLDERS.find((s) => s.id === focusStakeholder)
    : null;

  // Hakulistan sidosryhmät: kaikki tyypeistä huolimatta jotka osuvat hakuun
  const searchListStakeholders = useMemo(() => {
    let arr = [...STAKEHOLDERS];
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          s.nimi.toLowerCase().includes(q) ||
          s.kuvaus.toLowerCase().includes(q) ||
          s.tyyppi.toLowerCase().includes(q)
      );
    }
    return arr.sort((a, b) => a.nimi.localeCompare(b.nimi, "fi"));
  }, [searchQ]);

  return (
    <div className="stakeholder-network">
      <div className="stakeholder-filters">
        <div className="stakeholder-filter-row">
          <span className="dim-filter-label">
            Sidosryhmätyyppi
            <span className="dim-counter">
              {selectedTypes.size} / {allTypes.length}
            </span>
          </span>
          <div className="dim-filter-chips">
            {allTypes.map((t) => {
              const on = selectedTypes.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  className={`dim-chip ${on ? "on" : ""}`}
                  onClick={() => toggleType(t)}
                  aria-pressed={on}
                >
                  <span className="dim-chip-tick" aria-hidden="true">
                    {on ? "✓" : "+"}
                  </span>
                  {t}
                </button>
              );
            })}
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                setSelectedTypes(
                  selectedTypes.size === allTypes.length
                    ? new Set()
                    : new Set(allTypes)
                )
              }
              style={{ marginLeft: 4 }}
            >
              {selectedTypes.size === allTypes.length
                ? "Tyhjennä"
                : "Kaikki"}
            </button>
          </div>
        </div>
        <div className="stakeholder-filter-row">
          <span className="dim-filter-label">
            Puolueet
            <span className="dim-counter">
              {selectedParties.size} / {PARTIES.length}
            </span>
          </span>
          <div className="dim-filter-chips">
            {PARTIES.map((p) => {
              const on = selectedParties.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`dim-chip party-chip ${on ? "on" : ""}`}
                  onClick={() => toggleParty(p.id)}
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
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                setSelectedParties(
                  selectedParties.size === PARTIES.length
                    ? new Set()
                    : new Set(PARTIES.map((p) => p.id))
                )
              }
              style={{ marginLeft: 4 }}
            >
              {selectedParties.size === PARTIES.length
                ? "Tyhjennä"
                : "Kaikki"}
            </button>
          </div>
        </div>
      </div>

      <div className="stakeholder-network-grid">
        <div className="stakeholder-search">
          <input
            type="search"
            placeholder="Hae sidosryhmää nimellä, kuvauksella tai tyypillä…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="stakeholder-search-input"
          />
          <div className="stakeholder-search-meta">
            {focusStakeholder ? (
              <button
                type="button"
                className="link-btn"
                onClick={() => setFocusStakeholder(null)}
              >
                ← Näytä kaikki sidosryhmät
              </button>
            ) : (
              <span className="muted">
                {searchListStakeholders.length} osumaa · klikkaa valitaksesi
              </span>
            )}
          </div>
          <ul className="stakeholder-search-list">
            {searchListStakeholders.map((s) => {
              const active = focusStakeholder === s.id;
              const linkedParties = s.lähinPuolueita
                .map((pid) => PARTIES.find((p) => p.id === pid)?.lyhenne)
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`stakeholder-search-item ${active ? "on" : ""}`}
                    onClick={() =>
                      setFocusStakeholder(active ? null : s.id)
                    }
                  >
                    <div className="stakeholder-search-name">{s.nimi}</div>
                    <div className="stakeholder-search-sub">
                      <span className="stakeholder-search-type">
                        {s.tyyppi}
                      </span>
                      {linkedParties ? (
                        <span className="stakeholder-search-parties">
                          {linkedParties}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
            {searchListStakeholders.length === 0 ? (
              <li className="muted" style={{ padding: "8px 12px" }}>
                Ei osumia.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="stakeholder-canvas">
          {focusedStake ? (
            <div className="stakeholder-focus-info">
              <div>
                <b>{focusedStake.nimi}</b>{" "}
                <span className="muted">— {focusedStake.tyyppi}</span>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {focusedStake.kuvaus}
              </div>
            </div>
          ) : null}

          {visibleStakeholders.length === 0 || visibleParties.length === 0 ? (
            <div className="coalition-empty">
              {visibleParties.length === 0
                ? "Valitse vähintään yksi puolue."
                : "Ei sidosryhmiä valitulla suodattimella."}
            </div>
          ) : (
            <svg
              width="100%"
              viewBox={`0 0 ${w} ${h}`}
              role="img"
              aria-label="Puolueiden ja sidosryhmien verkko"
            >
              <text
                x={leftX - 10}
                y={28}
                textAnchor="end"
                fontSize={11}
                fontWeight={650}
                fill="#5b6473"
                letterSpacing={1}
              >
                PUOLUEET
              </text>
              <text
                x={rightX + 10}
                y={28}
                textAnchor="start"
                fontSize={11}
                fontWeight={650}
                fill="#5b6473"
                letterSpacing={1}
              >
                SIDOSRYHMÄT
              </text>

              {/* Linkit */}
              {links.map((l, i) => {
                const pi = visibleParties.findIndex((p) => p.id === l.partyId);
                const si = visibleStakeholders.findIndex(
                  (s) => s.id === l.stakeholderId
                );
                if (pi < 0 || si < 0) return null;
                const a = partyPos(pi);
                const b = stakePos(si);
                const linkActive = isLinkActive(l);
                const selected = isLinkSelected(l);
                const party = PARTIES.find((p) => p.id === l.partyId)!;
                const cx = (a.x + b.x) / 2;
                const conn = getConnection(l.stakeholderId, l.partyId);
                const baseOpacity = linkActive ? 0.55 : 0.06;
                const baseWidth = linkActive ? 1.4 : 0.8;
                const strengthBoost = (conn.vahvuus ?? 1) * 0.4;
                return (
                  <g key={i} className="stakeholder-link-group">
                    <path
                      d={`M ${a.x + 10} ${a.y} C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x - 10} ${b.y}`}
                      stroke="transparent"
                      strokeWidth={14}
                      fill="none"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setActiveLink(
                          selected
                            ? null
                            : {
                                partyId: l.partyId,
                                stakeholderId: l.stakeholderId,
                              }
                        )
                      }
                    >
                      <title>
                        {`${party.lyhenne} ↔ ${
                          STAKEHOLDERS.find((s) => s.id === l.stakeholderId)
                            ?.nimi
                        } — klikkaa nähdäksesi yhteyden tyyppi ja lähde`}
                      </title>
                    </path>
                    <path
                      d={`M ${a.x + 10} ${a.y} C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x - 10} ${b.y}`}
                      stroke={party.vari}
                      strokeOpacity={selected ? 0.95 : baseOpacity}
                      strokeWidth={
                        selected ? 3 + strengthBoost : baseWidth + strengthBoost
                      }
                      fill="none"
                      pointerEvents="none"
                    />
                  </g>
                );
              })}

              {/* Puolueet */}
              {visibleParties.map((p, i) => {
                const pos = partyPos(i);
                const active = isHighlighted(p.id);
                return (
                  <g
                    key={p.id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setHighlight(highlight === p.id ? null : p.id)
                    }
                    opacity={active ? 1 : 0.35}
                  >
                    <rect
                      x={pos.x - partyW}
                      y={pos.y - 12}
                      width={partyW + 10}
                      height={24}
                      rx={6}
                      fill={p.vari}
                      fillOpacity={0.18}
                      stroke={p.vari}
                      strokeWidth={highlight === p.id ? 2 : 1}
                    />
                    <text
                      x={pos.x - partyW + 12}
                      y={pos.y + 4}
                      fontSize={11.5}
                      fontWeight={650}
                      fill={p.vari}
                    >
                      {p.lyhenne}
                    </text>
                    <text
                      x={pos.x - partyW + 42}
                      y={pos.y + 4}
                      fontSize={10.5}
                      fill="#5b6473"
                    >
                      {p.lohko === "hallitus" ? "hall." : "opp."}
                    </text>
                    <title>{p.nimi}</title>
                    <circle cx={pos.x + 10} cy={pos.y} r={5} fill={p.vari} />
                  </g>
                );
              })}

              {/* Sidosryhmät */}
              {visibleStakeholders.map((s, i) => {
                const pos = stakePos(i);
                const active = isHighlighted(s.id);
                // Pilko pitkät nimet kahdelle riville
                const name = s.nimi;
                const maxLen = 32;
                let line1 = name;
                let line2: string | null = null;
                if (name.length > maxLen) {
                  const splitIdx = name.lastIndexOf(" ", maxLen);
                  if (splitIdx > 10) {
                    line1 = name.slice(0, splitIdx);
                    line2 = name.slice(splitIdx + 1);
                  }
                }
                return (
                  <g
                    key={s.id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setHighlight(highlight === s.id ? null : s.id)
                    }
                    opacity={active ? 1 : 0.3}
                  >
                    <circle cx={pos.x - 10} cy={pos.y} r={5} fill="#475569" />
                    <text
                      x={pos.x}
                      y={pos.y + (line2 ? -2 : 4)}
                      fontSize={11.5}
                      fontWeight={highlight === s.id ? 700 : 500}
                      fill="#0b1222"
                    >
                      {line1}
                    </text>
                    {line2 ? (
                      <text
                        x={pos.x}
                        y={pos.y + 11}
                        fontSize={11}
                        fill="#5b6473"
                      >
                        {line2}
                      </text>
                    ) : null}
                    <title>{`${s.nimi}\n${s.kuvaus}`}</title>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {selectedDetails && selectedDetails.party && selectedDetails.stakeholder ? (
          <aside className="connection-details">
            <button
              type="button"
              className="connection-close"
              onClick={() => setActiveLink(null)}
              aria-label="Sulje"
            >
              ×
            </button>
            <div className="connection-pair">
              <span
                className="connection-pill"
                style={{
                  background: `${selectedDetails.party.vari}1f`,
                  color: selectedDetails.party.vari,
                  borderColor: selectedDetails.party.vari,
                }}
              >
                <span
                  className="connection-pill-dot"
                  style={{ background: selectedDetails.party.vari }}
                />
                {selectedDetails.party.lyhenne}
              </span>
              <span className="connection-arrow">↔</span>
              <span className="connection-pill">
                <span
                  className="connection-pill-dot"
                  style={{ background: "#475569" }}
                />
                {selectedDetails.stakeholder.nimi}
              </span>
            </div>

            <div className="connection-meta">
              <span className="connection-type">
                {CONNECTION_TYPE_LABEL[selectedDetails.connection.tyyppi]}
              </span>
              {selectedDetails.connection.vahvuus ? (
                <span
                  className={`connection-strength s${selectedDetails.connection.vahvuus}`}
                  title={`Vaikutusvahvuus ${selectedDetails.connection.vahvuus}/3`}
                >
                  {"●".repeat(selectedDetails.connection.vahvuus)}
                  {"○".repeat(3 - selectedDetails.connection.vahvuus)}
                </span>
              ) : null}
            </div>

            <p className="connection-desc">
              {selectedDetails.connection.kuvaus}
            </p>

            <div className="connection-source">
              <span className="connection-source-label">Lähde</span>{" "}
              {selectedDetails.connection.lähdeUrl ? (
                <a
                  href={selectedDetails.connection.lähdeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selectedDetails.connection.lähde} ↗
                </a>
              ) : (
                <span>{selectedDetails.connection.lähde}</span>
              )}
            </div>

            <div className="connection-stakeholder-info">
              <h4>{selectedDetails.stakeholder.nimi}</h4>
              <p className="muted">{selectedDetails.stakeholder.kuvaus}</p>
              <p>
                <a
                  href={selectedDetails.stakeholder.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sidosryhmän kotisivu ↗
                </a>
              </p>
            </div>
          </aside>
        ) : (
          <aside className="connection-details connection-empty">
            <h4>Yhteyden tiedot</h4>
            <p className="muted">
              Klikkaa kahta solmua yhdistävää viivaa nähdäksesi yhteyden
              tyypin, kuvauksen ja lähdeviitteen. Viivan paksuus kuvaa
              yhteyden vahvuutta (1–3).
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
