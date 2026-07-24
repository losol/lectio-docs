---
"lectio-docs": patch
---

Fix dependency resolution when installed via pnpm. pnpm creates an empty
`node_modules` inside the package in its virtual store, so the CLI mistook it
for the dependency dir and materialized a site whose `node_modules` was empty —
the React Router build then failed to resolve `vite` / `@react-router/dev`. It
now picks the directory that actually holds a known dependency.
