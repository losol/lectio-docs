# lectio-docs

## 0.2.4

### Patch Changes

- Updated dependencies [cd27ea7]
  - @eventuras/lectio-docs@0.5.0
  - @eventuras/lectio-docs-react@0.1.4

## 0.2.3

### Patch Changes

- Updated dependencies [e8dc6b3]
- Updated dependencies [e8dc6b3]
- Updated dependencies [453347d]
- Updated dependencies [c8153bb]
- Updated dependencies [47461aa]
  - @eventuras/lectio-docs@0.4.0
  - @eventuras/lectio-docs-react@0.1.3

## 0.2.2

### Patch Changes

- Updated dependencies [f606a78]
  - @eventuras/lectio-docs@0.3.1
  - @eventuras/lectio-docs-react@0.1.2

## 0.2.1

### Patch Changes

- 307fcc0: Fix `lectio dev` rendering a blank page when run via `npx` (or any install where
  dependencies resolve outside the site dir). The materialized dev server now lets
  Vite read the symlinked dependencies, so React Router's client entry loads.
- 2cf619d: Generated `.lectio/` and `dist/` directories now self-ignore: `lectio` writes a
  `.gitignore` inside each, so they stay out of the consumer's `git status`
  without the CLI ever modifying the repo's root `.gitignore`.

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
