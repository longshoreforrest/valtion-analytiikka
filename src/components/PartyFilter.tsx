import { useMemo } from "react";
import { PARTIES } from "../data/parties";

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  /** Otsikon teksti (esim. "Mukana matriisissa"). */
  label?: string;
  /** Pikavalinnat — jos false, presetit jätetään pois (kompakti tila). */
  presets?: boolean;
}

interface Preset {
  id: string;
  nimi: string;
  kuvaus: string;
  partyIds: string[];
}

const PRESETS: Preset[] = [
  {
    id: "all",
    nimi: "Kaikki",
    kuvaus: "Kaikki eduskuntapuolueet",
    partyIds: PARTIES.map((p) => p.id),
  },
  {
    id: "hallitus",
    nimi: "Hallitus",
    kuvaus: "Hallituspuolueet (KOK, PS, RKP, KD)",
    partyIds: PARTIES.filter((p) => p.lohko === "hallitus").map((p) => p.id),
  },
  {
    id: "oppositio",
    nimi: "Oppositio",
    kuvaus: "Oppositiopuolueet",
    partyIds: PARTIES.filter((p) => p.lohko === "oppositio").map((p) => p.id),
  },
  {
    id: "suurimmat",
    nimi: "4 suurinta",
    kuvaus: "Eduskuntapaikoissa neljä suurinta",
    partyIds: [...PARTIES]
      .sort((a, b) => b.paikat - a.paikat)
      .slice(0, 4)
      .map((p) => p.id),
  },
  {
    id: "vasen",
    nimi: "Vasemmisto-vihreä",
    kuvaus: "SDP, VAS, VIHR",
    partyIds: ["sdp", "vas", "vihr"],
  },
  {
    id: "oikea",
    nimi: "Oikeisto",
    kuvaus: "KOK, PS, KD, RKP, LIIK",
    partyIds: ["kok", "ps", "kd", "rkp", "liik"],
  },
];

/**
 * Chip-suodatin puolueista. Yhtenäinen ulkoasu DimensionFilterin kanssa,
 * mutta käyttää puolueen brändiväriä chipissä jolloin puolueen
 * tunnistettavuus säilyy.
 */
export default function PartyFilter({
  selected,
  onChange,
  label = "Puolueet",
  presets = true,
}: Props) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const matchingPreset = useMemo(() => {
    return PRESETS.find((p) => {
      if (p.partyIds.length !== selected.length) return false;
      return p.partyIds.every((id) => selectedSet.has(id));
    });
  }, [selectedSet, selected.length]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((d) => d !== id));
    } else {
      const next = PARTIES.filter(
        (p) => selectedSet.has(p.id) || p.id === id
      ).map((p) => p.id);
      onChange(next);
    }
  };

  const applyPreset = (p: Preset) => onChange(p.partyIds);

  return (
    <div className="dim-filter party-filter">
      {presets ? (
        <div className="dim-filter-presets">
          <span className="dim-filter-label">Pikavalinnat</span>
          {PRESETS.map((p) => {
            const active = matchingPreset?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`dim-preset ${active ? "active" : ""}`}
                onClick={() => applyPreset(p)}
                title={p.kuvaus}
              >
                {p.nimi}
                <span className="dim-preset-count">{p.partyIds.length}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="dim-filter-chips-wrap">
        <div className="dim-filter-head">
          <span className="dim-filter-label">
            {label}
            <span className="dim-counter">
              {selected.length} / {PARTIES.length}
            </span>
          </span>
          <div className="dim-filter-quick">
            <button
              type="button"
              className="link-btn"
              onClick={() => onChange(PARTIES.map((p) => p.id))}
              disabled={selected.length === PARTIES.length}
            >
              Valitse kaikki
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
            >
              Tyhjennä
            </button>
          </div>
        </div>
        <div className="dim-filter-chips">
          {PARTIES.map((p) => {
            const on = selectedSet.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`dim-chip party-chip ${on ? "on" : ""}`}
                onClick={() => toggle(p.id)}
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
                  className="party-chip-dot"
                  style={{ background: p.vari }}
                  aria-hidden="true"
                />
                <b>{p.lyhenne}</b>
                <span className="party-chip-name">{p.nimi}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
