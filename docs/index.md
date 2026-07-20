# Lectio Docs

A headless, framework-agnostic toolkit for collecting documentation scattered
across a repository into one content source, with full-text search.

Everything you are reading lives in `docs/` at the repo root. `collect()` gathers
it into `.lectio/`, emits a `manifest.json`, and this site renders it through the
framework-agnostic `./content` API — without Lectio knowing it runs on React
Router.

## How the pieces fit

- **`collect()`** — build-time, Node. Walks source globs, enriches frontmatter,
  writes the collected markdown plus a manifest.
- **`createContentSource()`** — pure TS. Turns the manifest into `getTree`,
  `getPages` and `getPage`, with the host injecting how bodies load.
- **The host** — owns routing, rendering and theme. This site loads bodies from
  disk with `fs`, which works for SSR today and for prerendering later.
