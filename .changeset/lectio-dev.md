---
"lectio-docs": minor
---

Add `lectio dev` and zero-config scaffolding.

`lectio dev` materializes the site app and runs `react-router dev` (a local dev
server with HMR on the UI); content is collected once at startup. When no
`docs.config` exists, both `dev` and `build` scaffold a starter `docs.config.ts`
(`**/*.md`) and run with it, so a fresh repo shows a demo immediately.
