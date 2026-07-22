import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Config } from '@react-router/dev/config';

/**
 * Static site. Every collected page is prerendered at build time, so there is
 * no server to run — the output is plain HTML on a CDN.
 *
 * Prerendering still executes the loaders, but in Node at build time, which is
 * why `content.server.ts` can keep reading the collected markdown from disk.
 * The path list is simply the manifest's slugs: collect() has already decided
 * what exists, and slugs map 1:1 onto URLs.
 */
export default {
  ssr: false,
  async prerender() {
    const manifestPath = fileURLToPath(new URL('.lectio/manifest.json', import.meta.url));
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      pages: Array<{ slug: string; }>;
    };

    return manifest.pages.map((page) => page.slug);
  },
} satisfies Config;
