---
title: The lectio CLI
description: One command — collect your docs and get a searchable site
---

# The `lectio` CLI

The `lectio-docs` package ships a `lectio` command that turns a repo's markdown
into a static, searchable docs site — with no app code to write.

```sh
npx lectio-docs dev     # collect + serve locally, with live reload on the UI
npx lectio-docs build   # collect + build a static site into ./dist
```

> The npm package is `lectio-docs`; the command it installs is `lectio`. Once
> it's a dependency of your repo you can run `lectio dev` / `lectio build`
> directly.

## Try it in seconds

Run `dev` in any repo that has markdown in it:

```sh
npx lectio-docs dev
```

With no `docs.config` present, it writes a starter one and opens a local
server, so you see your docs as a site immediately. The starter follows the
repo's shape: root `docs/` comes first, then app readmes and docs under
**Apps**, then **Packages** and **Libs**. Directory-name variants land in the
same group — `apps/` or `Applications/` both become `/apps`, and `libs/` or
`Libraries/` become `/libs`. A repo with none of those directories gets a
whole-tree `**/*.md` sweep instead. Source order is sidebar order, so
regrouping is just editing the generated `docs.config.ts` and re-running.

## Configure your sources

A `docs.config.ts` (or `.js` / `.mjs`) at the repo root describes what to gather
and how to brand it:

```ts
export default {
  output: '.lectio',
  sources: [
    { glob: 'docs/**/*.md', target: '/' },
    {
      glob: 'libs/*/README.md',
      target: '/libraries',
      titleFromPackageJson: true,
      sectionTitle: 'Libraries',
    },
  ],
  editUrl: 'https://github.com/your-org/your-repo/edit/main/{path}',
  site: {
    title: 'Developer Docs',
    githubUrl: 'https://github.com/your-org/your-repo',
  },
};
```

- **`sources`** — each is a glob plus the `target` path it mounts under. Globs
  are relative to where you run the command; `node_modules`, `dist`, `.next` and
  dotfiles are skipped automatically.
- **`editUrl`** — an "edit this page" link template; `{path}` is filled per page.
- **`site`** — the title and GitHub link shown in the header.

See [Configuration](/guides/configuration) for how targets become slugs.

## Build and deploy

```sh
npx lectio-docs build
```

This prerenders every page to static HTML in `./dist`, with a search index at
`/search-index.json`. Deploy `dist/` to any static host — Cloudflare Pages,
Netlify, GitHub Pages, an object store:

```sh
# Cloudflare Pages, for example
npx wrangler pages deploy dist --project-name my-docs
```

See [Deploy to Cloudflare](/deployment/cloudflare) for the full walkthrough —
fallback pages, CI and custom domains.

## `dev` vs `build` when there's no config

- **`dev`** scaffolds a starter `docs.config.ts` and runs — it's the on-ramp for
  trying things out.
- **`build`** never writes files on its own: it asks first when interactive, and
  errors in CI. A build stays deterministic.
