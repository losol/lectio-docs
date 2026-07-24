import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '@react-router/dev/config';

/**
 * Static site. Every collected page is prerendered at build time, so there is
 * no server to run — the output is plain HTML on a CDN.
 *
 * Prerendering still executes the loaders, but in Node at build time, which is
 * why `content.server.ts` can keep reading the collected markdown from disk.
 * The path list is simply the manifest's slugs: collect() has already decided
 * what exists, and slugs map 1:1 onto URLs.
 *
 * Content location comes from the generated lectio.config.json, read via cwd —
 * the same file routes.ts and content.server.ts read. Written next to the build
 * by this app's collect script (the demo) or by the lectio CLI when it
 * materializes this app for another repo, so the wiring is identical in both.
 */
export default {
  ssr: false,
  async prerender() {
    const { contentDir } = JSON.parse(
      readFileSync(join(process.cwd(), 'lectio.config.json'), 'utf-8'),
    ) as { contentDir: string };
    const manifest = JSON.parse(
      readFileSync(join(contentDir, 'manifest.json'), 'utf-8'),
    ) as { pages: Array<{ slug: string }> };

    return manifest.pages.map((page) => page.slug);
  },
} satisfies Config;
