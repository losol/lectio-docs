---
title: Configuration
description: Sources, targets, slugs and frontmatter
---

# Configuration

## Targets and slugs

Each collected file lands under its source's `target`, and its slug follows the
resulting output path:

| Source file | Target | Output file | Slug |
| --- | --- | --- | --- |
| `docs/index.md` | `/` | `index.md` | `/` |
| `docs/guides/configuration.md` | `/` | `guides/configuration.md` | `/guides/configuration` |
| `libs/event-sdk/README.md` | `/libraries` | `libraries/event-sdk.md` | `/libraries/event-sdk` |

`README.md` is renamed to its parent directory's name, so a library's readme
becomes a page named after the library.

## Navigation order

The sidebar follows the order pages appear in the manifest, which is the order
your `sources` are listed — so reordering sources reorders the sidebar. Two
rules override it: the home page always leads, and `adr/` (or `decisions/`)
sinks to the bottom of whatever level it sits on, since decision records are
reference material rather than reading material.

## Frontmatter

Existing frontmatter is preserved. Missing values are filled in: the title falls
back to `package.json` (when configured) and then to the first heading, and a
`source` field recording the original repo-relative path is always added.
