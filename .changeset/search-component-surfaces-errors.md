---
"@eventuras/lectio-docs-react": patch
---

`<Search>` now renders an alert when the search provider fails, using the
`error` state `useDocsSearch` already exposes — a broken index is no longer
indistinguishable from a query with no matches.
