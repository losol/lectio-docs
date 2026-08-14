# lectio-docs

## 0.3.0

### Minor Changes

- 3c88316: Links between documents now work in the built site.

  Documentation is authored to read on disk and on the forge, so documents link to
  each other by path — `[the reference](../reference/config.md#targets)`. The site
  rendered those exactly as written, and every one of them 404'd: `.md` is not a
  slug. Six dead links on a page is normal for a cross-referenced corpus.

  The docs route now resolves them. The loader maps each relative markdown link in
  the body through `source.resolveLink`, and the renderer follows that: a
  collected page becomes its slug (anchors survive, and client-side navigation
  comes with it), a file the site doesn't publish becomes a `sourceUrl` link to
  the repository, and off-site, root-relative and anchor-only hrefs are left as
  the author wrote them. Resolution happens against the _source_ path of the
  document holding the link, so two sections can each hold a `config.md`, and a
  link to a `README.md` lands on the page it was collected as.

  Resolving in the loader rather than at render is what makes it work in a
  prerendered site: the manifest is server-only, and a record of resolved hrefs
  serializes into the page.

  Anchor links (`#section`) no longer open in a new tab.

### Patch Changes

- 47d9f5f: Update the rendering dependencies: `@eventuras/ratio-ui` 2.16 → 2.17.3,
  `@eventuras/markdown` 0.14 → 0.15.

  `markdown` 0.15 stops bundling `rehype-raw` and takes it as a caller-supplied
  plugin instead. This site never enabled raw HTML, so nothing changes but the
  weight: **−49 kB gzipped** of client JavaScript (−166 kB raw) on every page the
  CLI builds.

  `ratio-ui` 2.17.3 brings two fixes that touch what this site renders:

  - `NavTree` rows without an `href` are no longer `<a href="#">`. A folder that
    groups pages without being one now renders as a plain row rather than a link
    that jumps to the top of the page.
  - `Navbar.Brand` and friends survive the RSC boundary. The site header uses that
    whole family; it prerenders rather than running as a server component, so it
    was never hit — but the seam it broke on is the one this app sits closest to.

- a14315b: A `docs.config.ts` loads whatever the repo around it looks like.

  Node reads a `.ts` file's module system off the nearest `package.json`, so a
  config in a repo that declares `"type": "commonjs"` met `export default` with a
  raw `SyntaxError` and a stack trace into `node:internal/modules/cjs/loader` —
  nothing about the config, which was fine. The CLI now retries through a
  temporary `.mts` sibling, which is an ES module whatever the `package.json` says
  and, sitting in the same directory, resolves the config's own imports
  unchanged. It is removed again either way.

  The two failures that remain are named instead of raw:

  - an import that can't resolve — the common case is `import { defineDocsConfig }`
    in a repo with no `node_modules`, run with `npx lectio-docs`. The fix
    (`import type`, or no import at all) is in the message.
  - a Node too old to strip types, which says so and points at `docs.config.mjs`.

- Updated dependencies [c6c0efb]
  - @eventuras/lectio-docs@0.6.0
  - @eventuras/lectio-docs-react@0.1.5

## 0.2.4

### Patch Changes

- Updated dependencies [cd27ea7]
  - @eventuras/lectio-docs@0.5.0
  - @eventuras/lectio-docs-react@0.1.4

## 0.2.3

### Patch Changes

- Updated dependencies [e8dc6b3]
- Updated dependencies [e8dc6b3]
- Updated dependencies [453347d]
- Updated dependencies [c8153bb]
- Updated dependencies [47461aa]
  - @eventuras/lectio-docs@0.4.0
  - @eventuras/lectio-docs-react@0.1.3

## 0.2.2

### Patch Changes

- Updated dependencies [f606a78]
  - @eventuras/lectio-docs@0.3.1
  - @eventuras/lectio-docs-react@0.1.2

## 0.2.1

### Patch Changes

- 307fcc0: Fix `lectio dev` rendering a blank page when run via `npx` (or any install where
  dependencies resolve outside the site dir). The materialized dev server now lets
  Vite read the symlinked dependencies, so React Router's client entry loads.
- 2cf619d: Generated `.lectio/` and `dist/` directories now self-ignore: `lectio` writes a
  `.gitignore` inside each, so they stay out of the consumer's `git status`
  without the CLI ever modifying the repo's root `.gitignore`.

## 0.2.0

### Minor Changes

- e4ffa3f: Add `lectio dev` and zero-config scaffolding.

  `lectio dev` materializes the site app and runs `react-router dev` (a local dev
  server with HMR on the UI); content is collected once at startup. With no
  `docs.config`, `dev` scaffolds a starter `docs.config.ts` (`**/*.md`) so a fresh
  repo shows a demo immediately; `build` asks first when interactive and errors in
  CI rather than writing files silently.

## 0.1.1

### Patch Changes

- 4f83022: Fix dependency resolution when installed via pnpm. pnpm creates an empty
  `node_modules` inside the package in its virtual store, so the CLI mistook it
  for the dependency dir and materialized a site whose `node_modules` was empty —
  the React Router build then failed to resolve `vite` / `@react-router/dev`. It
  now picks the directory that actually holds a known dependency.
