# lectio-docs

## 0.2.0

### Minor Changes

- e4ffa3f: Add `lectio dev` and zero-config scaffolding.

  `lectio dev` materializes the site app and runs `react-router dev` (a local dev
  server with HMR on the UI); content is collected once at startup. With no
  `docs.config`, `dev` scaffolds a starter `docs.config.ts` (`**/*.md`) so a fresh
  repo shows a demo immediately; `build` asks first when interactive and errors in
  CI rather than writing files silently.

## 0.1.1

### Patch Changes

- 4f83022: Fix dependency resolution when installed via pnpm. pnpm creates an empty
  `node_modules` inside the package in its virtual store, so the CLI mistook it
  for the dependency dir and materialized a site whose `node_modules` was empty —
  the React Router build then failed to resolve `vite` / `@react-router/dev`. It
  now picks the directory that actually holds a known dependency.
