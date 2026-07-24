# Quickstart example

A minimal repo layout for the `lectio` CLI: a `docs.config.mjs` plus a
`content/` tree. Running the CLI here produces a static, searchable site in
`dist/`.

```sh
npx lectio build
```

This example is also Lectio's own CLI dogfood: CI runs `lectio build` against it
on every push, so a change that breaks the packaged site — not just the demo in
[`apps/site-builder`](../../apps/site-builder) — turns the build red.
