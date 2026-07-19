# Lectio Docs — vision & roadmap

`@eventuras/lectio-docs` — a **headless, framework-agnostic toolkit** for collecting
documentation scattered across a repository (guides, READMEs, app docs) into a
unified content source with full-text search, that **any host app embeds and
renders itself**.

> *Lectio* — Latin, "a reading."

It is **not** a site generator. Routing, rendering and theming are always the
host's job. Lectio's value is the part nobody else does well: **gathering
scattered monorepo docs into one content tree**, plus search.

---

## North Star

**When Lectio is "done", a bespoke `dev-docs` app is no longer needed.**

Today `apps/dev-docs` in eventuras is a hand-rolled Next.js site that runs the
collector, renders markdown, and wires search. That app is the *proof of
concept*. The goal is for Lectio to absorb that capability — via a content API,
a reference theme, and/or a scaffolder — so the eventuras developer docs are
produced **by Lectio**, and the hand-rolled `dev-docs` either shrinks to
config-only or is retired.

---

## Positioning & principles

- **Toolkit, not SSG.** Hosts own routing/rendering/theme.
- **Collector is the differentiator.** Gathering `docs/**` + `libs/*/README.md` +
  app docs into one tree is the gap Nextra/Docusaurus/Starlight don't fill.
- **Framework-agnostic core.** Consumers span different frameworks — the API
  must not assume Next.js. Enforced by a package boundary: the core
  (`@eventuras/lectio-docs`) is vanilla TS/Node with zero React; the React
  bindings live in a separate `@eventuras/lectio-docs-react`.
- **Search is opt-in per host.** Orama-based; hosts with their own search
  (e.g. Payload) don't need it.
- **`ratio-ui` is a convenience, not a requirement.** The styled `<Search>` uses
  ratio-ui, but it's an *optional peer* of `@eventuras/lectio-docs-react` — the
  headless `useDocsSearch` hook is ratio-ui-free, so other design systems are
  possible.

## Target consumers

