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
  must not assume Next.js.
- **Search is opt-in per host.** Orama-based; hosts with their own search
  (e.g. Payload) don't need it.
- **`ratio-ui` is a convenience, not a requirement.** The styled `<Search>` uses
  ratio-ui, but it's an *optional peer* — the core is ratio-ui-free, so other
  design systems are possible.

## Target consumers

| Host | What Lectio provides | Who owns rendering / search |
| --- | --- | --- |
| React Router app (e.g. *ignis*, external) | content tree + `getPage` + `useDocsSearch` | app renders in its own routes; Orama search |
| Historia (Payload + Next CMS) | `collect()` → import docs as a Payload collection | Payload owns storage/admin/**search** (`plugin-search`) |
| Standalone docs site | all of the above + a reference theme | this is what **replaces `dev-docs`** |

## Architecture

```
@eventuras/lectio-docs
  .              collect / runCollect / defineDocsConfig   (Node, build-time)
  ./content      (planned) createContentSource: page tree + getPage — pure TS, agnostic
  ./search       OramaProvider + types
  ./build-index  buildSearchIndex
  ./react        useDocsSearch (headless hook) + <Search> (ratio-ui, optional)
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

---

## Roadmap

### Phase 1 — Stand up the repo
- Commit the standalone setup; create the GitHub remote and push.
- README, CI (build + typecheck), changesets.

### Phase 2 — Agnostic content-source API *(the core new capability)*
- Emit `manifest.json` from `collect()` (page tree + frontmatter + slugs).
- `./content`: `createContentSource({ manifest, loadBody })` → `getTree` /
  `getPages` / `getPage`. Pure TS, no React/Next.
- Validate with a **colocated React Router example** (proves agnosticism) plus a
  Next example — iteration stays atomic while the API is still moving.
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

- **Own identity / scope.** Kept `@eventuras/lectio-docs`. A rename to a
  dedicated scope (own npm org + GitHub org) can happen later if the product
  warrants it — extraction doesn't force it.
- **Optional standalone renderer.** For the pure standalone-site case, Lectio can
  recommend/adapt to an existing renderer (Fumadocs is the best fit — Next.js,
  headless core, native Orama search) rather than building a bespoke theme.
