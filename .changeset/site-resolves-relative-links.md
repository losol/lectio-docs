---
"lectio-docs": minor
---

Links between documents now work in the built site.

Documentation is authored to read on disk and on the forge, so documents link to
each other by path — `[the reference](../reference/config.md#targets)`. The site
rendered those exactly as written, and every one of them 404'd: `.md` is not a
slug. Six dead links on a page is normal for a cross-referenced corpus.

The docs route now resolves them. The loader maps each relative markdown link in
the body through `source.resolveLink`, and the renderer follows that: a
collected page becomes its slug (anchors survive, and client-side navigation
comes with it), a file the site doesn't publish becomes a `sourceUrl` link to
the repository, and off-site, root-relative and anchor-only hrefs are left as
the author wrote them. Resolution happens against the *source* path of the
document holding the link, so two sections can each hold a `config.md`, and a
link to a `README.md` lands on the page it was collected as.

Resolving in the loader rather than at render is what makes it work in a
prerendered site: the manifest is server-only, and a record of resolved hrefs
serializes into the page.

Anchor links (`#section`) no longer open in a new tab.
