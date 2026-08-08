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
`libs/event-sdk/README.md` → `/libraries/event-sdk`. A `slug:` in frontmatter
overrides the path, so a document can keep a short, stable URL while its
filename stays descriptive — `terms-of-use.md` with `slug: terms` is `/terms`.

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

### Without a build step

A manifest is only data, so a host whose content changes without a rebuild — a
directory mounted into a container, a CMS export — can build one itself.
`pathToPage` is the same file-to-page logic `collect()` uses, exported:

```ts
import { pathToPage, parseFrontmatter, createContentSource } from '@eventuras/lectio-docs/content';

const pages = files.map((file) => {                 // file is relative to the content root
  const { frontmatter } = parseFrontmatter(read(file));
  const { slug, locale } = pathToPage(file, { locales: ['en', 'nb'], frontmatter });
  return { slug, locale, title: String(frontmatter.title ?? slug), source: file, file, frontmatter };
});

const source = createContentSource({ manifest: { version: 1, pages }, loadBody, defaultLocale: 'en' });
```

## Links between documents

Documentation is written to read on disk and on a forge as well as in a host, so
documents link to each other by path. `resolveLink` maps such a link to the page
it means, resolved against the **source path of the document containing it**:

```ts
const page = await source.getPage('/privacy', 'nb');
const link = source.resolveLink('terms-of-use.md', page.source);
// → { page: { slug: '/terms', locale: 'nb', … }, path: 'nb/terms-of-use.md', suffix: '' }
```

Resolving against the source rather than the bare filename is what lets two
sections each hold a `config.md` — `[overview](../guides/config.md)` still lands
on the right one — and it settles language on the way: the link above came from
`nb/privacy-policy.md`, so it resolved to the Norwegian `/terms`.

Off-site, root-relative and anchor-only hrefs return null — leave those as the
author wrote them.

### Links to files you don't publish

Documentation links to files that aren't in the collected set: a README outside
the globs, a section a deployment leaves out. Those still resolve, with a null
`page`, so they can go to the forge rather than nowhere. Give the collector a
`sourceUrl` and the template travels in the manifest:

```ts
export default defineDocsConfig({
  output: '.lectio',
  sourceUrl: 'https://github.com/org/repo/blob/main/{path}',
  sources: [{ glob: 'docs/**/*.md', target: '/', ignore: ['docs/ADR/**'] }],
});
```

```ts
const link = source.resolveLink(href, page.source);
if (link) {
  const target = link.page
    ? toPageUrl(link.page.slug)          // yours to shape
    : source.sourceHref(link.path);      // null if no sourceUrl is configured
}
```

`ignore` is how a source leaves part of a tree out — decision records, drafts —
without narrowing the glob into something unreadable.

## Languages (opt-in)

List the locales a documentation set is written in, and translations of a
document collapse onto one slug:

```ts
export default defineDocsConfig({
  output: '.lectio',
  locales: ['en', 'nb'],
  defaultLocale: 'en',       // assumed for a document that declares none
  sources: [{ glob: 'docs/**/*.md', target: '/' }],
});
```

A document's locale comes from the first of these that applies:

| | Use when |
| --- | --- |
| `locale:` (or `language:`) in frontmatter | The filename isn't yours to choose — a package's `README.md`. Always wins. |
| A filename suffix, `terms.nb.md` | The recommended convention. Self-evident, and it survives being collected flat. |
| A path segment, `nb/terms.md` | The repository is already laid out that way. |
| `defaultLocale` | Everything else. |

Only locales you list are recognised in a filename or a path, so `notes.draft.md`
and `apps/v2/README.md` aren't mistaken for translations. The marker is stripped
from the slug either way, so `terms.md`, `terms.nb.md` and `nb/terms.md` are all
`/terms` — one page, in three languages.

Frontmatter is taken at its word, since it is the explicit route — but a locale
that isn't in `locales` is warned about while collecting, because a typo there
(`nb-NO` for `nb`) would otherwise orphan a translation in silence.

```ts
source.getTree('nb');              // nav in Norwegian
const page = await source.getPage('/terms', 'nb');
page.locale;                       // 'en' if there is no Norwegian version yet
```

Reads fall back to `defaultLocale`, and the returned `locale` is the one the page
is actually written in — so a host can tell the reader when they got a fallback.
The tree keeps untranslated pages rather than hiding them.

Omit `locales` and nothing changes: pages carry no locale, manifests are
byte-identical to before, and `getTree()`/`getPage(slug)` behave exactly as they
always have.

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
| `@eventuras/lectio-docs/content` | anywhere | `createContentSource`, `buildTree`, `pathToPage`, `parseFrontmatter`, types |
| `@eventuras/lectio-docs/search` | browser + Node | `OramaProvider`, `SearchProvider`/`SearchResult` types |
| `@eventuras/lectio-docs/build-index` | Node, build time | `buildSearchIndex` |

## License

MIT © [Losol AS](https://losol.no)
