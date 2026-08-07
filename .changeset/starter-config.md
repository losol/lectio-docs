---
"@eventuras/lectio-docs": minor
---

With no `docs.config.ts`, the CLI now generates an opinionated starter from the
repo's shape: root `docs/` first, then app readmes and docs under `/apps`, then
`/packages` and `/libs`. Name variants share a group (`apps/` or `Applications/`,
`libs/` or `Libraries/`), and repos with none of these directories keep the
whole-tree `**/*.md` sweep.

Source order is sidebar order, so the generated config *is* the navigation —
configuring it means editing the file it wrote.
