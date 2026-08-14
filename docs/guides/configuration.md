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

## Links between documents

Write links the way they read on disk, so they work on GitHub and in an editor
too — a relative path to the other file, extension and all:

```markdown
See [the reference](../reference/config.md#targets) for the full list.
```

The site resolves those against the file the link is written in, not against
the URL, which is what lets two sections each hold a `config.md`. The `.md` is
dropped, the slug takes its place, and any `#anchor` survives.

A link to a file the site doesn't publish — a README outside your globs, a
`ROADMAP.md` at the repo root — goes to the repository instead, if you gave the
config a `sourceUrl`. Without one it is left exactly as written.

## Navigation order

The sidebar follows the order pages appear in the manifest, which is the order
your `sources` are listed — so reordering sources reorders the sidebar.

Within a source, name the folders you care about:

```ts
{ glob: 'docs/**/*.md', target: '/', order: ['concepts', 'reference', 'recipes'] }
```

`order` matches path segments wherever they occur, so eight sections holding
those same three subfolders read the same way in all eight, from one line. It is
also the only handle on a subfolder that has no page of its own — there is no
file to put frontmatter in.

A single page orders itself from its frontmatter:

```yaml
---
title: Adressering
order: 1
---
```

Position in the `order` list counts from 1 and means the same as the frontmatter
number, so the two mix at one level. Everything you don't name follows,
alphabetically — numeric-aware, so `2-setup.md` comes before `10-deploy.md`.

Two rules override all of it: the home page always leads, and `adr/` (or
`decisions/`) sinks to the bottom of whatever level it sits on — named in
`order` or not — since decision records are reference material rather than
reading material.

## Frontmatter

Existing frontmatter is preserved. Missing values are filled in: the title falls
back to `package.json` (when configured) and then to the first heading, and a
`source` field recording the original repo-relative path is always added.
