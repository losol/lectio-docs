import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Config } from '@react-router/dev/config';

// Written by the CLI at materialization time: absolute content dir + branding.
const generated = JSON.parse(
  readFileSync(fileURLToPath(new URL('lectio.config.json', import.meta.url)), 'utf-8'),
) as { contentDir: string };

/**
 * Static site: every collected page is prerendered, the path list is the
 * manifest's slugs. Loaders run in Node at build time, so reading content
 * from disk is fine.
 */
export default {
  ssr: false,
  async prerender() {
    const manifest = JSON.parse(
      readFileSync(join(generated.contentDir, 'manifest.json'), 'utf-8'),
    ) as { pages: Array<{ slug: string }> };

    return manifest.pages.map((page) => page.slug);
  },
} satisfies Config;
