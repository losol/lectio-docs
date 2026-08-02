---
title: Deploy to Cloudflare
description: Publish the built dist/ as a static site with Wrangler
---

# Deploy to Cloudflare

`npx lectio-docs build` leaves a fully static site in `./dist` — every page
prerendered to HTML, with the search index at `/search-index.json`. Nothing
runs server-side, so Cloudflare can serve it as plain static assets.

## The fast path — Wrangler and Pages

```sh
npx lectio-docs build                                 # writes ./dist
npx wrangler login                                    # first time only
npx wrangler pages deploy dist --project-name my-docs
```

The first deploy creates the Pages project and prints its URL —
`https://my-docs.pages.dev`. Every later run publishes a new version of the
same project, so "redeploy" is just `build` followed by `deploy`.

## Unknown routes

Every page is prerendered, so real links resolve to real HTML files. For paths
that don't exist, the build also emits `__spa-fallback.html` — an app shell for
hosts that let you name a fallback document. On Cloudflare Pages that document
is `404.html`, so copy it into place before deploying:

```sh
cp dist/__spa-fallback.html dist/404.html
```

Without a `404.html`, Pages assumes a single-page app and answers unknown paths
with the home page's HTML instead.

## Deploying from CI

The same command works headless with two environment variables: a
`CLOUDFLARE_API_TOKEN` (create one with the "Cloudflare Pages — Edit"
permission) and your `CLOUDFLARE_ACCOUNT_ID`.

```sh
npx lectio-docs build
cp dist/__spa-fallback.html dist/404.html
npx wrangler pages deploy dist --project-name my-docs
```

Alternatively, connect the repo in the Cloudflare dashboard (Workers & Pages →
Create → Pages) with `npx lectio-docs build` as the build command and `dist` as
the output directory, and every push deploys itself.

## The Workers alternative

Cloudflare now steers new projects toward Workers with static assets. It's the
same static `dist/`, plus a small config at the repo root:

```jsonc
// wrangler.jsonc
{
  "name": "my-docs",
  "compatibility_date": "2026-08-02",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

```sh
npx wrangler deploy
```

Pick this when you expect the site to grow server-side behavior later; for a
plain docs site, Pages is the shorter road.

## Custom domain

Either way, attach a domain in the dashboard under the project's **Custom
domains** tab — Cloudflare handles the certificate and DNS record.
