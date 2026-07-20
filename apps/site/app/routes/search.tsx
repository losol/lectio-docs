import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  useDocsSearch,
  type SearchProvider,
  type SearchResult,
} from '@eventuras/lectio-docs-react';

// Trivial in-memory provider — a stand-in until the collector-backed Orama
// index (roadmap Phase 2, the `./content` + `build-index` seam) is wired in.
// Its only job here is to prove the workspace link and the `/react` subpath
// resolve and run inside React Router framework mode (SSR + client hydration).
const SAMPLE: SearchResult[] = [
  {
    url: '/',
    title: 'Lectio Docs',
    excerptHtml: 'A headless, framework-agnostic <mark>toolkit</mark> for collecting docs.',
  },
  {
    url: '/getting-started',
    title: 'Getting started',
    excerptHtml: 'Install and <mark>collect</mark> your scattered docs.',
  },
  {
    url: '/guides/configuration',
    title: 'Configuration',
    excerptHtml: 'Sources, targets, slugs and <mark>frontmatter</mark>.',
  },
];

const sampleProvider: SearchProvider = {
  async init() {},
  async search(query) {
    const q = query.trim().toLowerCase();
    return SAMPLE.filter((r) => r.title.toLowerCase().includes(q));
  },
};

export function meta() {
  return [{ title: 'Search (demo) — Lectio Docs' }];
}

export default function SearchDemo() {
  const navigate = useNavigate();
  const provider = useMemo(() => sampleProvider, []);
  const { results, onQueryChange, onSelect } = useDocsSearch({
    provider,
    onNavigate: (url) => navigate(url),
  });
  const [query, setQuery] = useState('');

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '4rem auto',
        padding: '0 1rem',
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ marginBottom: '0.25rem' }}>Search (demo)</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Drives <code>useDocsSearch</code> from <code>@eventuras/lectio-docs-react</code>{' '}
        against a <strong>sample</strong> index — not the collected docs yet. Real search
        over the manifest lands with <code>build-index</code>, and then moves into the
        site chrome so it is available on every page.
      </p>
      <p style={{ marginTop: 0 }}>
        <Link to="/">← Back to docs</Link>
      </p>
      <input
        type="search"
        aria-label="Search the sample index"
        placeholder="Search the sample index…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onQueryChange(e.target.value);
        }}
        style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', boxSizing: 'border-box' }}
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {results.map((r) => (
          <li key={r.url} style={{ margin: '0.75rem 0' }}>
            <button
              type="button"
              onClick={() => onSelect(r.url)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: '0.6rem 0.75rem',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              <strong>{r.title}</strong>
              <span
                style={{ display: 'block', color: '#666' }}
                // excerptHtml is sanitized upstream (only <mark> tags) — mirrors
                // how the ratio-ui <Search> component renders highlights.
                dangerouslySetInnerHTML={{ __html: r.excerptHtml }}
              />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
