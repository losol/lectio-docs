import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

import {
  createContentSource,
  type ContentSource,
  type Manifest,
} from '@eventuras/lectio-docs/content';

// Absolute path to the collected content (manifest.json + markdown), from the
// generated lectio.config.json. Written next to the app before every build —
// by this app's collect script here, by the lectio CLI when it materializes
// this app elsewhere — so this module is generic. Located via cwd, which the
// build always runs in.
const { contentDir } = JSON.parse(
  readFileSync(join(process.cwd(), 'lectio.config.json'), 'utf-8'),
) as { contentDir: string };
const root = resolve(contentDir);

let cached: ContentSource | null = null;

/**
 * Build the content source from the collected manifest, loading bodies from disk.
 *
 * `fs` is the right seam for this host: prerendering runs loaders in Node at
 * build time, so the static output needs no server.
 */
export function getContentSource(): ContentSource {
  if (cached) return cached;

  const manifest = JSON.parse(
    readFileSync(join(root, 'manifest.json'), 'utf-8'),
  ) as Manifest;

  cached = createContentSource({
    manifest,
    loadBody: (page) => {
      // Resolve and enforce a separator boundary so a page.file can't escape
      // contentDir via `..` or a prefix like `${contentDir}2/…`.
      const filePath = resolve(root, page.file);
      if (filePath !== root && !filePath.startsWith(root + sep)) {
        throw new Error(`Refusing to read outside the content directory: ${page.file}`);
      }
      return readFileSync(filePath, 'utf-8');
    },
  });

  return cached;
}
