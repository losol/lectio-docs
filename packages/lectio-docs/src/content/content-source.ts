import { stripFrontmatter } from './frontmatter.js';
import { buildTree } from './tree.js';
import type { ContentSource, CreateContentSourceOptions, PageMeta } from './types.js';

/**
 * Create a framework-agnostic content source over a collected {@link Manifest}.
 *
 * `getTree`/`getPages` are pure reads of the manifest; `getPage` defers to the
 * host-injected `loadBody` for the file contents, then strips frontmatter so the
 * host receives raw markdown to render however it likes.
 */
export function createContentSource({ manifest, loadBody }: CreateContentSourceOptions): ContentSource {
  const pages = manifest.pages;
  const bySlug = new Map<string, PageMeta>(pages.map((p) => [normalizeSlug(p.slug), p]));
  const tree = buildTree(pages);

  return {
    getPages() {
      return pages;
    },
    getTree() {
      return tree;
    },
    async getPage(slug) {
      const meta = bySlug.get(normalizeSlug(slug));
      if (!meta) return null;
      const raw = await loadBody(meta);
      return { ...meta, body: stripFrontmatter(raw) };
    },
  };
}

/** Tolerate a missing leading slash and a trailing slash when looking up a page. */
function normalizeSlug(slug: string): string {
  let s = slug.startsWith('/') ? slug : `/${slug}`;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}
