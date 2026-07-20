import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { OramaProvider } from '@eventuras/lectio-docs/search';
import { useDocsSearch } from '@eventuras/lectio-docs-react';

export function meta() {
  return [{ title: 'Search — Lectio Docs' }];
}

export default function SearchPage() {
  const navigate = useNavigate();

  // The index is built from the collected manifest at build time and shipped as
  // a static asset; Orama restores it in the browser on the first query.
  const provider = useMemo(() => new OramaProvider('/search-index.json'), []);

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
      <h1 style={{ marginBottom: '0.25rem' }}>Search</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Full-text search over the collected docs — an Orama index built from the
        manifest, queried through <code>useDocsSearch</code>.
      </p>
      <p style={{ marginTop: 0 }}>
        <Link to="/">← Back to docs</Link>
      </p>

      <input
        type="search"
        aria-label="Search the docs"
        placeholder="Search the docs…"
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
                // excerptHtml is sanitized upstream (only <mark> tags).
                dangerouslySetInnerHTML={{ __html: r.excerptHtml }}
              />
            </button>
          </li>
        ))}
      </ul>

      {query.trim() !== '' && results.length === 0 && (
        <p style={{ color: '#888' }}>No matches.</p>
      )}
    </main>
  );
}
