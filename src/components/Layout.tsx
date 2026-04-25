import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSearch } from "../data/search";

declare global {
  interface Window {
    goatcounter?: {
      count?: (opts: { path?: string; title?: string; event?: boolean }) => void;
    };
  }
}

export default function Layout() {
  const { query, setQuery } = useSearch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Sulje valikko navigoinnin jälkeen
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // GoatCounter SPA-tracking: laukaistaan sivun vaihtuessa. Natiivi `count.js`
  // seuraa vain ensimmäistä latausta — kutsutaan `window.goatcounter.count()`
  // aina kun React Router vaihtaa pathname.
  useEffect(() => {
    const ping = () => {
      if (typeof window === "undefined" || !window.goatcounter?.count) return;
      window.goatcounter.count({
        path: location.pathname + location.search,
        title: document.title,
      });
    };
    // Pieni viive antaa document.title:n päivittyä uuden sivun myötä
    const t = setTimeout(ping, 50);
    return () => clearTimeout(t);
  }, [location.pathname, location.search]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">€</span>
          Valtion Budjetti
        </div>

        <button
          className="nav-toggle"
          aria-label="Avaa valikko"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "open" : ""}>
          <NavLink to="/" end>Yleiskuva</NavLink>
          <NavLink to="/paivitykset">Päivitykset</NavLink>
          <NavLink to="/julkinen-talous">Julkinen talous</NavLink>
          <NavLink to="/vertailu">Vertailu</NavLink>
          <NavLink to="/taulukko">Taulukko</NavLink>
          <NavLink to="/tiivistelma">Tiivistelmä</NavLink>
          <NavLink to="/dokumentit">Dokumentit</NavLink>
          <NavLink to="/poliittinen-analyysi">Poliittinen analyysi</NavLink>
          <NavLink to="/lahteet">Lähteet</NavLink>
          <NavLink to="/opas">Opas</NavLink>
        </nav>

        <button
          className="search-toggle"
          aria-label="Avaa haku"
          onClick={() => setSearchOpen((o) => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M 16 16 L 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        <a
          className="linkedin-link"
          href="https://www.linkedin.com/in/tapio-pitkaranta/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn — Tapio Pitkäranta"
          title="Tekijä LinkedInissä"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.268 2.37 4.268 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>

        <div className={`search ${searchOpen ? "open" : ""}`}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hae momenteista, luvuista, ministeriöistä…"
            aria-label="Avoin tekstihaku"
          />
          {query ? (
            <button className="clear" onClick={() => setQuery("")} aria-label="Tyhjennä haku">
              ×
            </button>
          ) : null}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <span>
          Data © Valtiovarainministeriö, Valtiokonttori, Tilastokeskus ym. —
          lisenssi <a href="https://creativecommons.org/licenses/by/4.0/deed.fi" target="_blank" rel="noreferrer">CC BY 4.0</a>.
        </span>
        <span>
          <a href="/lahteet">Tietolähteet</a> · <a href="/opas">Opas</a>
        </span>
      </footer>
    </div>
  );
}
