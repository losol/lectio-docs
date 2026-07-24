import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Docs occupy the site root: manifest slugs map 1:1 onto URLs, and one module
// (docs.tsx) serves them all — "/" via the index route, everything else via the
// splat, which reads the slug from params["*"]. Search lives in the site header
// (CommandPalette, ⌘K), so there is no route for it.
//
// Under ssr:false every route exporting a loader must have prerendered paths,
// so each route is included only when it has pages to serve: the index only
// when there is a root page, the splat only when there are non-root pages.
// Without this a single-page site fails the build. Content location comes from
// the generated lectio.config.json, read via cwd (the build runs there).
const { contentDir } = JSON.parse(
  readFileSync(join(process.cwd(), 'lectio.config.json'), 'utf-8'),
) as { contentDir: string };
const manifest = JSON.parse(
  readFileSync(join(contentDir, 'manifest.json'), 'utf-8'),
) as { pages: Array<{ slug: string }> };

const hasRoot = manifest.pages.some((page) => page.slug === '/');
const hasNonRoot = manifest.pages.some((page) => page.slug !== '/');

export default [
  ...(hasRoot ? [index('routes/docs.tsx', { id: 'docs-index' })] : []),
  ...(hasNonRoot ? [route('*', 'routes/docs.tsx')] : []),
] satisfies RouteConfig;
