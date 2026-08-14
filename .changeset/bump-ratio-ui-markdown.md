---
"lectio-docs": patch
---

Update the rendering dependencies: `@eventuras/ratio-ui` 2.16 → 2.17.3,
`@eventuras/markdown` 0.14 → 0.15.

`markdown` 0.15 stops bundling `rehype-raw` and takes it as a caller-supplied
plugin instead. This site never enabled raw HTML, so nothing changes but the
weight: **−49 kB gzipped** of client JavaScript (−166 kB raw) on every page the
CLI builds.

`ratio-ui` 2.17.3 brings two fixes that touch what this site renders:

- `NavTree` rows without an `href` are no longer `<a href="#">`. A folder that
  groups pages without being one now renders as a plain row rather than a link
  that jumps to the top of the page.
- `Navbar.Brand` and friends survive the RSC boundary. The site header uses that
  whole family; it prerenders rather than running as a server component, so it
  was never hit — but the seam it broke on is the one this app sits closest to.
