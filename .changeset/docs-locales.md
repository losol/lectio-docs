---
"@eventuras/lectio-docs": minor
---

Multilingual documentation sets, opt-in via `locales` / `defaultLocale` in
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
