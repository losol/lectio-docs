import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

import { create, insert, save } from '@orama/orama';

import { stripFrontmatter } from '../content/frontmatter.js';
import type { Manifest } from '../content/types.js';
import { DOCS_SCHEMA } from './schema.js';

interface BuildSearchIndexOptions {
  /** Directory holding the collected output: `manifest.json` plus its markdown */
  contentDir: string;
  /** Output path for the serialized index JSON */
  outputPath: string;
  /** Optional callback for logging progress */
  log?: (message: string) => void;
}

/**
 * Build an Orama search index from a collected manifest and its markdown.
 *
 * Indexing the manifest rather than a framework's built HTML is what makes this
 * host-agnostic: titles and URLs come straight from the manifest's metadata and
 * slugs, so React Router, Next and any other host get the same index — no built
 * site required.
 */
export async function buildSearchIndex({
  contentDir,
  outputPath,
  log,
}: BuildSearchIndexOptions): Promise<number> {
  const db = create({ schema: DOCS_SCHEMA });

  const root = resolve(contentDir);

  const manifest = JSON.parse(
    readFileSync(join(root, 'manifest.json'), 'utf-8'),
  ) as Manifest;

  let indexed = 0;

  for (const page of manifest.pages) {
    // Keep reads inside contentDir: a tampered or untrusted manifest must not
    // pull arbitrary files into an index that ships as a public asset.
    const filePath = resolve(root, page.file);
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      throw new Error(`Refusing to read outside the content directory: ${page.file}`);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const content = markdownToText(stripFrontmatter(raw));

    if (!content.trim()) continue;

    insert(db, { title: page.title, content, url: page.slug });
    indexed++;
  }

  // Orama's own `save()` — see OramaProvider for why the persistence plugin is
  // avoided. Emits a plain JSON object, so the file is single-encoded.
  const snapshot = await save(db);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(snapshot));

  log?.(`Indexed ${indexed} pages → ${relative(process.cwd(), outputPath)}`);

  return indexed;
}

/**
 * Reduce markdown to plain prose so the index matches words, not syntax.
 * Link text is kept, code blocks and URLs are dropped.
 */
function markdownToText(markdown: string): string {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, ' ')
    .replaceAll(/~~~[\s\S]*?~~~/g, ' ')
    .replaceAll(/`([^`]*)`/g, '$1')
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/^\s{0,3}#{1,6}\s+/gm, '')
    .replaceAll(/^\s{0,3}>\s?/gm, '')
    .replaceAll(/^\s*[-*+]\s+/gm, '')
    .replaceAll(/^\s*\d+\.\s+/gm, '')
    .replaceAll(/^\s*\|?[\s:|-]{4,}\|?\s*$/gm, ' ')
    .replaceAll(/[|*_~]/g, ' ')
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/&[a-z]+;/gi, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
