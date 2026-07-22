import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

import {
  createContentSource,
  type ContentSource,
  type Manifest,
} from '@eventuras/lectio-docs/content';

// Written by the CLI at materialization time: absolute path to the collected
// content. Located via cwd, not import.meta.url — prerender runs this code
// BUNDLED into build/server/, where file-relative paths point wrong, while
// the CLI guarantees cwd is the materialized site dir for the whole build.
const raw = JSON.parse(
  readFileSync(join(process.cwd(), 'lectio.config.json'), 'utf-8'),
) as { contentDir: string };
const contentDir = resolve(raw.contentDir);

let cached: ContentSource | null = null;

/** Content source over the collected manifest, bodies loaded from disk. */
export function getContentSource(): ContentSource {
  if (cached) return cached;

  const manifest = JSON.parse(
    readFileSync(join(contentDir, 'manifest.json'), 'utf-8'),
  ) as Manifest;

  cached = createContentSource({
    manifest,
    loadBody: (page) => {
      // Resolve and enforce a separator boundary so a page.file can't escape
      // contentDir via `..` or a prefix like `${contentDir}2/…`.
      const filePath = resolve(contentDir, page.file);
      if (filePath !== contentDir && !filePath.startsWith(contentDir + sep)) {
        throw new Error(`Refusing to read outside the content directory: ${page.file}`);
      }
      return readFileSync(filePath, 'utf-8');
    },
  });

  return cached;
}
