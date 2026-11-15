import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { paths } from '../../app/paths';
import { DisplayToggles } from './DisplayToggles';
import { Icon } from '../ui/Icon';

const NAV = [
  { to: paths.home, label: 'Home', end: true },
  { to: paths.journeys, label: 'Journeys', end: false },
  { to: paths.review, label: 'Review', end: false },
  { to: paths.progress, label: 'Progress', end: false },
  { to: paths.settings, label: 'Settings', end: false },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        Skip to content
      </a>
      <header className="site-header no-print">
        <div className="site-header__inner">
          <Link to={paths.home} className="brand" aria-label="Korean Learning Journey, home">
            <span className="brand__mark" lang="ko" aria-hidden="true">
              한
            </span>
            <span className="brand__name">Korean Learning Journey</span>
          </Link>
          <button
            type="button"
            className="icon-button menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'cross' : 'menu'} />
          </button>
          <nav id="site-nav" className={`site-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main">
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <DisplayToggles compact />
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer no-print">
        <p>
          Progress is saved only in this browser. Clearing browser data or switching devices resets it. Pronunciation uses
          your browser’s built-in speech synthesis, so voice quality varies by device.
        </p>
        <p className="muted">No accounts, no tracking. Lesson content is hand-authored and validated before release.</p>
      </footer>
    </div>
  );
}
