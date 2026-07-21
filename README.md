# Lectio Docs

> *Lectio* — Latin, "a reading."

A headless, framework-agnostic toolkit for collecting documentation scattered
across a repository — guides, READMEs, app docs — into one content source,
with full-text search. Any host app embeds it and renders the content itself.

Lectio is **not** a site generator. Routing, rendering and theming stay with
the host. Its job is the part nobody else does well: gathering scattered
monorepo docs into one content tree, plus search.

## Packages

| Package | What it is |
| --- | --- |
| [`@eventuras/lectio-docs`](packages/lectio-docs) | The toolkit: collector, content source, search index. Vanilla TS/Node — no React. |
| [`@eventuras/lectio-docs-react`](packages/lectio-docs-react) | React bindings: a headless search hook, plus an optional styled component. |

## How the pieces fit

```text
docs/**  libs/*/README.md  apps/*/docs      … your scattered markdown
   │
   │  collect()                             build time, Node
   ▼
output dir: collected .md + manifest.json   one content tree
   │
   │  createContentSource({ manifest, loadBody })
   ▼                                        pure TS — the host injects how
getTree / getPages / getPage                bodies load (fs, fetch, bundler)
                                            and renders however it likes

buildSearchIndex()  →  search-index.json  →  OramaProvider + useDocsSearch
```

The framework-agnostic seam is deliberate: `collect()` runs in Node at build
time and emits a manifest; the content source is pure TypeScript; the host
decides how bodies are loaded — `fs` in Node, `fetch` in a SPA,
`import.meta.glob` with a bundler. Lectio never knows which framework it runs
in.

## Reference site

[`apps/site`](apps/site) collects this repository's own [`docs/`](docs) tree,
renders it with React Router, prerenders to static HTML, and deploys to
Cloudflare — live at [lectio.losol.no](https://lectio.losol.no). It doubles as
the proof that the toolkit stays framework-agnostic.

## Development

```sh
pnpm install
pnpm -r build              # core → react bindings → site (topological)
pnpm --filter site dev     # collect docs/ and serve the site locally
```

Releases are managed with [changesets](https://github.com/changesets/changesets):
add one with `pnpm changeset`, and merging the generated version PR publishes.

## License

MIT © [Losol AS](https://losol.no)
