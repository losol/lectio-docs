import { stripFrontmatter } from './frontmatter.js';
import { normalizeSlug, resolveRelativePath } from './paths.js';
import { buildTree } from './tree.js';
import type {
  ContentSource,
  CreateContentSourceOptions,
  PageMeta,
  ResolvedLink,
} from './types.js';

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
  // Original path → page, for resolving the links documents make to each other.
  const bySource = new Map<string, PageMeta>();
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
    bySource.set(page.source.replaceAll('\\', '/'), page);
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
  // than on every read — hosts call getTree on each request. A locale the
  // manifest doesn't hold shares the default's entry: it resolves to exactly
  // the same pages, and a host forwarding raw Accept-Language values must not
  // be able to grow the cache without bound.
  const treeCache = new Map<string, ReturnType<typeof buildTree>>();
  const cacheKey = (locale: string): string =>
    locales.includes(locale) ? locale : defaultLocale;

  return {
    getPages(locale = defaultLocale) {
      return pagesFor(locale);
    },
    getTree(locale = defaultLocale) {
      const key = cacheKey(locale);
      let tree = treeCache.get(key);
      if (tree === undefined) {
        tree = buildTree(pagesFor(key));
        treeCache.set(key, tree);
      }
      // Fresh array, so reordering it can't disturb the cache. The nodes inside
      // are shared — deep-copying every read would defeat caching the tree.
      return [...tree];
    },
    getLocales() {
      return [...locales];
    },
    resolveLink(href, fromSource) {
      return resolveLink(href, fromSource, bySource);
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

// `scheme:` or protocol-relative `//host` — anything that leaves this origin.
const ABSOLUTE_HREF = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * The page a relative `*.md` link points at, resolved against the path of the
 * document containing it.
 *
 * Resolving against the *source* rather than the filename is what makes nested
 * documentation work: two sections can each hold a `config.md`, and
 * `[overview](../guides/config.md)` still lands on the right one. It also
 * settles language for free — a link from `nb/privacy.md` to `terms.md`
 * resolves to `nb/terms.md`, the Norwegian version of that page.
 *
 * Off-site, root-relative and anchor-only hrefs, and files the manifest does
 * not hold, all return null: the host leaves those alone rather than guessing.
 */
function resolveLink(
  href: string,
  fromSource: string,
  bySource: Map<string, PageMeta>,
): ResolvedLink | null {
  if (href === '' || href.startsWith('#') || href.startsWith('/') || ABSOLUTE_HREF.test(href)) {
    return null;
  }

  const suffixAt = href.search(/[#?]/);
  const path = suffixAt === -1 ? href : href.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? '' : href.slice(suffixAt);
  if (!/\.mdx?$/i.test(path)) return null;

  const target = resolveRelativePath(fromSource, safeDecode(path));
  const page = bySource.get(target);
  return page === undefined ? null : { page, suffix };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
