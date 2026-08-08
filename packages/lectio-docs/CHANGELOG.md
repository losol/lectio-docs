# @eventuras/docs-framework

## 0.5.0

### Minor Changes

- cd27ea7: Links to files you don't publish now go to the forge instead of nowhere.

  Documentation routinely links to files outside the collected set — a README the
  globs didn't cover, a section a deployment leaves out. `resolveLink` used to
  return null for those, indistinguishable from "not a link at all", so a host
  could only leave them as authored and let them 404. It now resolves them with a
  null `page` and the repo-relative `path`, and `source.sourceHref(path)` turns
  that into a forge URL from the new `sourceUrl` template — recorded in the
  manifest, since the host that renders links reads that rather than the config.

  `DocSource.ignore` leaves part of a tree out of a source without narrowing the
  glob into something unreadable: `ignore: ['docs/ADR/**']`.

  Fixes a collector bug that made either of those awkward: the static base of a
  glob was found by scanning for `*`, `{` and `?`, which missed character classes
  and extglob — `docs/!(ADR)/**/*.md` was rooted at the literal directory
  `docs/!(ADR)`, and every page collected through it got a slug with `../` in it.
  fast-glob is now asked for the base rather than second-guessed.

## 0.4.0

### Minor Changes

- e8dc6b3: Multilingual documentation sets, opt-in via `locales` / `defaultLocale` in
  `DocsConfig`. A document's language comes from its frontmatter (`locale:` or
  `language:` — the only option when the filename isn't ours, like a package's
  `README.md`), else a filename suffix (`terms.nb.md`, the recommended
  convention), else a path segment (`nb/terms.md`). Only configured locales are
  recognised, so `notes.draft.md` and `apps/v2/README.md` aren't mistaken for
  translations.

  The marker is stripped from the slug, so every translation of a document shares
  one URL and stays one page in the nav. `getTree(locale)`, `getPages(locale)` and
  `getPage(slug, locale)` resolve to the closest version available and report the
  locale the page is actually written in, so a host can tell the reader when they
  got a fallback; `getLocales()` lists what the manifest holds. Untranslated pages
  stay in the tree rather than being hidden.

  Omit `locales` and nothing changes: pages carry no `locale`, manifests are
  byte-identical to before, and the existing no-argument calls behave exactly as
  they always have.

- e8dc6b3: `parseFrontmatter` is exported from `./content` — the collector's private reader,
  now shared instead of duplicated. It is deliberately not a YAML parser: scalar
  `key: value` lines, values left as written, which is what documentation
  frontmatter actually is and what keeps the dependency tree at what the collector
  and the search index genuinely need.

  What it can't represent — lists, nested maps, block and flow scalars — it now
  names in `unsupportedKeys` instead of dropping in silence, and `collect()` warns
  per file. A reader this small is fine; one that loses a `tags:` list without
  saying so is not.

- 453347d: Build a manifest without `collect()`, and resolve the links documents make to
  each other.

  `pathToPage` exports the file-to-page logic the collector uses — the slug a path
  gets, and the language it is written in — so a host whose content changes
  without a rebuild can assemble a manifest at runtime and still get the tree,
  the locale fallback and the search index. `pathToSlug`, `pathToLocale`,
  `normalizeSlug` and `resolveRelativePath` come with it, all pure and
  dependency-free.

  `source.resolveLink(href, fromSource)` maps a relative `*.md` link to the page
  it means, resolved against the source path of the document containing it rather
  than against a bare filename. Two sections can then each hold a `config.md`
  without `[overview](../guides/config.md)` becoming ambiguous, and a link from
  `nb/privacy.md` to `terms.md` lands on the Norwegian version of that page.

  A `slug:` in frontmatter now overrides the path-derived slug, so a document can
  keep a short, stable URL while its filename stays descriptive. Translations that
  disagree on the slug they declare are warned about while collecting — they would
  otherwise quietly stop being one page.

- c8153bb: With no `docs.config.ts`, the CLI now generates an opinionated starter from the
  repo's shape: root `docs/` first, then app readmes and docs under `/apps`, then
  `/packages` and `/libs`. Name variants share a group (`apps/` or `Applications/`,
  `libs/` or `Libraries/`), and repos with none of these directories keep the
  whole-tree `**/*.md` sweep.

  Source order is sidebar order, so the generated config _is_ the navigation —
  configuring it means editing the file it wrote.

### Patch Changes

- 47461aa: `buildTree` puts the home page first and sinks decision-record sections (`adr`,
  `adrs`, `decisions`) to the bottom of the level they sit on. ADRs are reference
  material read after the narrative docs, and manifest order — which is glob
  order — otherwise scattered them mid-nav.

## 0.3.1

### Patch Changes

- f606a78: A `README.md` at the collection root now becomes the home page (`/`) instead of
  a broken `/.` slug — so a repo's top-level README is the natural landing page,
  which is what the zero-config `**/*.md` setup wants. Nested READMEs are
  unchanged (still named after their parent directory).

## 0.3.0

### Minor Changes

- 3b48fff: `DocsConfig` accepts an `editUrl` template (`{path}` placeholder, forge-agnostic
  — GitHub, GitLab and Gitea shape edit URLs differently) which `collect()`
  resolves per page into `PageMeta.editUrl`. Hosts render "edit this page" links
  from the manifest instead of hardcoding which repo the content came from —
  which is also what keeps multi-repo sourcing possible later.

## 0.2.0

### Minor Changes

- ddb57d5: Consolidate search into `@eventuras/docs-framework`. The retired
  `@eventuras/lustro-search` package is folded in under new `./search`,
  `./build-index` and `./react` subpath exports, and the package now builds with
  Vite. Adds a library-first `runCollect()` helper (replacing the removed oclif
  CLI) and drops the unused `./collect` and `./config` exports.
- 696c5f3: Add a headless `useDocsSearch` hook, exported from `./react`. It holds the
  debounced search logic that was previously embedded in the `<Search>` component
  — which is now a thin ratio-ui wrapper over the hook — making it possible to
  render docs search with a different design system by reusing the hook and
  providing your own UI.

  The extracted logic is also hardened: in-flight requests are invalidated when
  the query is cleared and on unmount, and `provider.search` rejections are
  handled, so a late or failed response can't overwrite the current results.

## 0.1.9

### Patch Changes

- @eventuras/lustro-search@4.0.4

## 0.1.8

### Patch Changes

- 7c9fe79: chore: update dependencies
- Updated dependencies [7c9fe79]
  - @eventuras/lustro-search@4.0.3

## 0.1.7

### Patch Changes

- @eventuras/lustro-search@4.0.2

## 0.1.6

### Patch Changes

- @eventuras/lustro-search@4.0.1

## 0.1.5

### Patch Changes

- @eventuras/lustro-search@4.0.0

## 0.1.4

### Patch Changes

- @eventuras/lustro-search@3.0.1

## 0.1.3

### Patch Changes

- @eventuras/lustro-search@3.0.0

## 0.1.2

### Patch Changes

- @eventuras/lustro-search@2.0.0

## 0.1.1

### Patch Changes

- @eventuras/lustro-search@1.0.0
