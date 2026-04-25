import { useMemo } from "react";
import { PARTIES } from "../data/parties";

/**
 * Pikavalintarivi puolueille — Hallitus / Oppositio / 4 suurinta / Kaikki.
 * Yhden klikkauksen valinta. Käytetään useilla välilehdillä jotta
 * käyttäjän ei tarvitse rakentaa samaa joukkoa toistuvasti chip-napeista.
 */
export interface PartyQuickFilterProps {
  /** Nykyinen valinta (puolue-id:t). */
  selected: string[];
  onChange: (next: string[]) => void;
  /** Lisätekstinä esim. "tilannekuva 2026" */
  rightHint?: string;
}

interface QuickPreset {
  id: string;
  nimi: string;
  kuvaus: string;
  partyIds: string[];
}

const QUICK: QuickPreset[] = [
  {
    id: "all",
    nimi: "Kaikki",
    kuvaus: "Kaikki eduskuntapuolueet",
    partyIds: PARTIES.map((p) => p.id),
  },
  {
    id: "hallitus",
    nimi: "Hallituspuolueet",
    kuvaus: "Orpon hallitus 2023→ (KOK, PS, RKP, KD)",
    partyIds: PARTIES.filter((p) => p.lohko === "hallitus").map((p) => p.id),
  },
  {
    id: "oppositio",
    nimi: "Oppositiopuolueet",
    kuvaus: "Eduskunnan oppositiopuolueet 2023→",
    partyIds: PARTIES.filter((p) => p.lohko === "oppositio").map((p) => p.id),
  },
  {
    id: "suurimmat",
    nimi: "4 suurinta",
    kuvaus: "Eduskuntapaikoissa neljä suurinta puoluetta (vaalit 2.4.2023)",
    partyIds: [...PARTIES]
      .sort((a, b) => b.paikat - a.paikat)
      .slice(0, 4)
      .map((p) => p.id),
  },
];

export default function PartyQuickFilter({
  selected,
  onChange,
  rightHint,
}: PartyQuickFilterProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const matchingPreset = useMemo(() => {
    return QUICK.find((p) => {
      if (p.partyIds.length !== selected.length) return false;
      return p.partyIds.every((id) => selectedSet.has(id));
    });
  }, [selectedSet, selected.length]);

  return (
    <div className="party-quick-filter">
      <span className="party-quick-label">Pikavalinta</span>
      <div className="party-quick-chips">
        {QUICK.map((p) => {
          const active = matchingPreset?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`dim-preset ${active ? "active" : ""}`}
              onClick={() => onChange(p.partyIds)}
              title={p.kuvaus}
            >
              {p.nimi}
              <span className="dim-preset-count">{p.partyIds.length}</span>
            </button>
          );
        })}
      </div>
      {rightHint ? (
        <span className="party-quick-hint">{rightHint}</span>
      ) : null}
    </div>
  );
}
