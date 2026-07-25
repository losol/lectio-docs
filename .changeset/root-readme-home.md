---
"@eventuras/lectio-docs": patch
---

A `README.md` at the collection root now becomes the home page (`/`) instead of
a broken `/.` slug — so a repo's top-level README is the natural landing page,
which is what the zero-config `**/*.md` setup wants. Nested READMEs are
unchanged (still named after their parent directory).