| Host | What Lectio provides | Who owns rendering / search |
| --- | --- | --- |
| React Router app (e.g. *ignis*, external) | content tree + `getPage` + `useDocsSearch` | app renders in its own routes; Orama search |
| Historia (Payload + Next CMS) | `collect()` → import docs as a Payload collection | Payload owns storage/admin/**search** (`plugin-search`) |
| Standalone docs site | all of the above + a reference theme | this is what **replaces `dev-docs`** |

## Architecture

```text
Monorepo — pnpm workspace (packages/* + apps/* + examples/*)

packages/lectio-docs            @eventuras/lectio-docs — vanilla TS/Node, no React
  .              collect / runCollect / defineDocsConfig   (Node, build-time)
  ./content      createContentSource: getTree / getPages / getPage — pure TS, agnostic
  ./search       OramaProvider + types
  ./build-index  buildSearchIndex

packages/lectio-docs-react      @eventuras/lectio-docs-react — React bindings
  .              useDocsSearch (headless hook) + <Search> (ratio-ui, optional peer)
                 type-only coupling to the core (SearchProvider / SearchResult)

apps/site                       React Router (framework mode, v8) reference site
  consumes @eventuras/lectio-docs-react; the future dev-docs replacement (Phase 4)
```

The agnostic seam: `collect()` emits a `manifest.json`; the runtime
`createContentSource({ manifest, loadBody })` is pure TS, and the **host injects
how bodies are loaded** (`fetch` in a SPA, `import.meta.glob` with a bundler,
`fs` in Node, an importer in Payload). Lectio never knows which framework it runs in.

---

## Status

### Done — Fase 0: decoupling (in eventuras, merged)
- Removed the unused oclif CLI → library-first `runCollect()`.
- Folded `@eventuras/lustro-search` in and retired it; switched to a Vite build;
  subpath exports (`./search`, `./build-index`, `./react`).
- Extracted a headless `useDocsSearch` hook; `<Search>` became a thin wrapper;
  hardened stale-response and error handling.
- Cleaned up stale `repo.json` metadata.

### Done — extraction
- Split to its own repo (`/Users/ole/Kode/lectio-docs`) **with history** (26
  commits, via `git subtree split`).
- Renamed to `@eventuras/lectio-docs` (scope kept for now).
- Inlined the Vite/TS config (the shared `vite-config` is private); `ratio-ui`
  and Orama come from npm. **Builds 100% standalone.**
- **eventuras is untouched** — it still has its own copy and `dev-docs` still
  works. Migration happens only after Lectio is published.

### Done — monorepo + React split (this repo)
- Converted the standalone package into a **pnpm workspace** (`packages/*` +
  `apps/*` + `examples/*`); the core moved to `packages/lectio-docs`.
- **Split the React bindings out** into `@eventuras/lectio-docs-react`
  (`useDocsSearch` + `<Search>`). The core is now vanilla TS/Node with no React
  dependency at all; the React package couples to it type-only.
- Scaffolded `apps/site` — a **React Router (framework mode, v8)** reference site
  that drives `useDocsSearch` against a sample index (proof the workspace wiring
  and the React bindings run under SSR + hydration). Real content-source wiring
  is Phase 2.

---

## Roadmap

### Phase 1 — Stand up the repo
- ✅ Converted to a pnpm workspace; core in `packages/lectio-docs`, React
  bindings in `packages/lectio-docs-react`, reference site in `apps/site`.
- Create the GitHub remote and push.
- README, CI (build + typecheck), changesets.

### Phase 2 — Agnostic content-source API *(the core new capability)*
- ✅ `./content`: `createContentSource({ manifest, loadBody })` → `getTree` /
  `getPages` / `getPage`. Pure TS, no React/Next. Manifest is a flat `pages[]`;
  the nav tree is derived at runtime, and the host injects `loadBody`.
- Emit `manifest.json` from `collect()` (frontmatter + slugs + file paths).
- Validate with `apps/site` (the **React Router** reference site — proves
  agnosticism) plus a Next example under `examples/` — iteration stays atomic
  while the API is still moving.
- Make `build-index` index the manifest/markdown instead of Next's built HTML
  (the one remaining Next-ism), so RR and other hosts get search too.

### Phase 3 — Publish & migrate eventuras
- Publish `@eventuras/lectio-docs` (npm or GitHub Packages).
- eventuras: remove `libs/docs-framework`, switch `dev-docs` to the published
  dependency, update `repo.json` / workspace config.

### Phase 4 — Batteries & retire dev-docs *(the North Star)*
- Ship ready-made components and a **reference site** (a theme, or a
  `create-lectio-docs` scaffolder) — enough that the eventuras developer docs are
  produced by Lectio, so the hand-rolled `dev-docs` app is no longer needed.
- Historia integration: `collect()` → a Payload collection (`plugin-nested-docs`
  for hierarchy, `plugin-search` for search).

---

## Deferred decisions

- **Positioning: "toolkit, not SSG" → possibly "toolkit *with* SSG".** The
  headless core is identical either way; only how much we invest in / market the
  `apps/site` reference site differs. Explicitly *not* decided — kept open by
  holding the seam: render/theme opinions stay in `apps/site`, never in the core.
- **peer vs dep for the core in `@eventuras/lectio-docs-react`.** Currently a
  plain `dependency` (`workspace:*`) for zero friction. At publish time, weigh a
  `peer` instead so consumers using both packages share one core version.
- **Own identity / scope.** Kept `@eventuras/lectio-docs`. A rename to a
  dedicated scope (own npm org + GitHub org) can happen later if the product
  warrants it — extraction doesn't force it.
- **Optional standalone renderer.** For the pure standalone-site case, Lectio can
  recommend/adapt to an existing renderer (Fumadocs is the best fit — Next.js,
  headless core, native Orama search) rather than building a bespoke theme.
