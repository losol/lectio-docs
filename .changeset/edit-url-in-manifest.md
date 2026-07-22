---
"@eventuras/lectio-docs": minor
---

`DocsConfig` accepts an `editUrl` template (`{path}` placeholder, forge-agnostic
— GitHub, GitLab and Gitea shape edit URLs differently) which `collect()`
resolves per page into `PageMeta.editUrl`. Hosts render "edit this page" links
from the manifest instead of hardcoding which repo the content came from —
which is also what keeps multi-repo sourcing possible later.
