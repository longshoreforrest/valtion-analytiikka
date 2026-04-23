import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSearch } from "../data/search";

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
          <NavLink to="/julkinen-talous">Julkinen talous</NavLink>
          <NavLink to="/vertailu">Vertailu</NavLink>
          <NavLink to="/taulukko">Taulukko</NavLink>
          <NavLink to="/tiivistelma">Tiivistelmä</NavLink>
          <NavLink to="/dokumentit">Dokumentit</NavLink>
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
