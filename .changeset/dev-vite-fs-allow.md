---
"lectio-docs": patch
---

Fix `lectio dev` rendering a blank page when run via `npx` (or any install where
dependencies resolve outside the site dir). The materialized dev server now lets
Vite read the symlinked dependencies, so React Router's client entry loads.
