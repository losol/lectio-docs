---
"@eventuras/lectio-docs": minor
---

A plugin contract, with no framework in it.

Plugins render what markdown alone can't — Mermaid diagrams first — from
their own packages, so their dependencies never reach the core or pages that
don't use them. A plugin has two halves:

- **Config half** (`@eventuras/lectio-docs/plugins`): plain, JSON-safe data
  declared in the docs config's new `plugins` field — the fence languages it
  renders and the module specifier of its browser half. `resolvePlugins`
  validates it (duplicate names, two plugins claiming one fence, options that
  aren't JSON), and `generatePluginModule` turns it into a module a bundler
  can split, with each client module behind its own dynamic `import()`.
- **Browser half** (`@eventuras/lectio-docs/plugins/runtime`): a renderer per
  fence that draws into a plain element. `createPluginRuntime` loads clients
  on first use; `mountFence` mounts a block and returns its dispose, handling
  blocks that go away before their plugin has loaded or rendered.

Hosts adapt the browser half to their framework with a container element and
`mountFence`. `collect()` is unchanged and ignores `plugins`.
