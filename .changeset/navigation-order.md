---
"@eventuras/lectio-docs": minor
---

Order inside a source is yours to state.

Source order was the whole story: the sidebar followed the manifest, the
manifest followed the `sources` list, and *within* a source the filesystem
decided. Eight sections holding the same three subfolders came out in three
different orders, none of them chosen — and a subfolder has no page to carry
frontmatter, so there was nothing to say it with either.

Two ways to say it now, on one scale:

```ts
{ glob: 'docs/**/*.md', target: '/', order: ['concepts', 'reference', 'recipes'] }
```

```yaml
---
title: Adressering
order: 1
---
```

`order` on a source names path segments wherever they occur, so one line settles
all eight sections; `order:` in frontmatter does the same for one page. Position
in the list counts from 1 and means what the frontmatter number means, so the
two mix at a level. Everything unnamed follows.

**Unnamed pages now sort alphabetically** (numeric-aware — `2-x` before `10-x`)
rather than in glob order, which varied by machine. A source that relied on its
filesystem's order needs an `order` to keep it.

`sortPages(pages, options)` is exported from `./content` — pure, so a host
assembling a manifest at runtime sorts it exactly as `collect()` does.
`buildTree` is unchanged: manifest order stays the contract, and the home page
still leads while `adr/` still sinks.
