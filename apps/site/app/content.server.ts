import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

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
    loadBody: (page) => {
      // The manifest is our own build artifact today, but keep the read
      // contained anyway: a manifest from elsewhere (a remote repo source, a
      // tampered build output) must not be able to escape CONTENT_DIR.
      const filePath = resolve(CONTENT_DIR, page.file);
      if (filePath !== CONTENT_DIR && !filePath.startsWith(CONTENT_DIR + sep)) {
        throw new Error(`Refusing to read outside the content directory: ${page.file}`);
      }
      return readFileSync(filePath, 'utf-8');
    },
  });

  return cached;
}
