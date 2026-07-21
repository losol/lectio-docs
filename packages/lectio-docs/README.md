# @eventuras/lectio-docs

Headless, framework-agnostic toolkit for collecting documentation scattered
across a repository into one content source, with full-text search.

Vanilla TypeScript/Node — no React, no framework assumptions. (React bindings
live in [`@eventuras/lectio-docs-react`](https://www.npmjs.com/package/@eventuras/lectio-docs-react).)

```sh
pnpm add @eventuras/lectio-docs
```

## 1. Describe your sources

A source is a glob plus the target path its files should land under:

```ts
// docs.config.ts
import { defineDocsConfig } from '@eventuras/lectio-docs';

export default defineDocsConfig({
  output: '.lectio',
  sources: [
    { glob: 'docs/**/*.md', target: '/' },
    { glob: 'libs/*/README.md', target: '/libraries', titleFromPackageJson: true },
  ],
});
```

## 2. Collect

```ts
import { runCollect } from '@eventuras/lectio-docs';

await runCollect(); // discovers docs.config.{ts,js,mjs}, resolves the repo root
```

Each matched file is copied under its target, its frontmatter enriched (title
from frontmatter → `package.json` → first heading; a `source` field records the
original path), and a `manifest.json` is written alongside — a flat list of
pages with slugs, titles and file paths.

`README.md` becomes a page named after its parent directory, so
`libs/event-sdk/README.md` → `/libraries/event-sdk`.

## 3. Read it back

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createContentSource, type Manifest } from '@eventuras/lectio-docs/content';

const manifest = JSON.parse(readFileSync('.lectio/manifest.json', 'utf-8')) as Manifest;

const source = createContentSource({
  manifest,
  loadBody: (page) => readFileSync(join('.lectio', page.file), 'utf-8'),
});

source.getTree();                  // navigation tree, derived from slugs
source.getPages();                 // flat page metadata
await source.getPage('/libraries/event-sdk'); // metadata + raw markdown body
```

`createContentSource` is pure TypeScript. **You inject how bodies load** —
`fs` in Node (works for SSR and prerendering), `fetch` in a SPA,
`import.meta.glob` with a bundler. Rendering the markdown is entirely yours.

## Search (opt-in)

Build an [Orama](https://oramasearch.com) index from the collected manifest at
build time, ship it as a static asset, and query it in the browser:

```ts
// build time
import { buildSearchIndex } from '@eventuras/lectio-docs/build-index';

await buildSearchIndex({
  contentDir: '.lectio',
  outputPath: 'public/search-index.json',
});
```

```ts
// runtime
import { OramaProvider } from '@eventuras/lectio-docs/search';

const provider = new OramaProvider('/search-index.json');
const results = await provider.search('frontmatter');
// [{ url: '/guides/configuration', title: 'Configuration', excerptHtml: '…<mark>frontmatter</mark>…' }]
```

Titles and URLs come from the manifest, not from built HTML — so every host
gets the same index, no site build required. Using React? The
[`useDocsSearch`](https://www.npmjs.com/package/@eventuras/lectio-docs-react)
hook wraps the provider with debouncing and stale-response protection.

## Entry points

| Import | Runs in | Contents |
| --- | --- | --- |
| `@eventuras/lectio-docs` | Node, build time | `collect`, `runCollect`, `defineDocsConfig` |
| `@eventuras/lectio-docs/content` | anywhere | `createContentSource`, `buildTree`, types |
| `@eventuras/lectio-docs/search` | browser + Node | `OramaProvider`, `SearchProvider`/`SearchResult` types |
| `@eventuras/lectio-docs/build-index` | Node, build time | `buildSearchIndex` |

## License

MIT © [Losol AS](https://losol.no)
