import { useMemo } from "react";
import { VALUE_DIMENSIONS } from "../data/parties";

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
}

interface Preset {
  id: string;
  nimi: string;
  kuvaus: string;
  dimensions: string[];
}

const PRESETS: Preset[] = [
  {
    id: "all",
    nimi: "Kaikki",
    kuvaus: "Koko 12 dimension arvomalli",
    dimensions: VALUE_DIMENSIONS.map((d) => d.id),
  },
  {
    id: "talous",
    nimi: "Talous",
    kuvaus: "Sopeutus, vero, tulonjako, yritystuet, sosiaaliturva",
    dimensions: [
      "fiscal_tightness",
      "tax_level",
      "redistribution",
      "business_subsidies",
      "social_security",
    ],
  },
  {
    id: "vihrea",
    nimi: "Vihreä siirtymä",
    kuvaus: "Ilmasto, yritystuet, maaseutu, EU",
    dimensions: ["climate", "business_subsidies", "rural", "eu"],
  },
  {
    id: "arvot",
    nimi: "Arvot ja yhteiskunta",
    kuvaus: "Maahanmuutto, palvelut, koulutus, sosiaaliturva, ilmasto",
    dimensions: [
      "immigration",
      "public_services",
      "education",
      "social_security",
      "climate",
    ],
  },
  {
    id: "ulko",
    nimi: "Ulko ja turvallisuus",
    kuvaus: "Turvallisuus, EU, maahanmuutto, sopeutus",
    dimensions: ["security", "eu", "immigration", "fiscal_tightness"],
  },
  {
    id: "palvelut",
    nimi: "Palvelut ja hyvinvointi",
    kuvaus: "Sote, koulutus, sosiaaliturva, tulonjako",
    dimensions: [
      "public_services",
      "education",
      "social_security",
      "redistribution",
    ],
  },
];

/**
 * Chip-suodatin radarin dimensioista. Tukee:
 *  - Yksittäisen dimensioton toggle (klikkaus chip-napista)
 *  - Esivalinnat (presetit)
 *  - "Kaikki" ja "Tyhjennä"
 *
 * Annetaan myös pieni live-laskuri jolla käyttäjä näkee montako on valittu.
 */
export default function DimensionFilter({ selected, onChange }: Props) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const matchingPreset = useMemo(() => {
    return PRESETS.find((p) => {
      if (p.dimensions.length !== selected.length) return false;
      return p.dimensions.every((id) => selectedSet.has(id));
    });
  }, [selectedSet, selected.length]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((d) => d !== id));
    } else {
      // säilytetään VALUE_DIMENSIONS-järjestys
      const next = VALUE_DIMENSIONS.filter(
        (d) => selectedSet.has(d.id) || d.id === id
      ).map((d) => d.id);
      onChange(next);
    }
  };

  const applyPreset = (p: Preset) => onChange(p.dimensions);

  return (
    <div className="dim-filter">
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
              <span className="dim-preset-count">{p.dimensions.length}</span>
            </button>
          );
        })}
      </div>

      <div className="dim-filter-chips-wrap">
        <div className="dim-filter-head">
          <span className="dim-filter-label">
            Dimensiot
            <span className="dim-counter">
              {selected.length} / {VALUE_DIMENSIONS.length}
            </span>
          </span>
          <div className="dim-filter-quick">
            <button
              type="button"
              className="link-btn"
              onClick={() => onChange(VALUE_DIMENSIONS.map((d) => d.id))}
              disabled={selected.length === VALUE_DIMENSIONS.length}
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
          {VALUE_DIMENSIONS.map((d) => {
            const on = selectedSet.has(d.id);
            return (
              <button
                key={d.id}
                type="button"
                className={`dim-chip ${on ? "on" : ""}`}
                onClick={() => toggle(d.id)}
                title={`${d.matala} ↔ ${d.korkea}`}
                aria-pressed={on}
              >
                <span className="dim-chip-tick" aria-hidden="true">
                  {on ? "✓" : "+"}
                </span>
                {d.nimi}
              </button>
            );
          })}
        </div>
      </div>
      {selected.length > 0 && selected.length < 3 ? (
        <div className="dim-filter-hint">
          Valitse vähintään 3 dimensiota nähdäksesi radarin.
        </div>
      ) : null}
    </div>
  );
}
