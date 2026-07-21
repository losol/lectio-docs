# @eventuras/lectio-docs-react

React bindings for [`@eventuras/lectio-docs`](https://www.npmjs.com/package/@eventuras/lectio-docs):
a headless full-text search hook, plus an optional styled component.

```sh
pnpm add @eventuras/lectio-docs-react @eventuras/lectio-docs
```

Requires React 18 or 19. `@eventuras/ratio-ui` is an **optional** peer — only
the styled `<Search>` component uses it; the hook is design-system-free.

## `useDocsSearch` — the headless hook

Debounced querying against a `SearchProvider`, with stale-response protection:
a late response can never overwrite a newer query, and clearing the input
cancels in-flight work.

```tsx
import { useMemo, useState } from 'react';
import { OramaProvider } from '@eventuras/lectio-docs/search';
import { useDocsSearch } from '@eventuras/lectio-docs-react';

export function DocsSearch() {
  const provider = useMemo(() => new OramaProvider('/search-index.json'), []);
  const { results, error, onQueryChange, onSelect } = useDocsSearch({
    provider,
    onNavigate: (url) => router.push(url), // your router; defaults to window.location
  });
  const [query, setQuery] = useState('');

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onQueryChange(e.target.value);
        }}
      />
      {error && <p role="alert">Search is unavailable.</p>}
      <ul>
        {results.map((r) => (
          <li key={r.url}>
            <button onClick={() => onSelect(r.url)}>
              <strong>{r.title}</strong>
              {/* excerptHtml is sanitized upstream — only <mark> tags */}
              <span dangerouslySetInnerHTML={{ __html: r.excerptHtml }} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

`error` is set when the provider throws — a missing index or a failed fetch —
and cleared on the next successful query, so a broken search never masquerades
as "no matches".

## `<Search>` — the styled component

A thin wrapper over the hook, rendered with ratio-ui's `CommandPalette`.
Requires `@eventuras/ratio-ui` to be installed:

```tsx
import { Search } from '@eventuras/lectio-docs-react';

<Search provider={provider} placeholder="Search docs…" onNavigate={(url) => router.push(url)} />
```

Prefer a different design system? Use `useDocsSearch` and render the results
yourself — the component exists as a convenience, not a requirement.

## License

MIT © [Losol AS](https://losol.no)
