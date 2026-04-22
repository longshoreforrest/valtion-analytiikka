import { NavLink, Outlet } from "react-router-dom";
import { useSearch } from "../data/search";

export default function Layout() {
  const { query, setQuery } = useSearch();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">€</span>
          Valtion Budjetti
        </div>
        <nav>
          <NavLink to="/" end>Yleiskuva</NavLink>
          <NavLink to="/julkinen-talous">Julkinen talous</NavLink>
          <NavLink to="/vertailu">Vertailu</NavLink>
          <NavLink to="/taulukko">Taulukko</NavLink>
          <NavLink to="/tiivistelma">Tiivistelmä</NavLink>
          <NavLink to="/dokumentit">Dokumentit</NavLink>
          <NavLink to="/lahteet">Lähteet</NavLink>
          <NavLink to="/opas">Opas</NavLink>
        </nav>
        <div className="search">
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
          <a href="/lahteet">Tietolähteet</a> · <a href="/metodologia">Metodologia</a>
        </span>
      </footer>
    </div>
  );
}
