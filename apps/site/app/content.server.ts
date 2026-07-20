import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  createContentSource,
  type ContentSource,
  type Manifest,
} from '@eventuras/lectio-docs/content';

// Output of `pnpm collect` (scripts/collect.mjs) — generated, not committed.
const CONTENT_DIR = resolve(process.cwd(), '.lectio');

let cached: ContentSource | null = null;

/**
 * Build the content source from the collected manifest, loading bodies from disk.
 *
 * `fs` is the right seam for this host: it works for SSR today, and keeps working
 * when the site flips to `ssr: false` + `prerender`, since prerendering runs
 * loaders in Node at build time.
 */
export function getContentSource(): ContentSource {
  if (cached) return cached;

  const manifest = JSON.parse(
    readFileSync(join(CONTENT_DIR, 'manifest.json'), 'utf-8'),
  ) as Manifest;

  cached = createContentSource({
    manifest,
    loadBody: (page) => readFileSync(join(CONTENT_DIR, page.file), 'utf-8'),
  });

  return cached;
}
