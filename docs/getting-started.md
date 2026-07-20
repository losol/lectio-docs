---
title: Getting started
description: Collect scattered docs into a single content tree
---

# Getting started

Point the collector at the places your documentation already lives, then read it
back through the content source.

## 1. Describe your sources

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

## 2. Collect

`collect()` copies each match into the output directory, enriches its
frontmatter, and writes `manifest.json` alongside it.

## 3. Read it back

`createContentSource({ manifest, loadBody })` gives you the navigation tree and
individual pages. Rendering stays entirely yours.
