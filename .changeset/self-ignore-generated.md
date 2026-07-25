---
"lectio-docs": patch
---

Generated `.lectio/` and `dist/` directories now self-ignore: `lectio` writes a
`.gitignore` inside each, so they stay out of the consumer's `git status`
without the CLI ever modifying the repo's root `.gitignore`.
