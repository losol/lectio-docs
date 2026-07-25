---
title: Getting started
description: Two ways to turn scattered docs into a site
---

# Getting started

There are two ways to use Lectio, depending on how much control you want.

## The fast path — the CLI

If you just want a docs site, the `lectio` CLI collects your markdown and builds
it for you. No app code:

```sh
npx lectio-docs dev
```

It scaffolds a starter `docs.config.ts` and opens a local server, so a fresh
repo shows a site right away. See [The lectio CLI](/cli) for configuring
sources, branding and deploy.

## The library path — embed it in your app

If you want to own routing, rendering and theme, use the toolkit directly: point
the collector at your sources, then read them back through the content source.

### 1. Describe your sources

A source is a glob plus the target path it should land under:

```ts
{
  output: '.lectio',
  sources: [
    { glob: 'docs/**/*.md', target: '/' },
    { glob: 'libs/*/README.md', target: '/libraries', titleFromPackageJson: true },
  ],
}
```

### 2. Collect

`collect()` copies each match into the output directory, enriches its
frontmatter, and writes `manifest.json` alongside it.

### 3. Read it back

`createContentSource({ manifest, loadBody })` gives you the navigation tree and
individual pages. Rendering stays entirely yours.

Under the hood, the CLI is exactly this library wired into a React Router app —
so both paths share the same collector and content source.
