import { stripFrontmatter } from './frontmatter.js';
import { buildTree } from './tree.js';
import type { ContentSource, CreateContentSourceOptions, PageMeta } from './types.js';

/** Locale assumed for a page, and for a read, that names none. */
const FALLBACK_LOCALE = 'en';

/**
 * Create a framework-agnostic content source over a collected {@link Manifest}.
 *
 * `getTree`/`getPages` are pure reads of the manifest; `getPage` defers to the
 * host-injected `loadBody` for the file contents, then strips frontmatter so the
 * host receives raw markdown to render however it likes.
 *
 * A page is identified by its slug *and* its locale, so the translations of one
 * document share a slug and stay one page in the navigation. Manifests without
 * locales are the same thing with one locale, and behave exactly as before.
 */
export function createContentSource({
  manifest,
  loadBody,
  defaultLocale = FALLBACK_LOCALE,
}: CreateContentSourceOptions): ContentSource {
  const pages = manifest.pages;

  // Slug → its versions, keyed by locale. Insertion order is manifest order,
  // which getPages/getTree preserve.
  const bySlug = new Map<string, Map<string, PageMeta>>();
  const locales: string[] = [];

  for (const page of pages) {
    const slug = normalizeSlug(page.slug);
    const locale = page.locale ?? defaultLocale;

    let versions = bySlug.get(slug);
    if (versions === undefined) {
      versions = new Map();
      bySlug.set(slug, versions);
    }

    const clash = versions.get(locale);
    if (clash) {
      throw new Error(
        `Duplicate page slug "${slug}" for locale "${locale}" in manifest ` +
          `(from "${clash.source}" and "${page.source}"). ` +
          'Slugs must be unique per locale after normalization.',
      );
    }
    versions.set(locale, page);
    if (!locales.includes(locale)) locales.push(locale);
  }

  /** The version of a page closest to `locale`: it, else the default, else any. */
  const resolve = (versions: Map<string, PageMeta>, locale: string): PageMeta | undefined =>
    versions.get(locale) ?? versions.get(defaultLocale) ?? versions.values().next().value;

  const pagesFor = (locale: string): PageMeta[] => {
    const resolved: PageMeta[] = [];
    for (const versions of bySlug.values()) {
      const page = resolve(versions, locale);
      if (page !== undefined) resolved.push(page);
    }
    return resolved;
  };

  // A tree is pure over the manifest, so it is built once per locale rather
  // than on every read — hosts call getTree on each request.
  const treeCache = new Map<string, ReturnType<typeof buildTree>>();

  return {
    getPages(locale = defaultLocale) {
      return pagesFor(locale);
    },
    getTree(locale = defaultLocale) {
      let tree = treeCache.get(locale);
      if (tree === undefined) {
        tree = buildTree(pagesFor(locale));
        treeCache.set(locale, tree);
      }
      // Fresh array so callers can't mutate the cached one.
      return [...tree];
    },
    getLocales() {
      return [...locales];
    },
    async getPage(slug, locale = defaultLocale) {
      const versions = bySlug.get(normalizeSlug(slug));
      const meta = versions === undefined ? undefined : resolve(versions, locale);
      if (!meta) return null;
      const raw = await loadBody(meta);
      return { ...meta, locale: meta.locale ?? defaultLocale, body: stripFrontmatter(raw) };
    },
  };
}

/** Tolerate a missing leading slash and a trailing slash when looking up a page. */
function normalizeSlug(slug: string): string {
  let s = slug.startsWith('/') ? slug : `/${slug}`;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s;
}
