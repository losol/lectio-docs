---
"@eventuras/lectio-docs": minor
---

Build a manifest without `collect()`, and resolve the links documents make to
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
