---
"lectio-docs": patch
---

A `docs.config.ts` loads whatever the repo around it looks like.

Node reads a `.ts` file's module system off the nearest `package.json`, so a
config in a repo that declares `"type": "commonjs"` met `export default` with a
raw `SyntaxError` and a stack trace into `node:internal/modules/cjs/loader` —
nothing about the config, which was fine. The CLI now retries through a
temporary `.mts` sibling, which is an ES module whatever the `package.json` says
and, sitting in the same directory, resolves the config's own imports
unchanged. It is removed again either way.

The two failures that remain are named instead of raw:

- an import that can't resolve — the common case is `import { defineDocsConfig }`
  in a repo with no `node_modules`, run with `npx lectio-docs`. The fix
  (`import type`, or no import at all) is in the message.
- a Node too old to strip types, which says so and points at `docs.config.mjs`.
