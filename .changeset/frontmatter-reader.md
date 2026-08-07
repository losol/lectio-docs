---
"@eventuras/lectio-docs": minor
---

`parseFrontmatter` is exported from `./content` — the collector's private reader,
now shared instead of duplicated. It is deliberately not a YAML parser: scalar
`key: value` lines, values left as written, which is what documentation
frontmatter actually is and what keeps the dependency tree at what the collector
and the search index genuinely need.

What it can't represent — lists, nested maps, block and flow scalars — it now
names in `unsupportedKeys` instead of dropping in silence, and `collect()` warns
per file. A reader this small is fine; one that loses a `tags:` list without
saying so is not.
