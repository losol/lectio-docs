---
"lectio-docs": minor
---

Add `lectio dev` and zero-config scaffolding.

`lectio dev` materializes the site app and runs `react-router dev` (a local dev
server with HMR on the UI); content is collected once at startup. With no
`docs.config`, `dev` scaffolds a starter `docs.config.ts` (`**/*.md`) so a fresh
repo shows a demo immediately; `build` asks first when interactive and errors in
CI rather than writing files silently.
