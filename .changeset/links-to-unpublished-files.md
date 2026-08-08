---
"@eventuras/lectio-docs": minor
---

Links to files you don't publish now go to the forge instead of nowhere.

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
