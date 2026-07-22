---
title: Build your docs site with Lectio
description: From scattered monorepo docs to a searchable site
---

# Build your docs site with Lectio

A grown monorepo scatters its documentation by nature: a `docs/` tree for
guides, a `README.md` in every library, deeper docs inside individual apps.
Lectio gathers all of it into one content tree with search — and this guide
takes you from those scattered files to a working docs site, in a typical
pnpm monorepo with `apps/*` and `libs/*`. Your own app keeps full control of
routing and rendering throughout.

## 1. Install

```sh
pnpm add @eventuras/lectio-docs
# React bindings for search, if your docs app is React:
pnpm add @eventuras/lectio-docs-react
```

## 2. Describe where your docs live

Create `docs.config.ts` in your docs app. Each source is a glob (relative to
the repo root) plus the target path its files should land under:

```ts
import { defineDocsConfig } from '@eventuras/lectio-docs';

export default defineDocsConfig({
  output: './content',
  sources: [
    // The main documentation tree
    { glob: 'docs/**/*.md', target: '/' },

    // Every library's README becomes a page under /libraries,
    // titled and described from its package.json
    {
      glob: 'libs/*/README.md',
      target: '/libraries',
      titleFromPackageJson: true,
      descriptionFromPackageJson: true,
    },

    // Deeper library docs (component docs, custom rules, …)
    { glob: 'libs/*/docs/**/*.md', target: '/libraries' },

    // App-level docs keep their app's name in the path
    { glob: 'apps/web/docs/**/*.md', target: '/apps/web' },
  ],

  // "Edit this page" links, resolved per page at collect time.
  // A template rather than repo+branch fields, because GitHub, GitLab and
  // Gitea all shape their edit URLs differently:
  editUrl: 'https://github.com/your-org/your-repo/edit/main/{path}',
});
```

Worth knowing:

- `README.md` is renamed to its parent directory's name, so
  `libs/event-sdk/README.md` becomes the page `/libraries/event-sdk`.
- Titles fall back gracefully: frontmatter → `package.json` (when configured)
  → the file's first heading.
- Every page records the repo-relative path it came from (`source`), and —
  with `editUrl` configured — a resolved edit link.

## 3. Collect at build time

`runCollect()` discovers `docs.config.{ts,js,mjs}` and resolves the repo root
(nearest `pnpm-workspace.yaml` or `.git`) on its own:

```ts
// scripts/collect.ts
import { runCollect } from '@eventuras/lectio-docs';

await runCollect();
```

Wire it in front of dev and build, and ignore the output — it is a build
artifact, not content to commit:

```jsonc
// package.json
{
  "scripts": {
    "predev": "node scripts/collect.ts",
    "prebuild": "node scripts/collect.ts"
  }
}
```

```gitignore
content/
```

The output directory now holds the collected markdown plus `manifest.json` — a
flat list of every page with slug, title, description, source path and edit
link. The manifest is the seam everything else builds on.

## 4. Serve it from your app

`createContentSource` turns the manifest into a navigation tree and pages.
It is pure TypeScript — **you** decide how file bodies load, which is what
keeps Lectio framework-agnostic:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createContentSource, type Manifest } from '@eventuras/lectio-docs/content';

const manifest = JSON.parse(readFileSync('content/manifest.json', 'utf-8')) as Manifest;

const source = createContentSource({
  manifest,
  // fs works for SSR and for static prerendering (loaders run in Node at
  // build time). A SPA would fetch; a bundler could import.meta.glob.
  loadBody: (page) => readFileSync(join('content', page.file), 'utf-8'),
});

source.getTree();          // navigation tree, derived from slugs
await source.getPage('/libraries/event-sdk'); // metadata + raw markdown body
```

Routing and rendering stay yours: map slugs onto your routes (they are plain
URL paths, so a catch-all route with slug == URL is the simplest mapping) and
render the markdown body with whatever you already use.

## 5. Add search

Build an Orama index from the collected manifest at build time, ship it as a
static asset, query it in the browser:

```ts
// after collect, e.g. in the same script
import { buildSearchIndex } from '@eventuras/lectio-docs/build-index';

await buildSearchIndex({
  contentDir: 'content',
  outputPath: 'public/search-index.json',
});
```

```tsx
import { OramaProvider } from '@eventuras/lectio-docs/search';
import { Search, useDocsSearch } from '@eventuras/lectio-docs-react';

const provider = new OramaProvider('/search-index.json');

// Either the ready-made command palette (ratio-ui, ⌘K included):
<Search provider={provider} onNavigate={(url) => router.push(url)} />;

// …or the headless hook, rendered with your own design system:
const { results, error, onQueryChange, onSelect } = useDocsSearch({ provider });
```

Titles and URLs in the index come from the manifest — not from built HTML —
so search works the same whichever framework serves the pages.

## A complete reference

The site you are reading is the reference implementation:
[`apps/site` in the lectio-docs repo](https://github.com/losol/lectio-docs/tree/main/apps/site)
is a small React Router app doing everything above — collect on dev/build,
an fs-backed content source behind a catch-all route, markdown rendered with
[`@eventuras/markdown`](https://github.com/losol/ratio-ui/tree/main/packages/markdown),
search in the header, and the whole thing prerendered to static HTML.
Adopting Lectio in your own monorepo is, in essence, copying that pattern and
pointing `docs.config.ts` at your sources.
