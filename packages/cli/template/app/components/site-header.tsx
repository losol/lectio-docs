import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { OramaProvider } from '@eventuras/lectio-docs/search';
import { Search } from '@eventuras/lectio-docs-react';
import { Navbar } from '@eventuras/ratio-ui/core/Navbar';
import { ThemeToggle } from '@eventuras/ratio-ui/core/ThemeToggle';

import { site } from '../site.generated';

/**
 * Site header on ratio-ui's Navbar. The search zone hosts the lectio <Search>
 * CommandPalette — own trigger, global ⌘K. Branding comes from the generated
 * site config the CLI writes at materialization time.
 */
export function SiteHeader() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  const provider = useMemo(() => new OramaProvider('/search-index.json'), []);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  const onThemeChange = (next: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('lectio-theme', next);
    } catch {
      // Storage disabled — the toggle still works for this visit.
    }
    setTheme(next);
  };

  return (
    <Navbar sticky elevated fluid>
      <Navbar.Brand>
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}
        >
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {site.title}
          </span>
        </Link>
      </Navbar.Brand>

      <Navbar.Search>
        <Search
          provider={provider}
          placeholder="Search the docs…"
          onNavigate={(url) => navigate(url)}
        />
      </Navbar.Search>

      <Navbar.Spacer />

      <Navbar.Actions>
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} ariaLabel="Switch theme" />
        {site.githubUrl && (
          <a
            href={site.githubUrl}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            GitHub
          </a>
        )}
      </Navbar.Actions>
    </Navbar>
  );
}
