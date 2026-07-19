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

  const bySlug = new Map<string, PageMeta>();
  for (const page of pages) {
    const key = normalizeSlug(page.slug);
    const clash = bySlug.get(key);
    if (clash) {
      throw new Error(
        `Duplicate page slug "${key}" in manifest (from "${clash.slug}" and "${page.slug}"). ` +
          'Slugs must be unique after normalization.',
      );
    }
    bySlug.set(key, page);
  }

  const tree = buildTree(pages);

  return {
    // Return fresh arrays so callers can't mutate the source's internal state.
    getPages() {
      return [...pages];
    },
    getTree() {
      return [...tree];
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
