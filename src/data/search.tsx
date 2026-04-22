import { createContext, useContext, useMemo, useState, ReactNode } from "react";

interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  /** Palauttaa true jos jokin annetuista kentistä sisältää hakusanan (case-insensitive). */
  matches: (...fields: (string | null | undefined)[]) => boolean;
  /** Kääntää hakusanan esiintymät tekstissä `<mark>`-elementiksi. */
  highlight: (text: string | null | undefined) => ReactNode;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  const value = useMemo<SearchContextValue>(() => {
    const q = query.trim().toLowerCase();
    return {
      query,
      setQuery,
      matches: (...fields) => {
        if (!q) return true;
        for (const f of fields) {
          if (f && f.toLowerCase().includes(q)) return true;
        }
        return false;
      },
      highlight: (text) => {
        if (!text) return text ?? "";
        if (!q) return text;
        const lower = text.toLowerCase();
        const idx = lower.indexOf(q);
        if (idx === -1) return text;
        return (
          <>
            {text.slice(0, idx)}
            <span className="highlight">{text.slice(idx, idx + q.length)}</span>
            {text.slice(idx + q.length)}
          </>
        );
      },
    };
  }, [query]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch kutsuttava SearchProviderin sisällä");
  return ctx;
}
