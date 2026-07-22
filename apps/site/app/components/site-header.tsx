import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useMatches, useNavigate } from 'react-router';

import { OramaProvider } from '@eventuras/lectio-docs/search';
import { Search } from '@eventuras/lectio-docs-react';
import { Navbar } from '@eventuras/ratio-ui/core/Navbar';
import { NavTree } from '@eventuras/ratio-ui/core/NavTree';
import { ThemeToggle } from '@eventuras/ratio-ui/core/ThemeToggle';

import type { DocsNavGroup } from '../routes/docs';

/**
 * Site header on ratio-ui's Navbar (sticky app-header form: fluid + elevated —
 * elevation, never borders). The search zone hosts the lectio <Search>
 * CommandPalette, which brings its own trigger and the global ⌘K shortcut.
 *
 * On narrow screens the docs nav collapses into the navbar's own
 * Toggle/Collapse pair (the "pocket library" pattern): a burger that folds the
 * NavTree out under the bar. The nav data comes from the docs route's loader
 * via useMatches, so the header stays route-agnostic. The Navbar is keyed on
 * the pathname because the disclosure state is internal with no controlled
 * API — remounting on navigation is what closes the panel after a link is
 * followed.
 *
 * Theme state lives on <html data-theme> (set before first paint by the
 * blocking script in root.tsx). The toggle reads it after mount — `null`
 * during SSR keeps server and client renders identical — and persists the
 * choice so the init script can restore it next visit.
 */
export function SiteHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  // The index is built from the collected manifest at build time and shipped
  // as a static asset; Orama restores it in the browser on the first query.
  const provider = useMemo(() => new OramaProvider('/search-index.json'), []);

  // Nav tree from whichever active route provided it (the docs loader).
  // UIMatch carries the loader's return as `loaderData` in React Router v8.
  const matches = useMatches();
  const docsData = matches.find(
    (m) => m.loaderData && typeof m.loaderData === 'object' && 'navGroups' in m.loaderData,
  )?.loaderData as { navGroups: DocsNavGroup[]; slug: string } | undefined;

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  const onThemeChange = (next: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('lectio-theme', next);
    } catch {
      // Storage disabled (private mode) — the toggle still works for this
      // visit, the choice just isn't remembered. Mirrors the init script's
      // guarded read.
    }
    setTheme(next);
  };

  return (
    <Navbar key={pathname} sticky elevated fluid>
      <Navbar.Brand>
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'var(--color-primary-700)',
              color: '#fff',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Lectio
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--text-subtle)', letterSpacing: '-0.02em' }}>
            Docs
          </span>
        </Link>
      </Navbar.Brand>

      <Navbar.Search>
        {/* CommandPalette renders its own trigger and registers global ⌘K —
            search is available from every page, no /search route. */}
        <Search
          provider={provider}
          placeholder="Search the docs…"
          onNavigate={(url) => navigate(url)}
        />
      </Navbar.Search>

      <Navbar.Spacer />

      <Navbar.Actions>
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} ariaLabel="Switch theme" />
        <a
          href="https://github.com/losol/lectio-docs"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 .5 5 .5 5 .5c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 7.5c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          GitHub
        </a>
        {docsData && (
          /* Wrapper owns responsive visibility (display: none / contents in
             docs.css) so we never fight the component's own display classes. */
          <span className="site-nav-toggle">
            <Navbar.Toggle controls="docs-nav" ariaLabel="Documentation menu" />
          </span>
        )}
      </Navbar.Actions>

      {docsData && (
        <div className="site-nav-collapse">
          <Navbar.Collapse id="docs-nav">
            <NavTree
              groups={docsData.navGroups}
              currentPath={docsData.slug}
              LinkComponent={NavCollapseLink}
              aria-label="Documentation"
            />
          </Navbar.Collapse>
        </div>
      )}
    </Navbar>
  );
}

/** React Router adapter for NavTree — forwards active/indent/aria props. */
function NavCollapseLink({ href, ...rest }: { href: string; children: React.ReactNode }) {
  return <Link to={href} {...rest} />;
}
