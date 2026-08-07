/**
 * Turning a file path into a page: the slug it gets, and the language it is
 * written in. Pure string work, no filesystem and no `node:path`, so a host
 * that reads its content at runtime can build a manifest with exactly the
 * logic `collect()` uses at build time.
 */

/** A file path's page identity. */
export interface PagePath {
  /** URL path, always starting with "/". */
  slug: string;
  /** BCP-47 locale tag the document is written in. */
  locale: string;
}

export interface PathToPageOptions {
  /** Locales recognised in a filename suffix or a path segment. */
  locales?: readonly string[];
  /** Locale for a document that declares none. Defaults to `"en"`. */
  defaultLocale?: string;
  /**
   * The document's frontmatter, when the caller has read it. `slug:` overrides
   * the path-derived slug, and `locale:`/`language:` the path-derived locale.
   */
  frontmatter?: Record<string, unknown>;
}

/**
 * The slug and locale a file path resolves to.
 *
 * `file` is relative to the **root of the content set** — the directory the
 * slugs are counted from — not to the repository. A host scanning a mounted
 * `/app/content` passes `nb/terms-of-use.md`, not `content/nb/terms-of-use.md`,
 * or the extra segment lands in the URL.
 *
 * ```ts
 * pathToPage('nb/terms-of-use.md', { locales: ['en', 'nb'] })
 * // → { slug: '/terms-of-use', locale: 'nb' }
 *
 * pathToPage('nb/terms-of-use.md', {
 *   locales: ['en', 'nb'],
 *   frontmatter: { slug: 'terms' },
 * })
 * // → { slug: '/terms', locale: 'nb' }
 * ```
 *
 * The locale marker is dropped from the slug in every form, so `terms.md`,
 * `terms.nb.md` and `nb/terms.md` are one page in three languages.
 */
export function pathToPage(file: string, options: PathToPageOptions = {}): PagePath {
  const locales = options.locales ?? [];
  const frontmatter = options.frontmatter ?? {};
  const declaredSlug = asNonEmptyString(frontmatter.slug);

  return {
    slug: declaredSlug === null ? pathToSlug(file, locales) : normalizeSlug(declaredSlug),
    locale: pathToLocale(file, {
      locales,
      defaultLocale: options.defaultLocale ?? 'en',
      frontmatter,
    }),
  };
}

/**
 * Map a file path to a URL slug: `index.md` → `/`, `guides/index.md` →
 * `/guides`, `libraries/x.md` → `/libraries/x`. Locale markers are dropped, so
 * translations of a document share one URL.
 */
export function pathToSlug(file: string, locales: readonly string[] = []): string {
  const segments = toPosix(file)
    .split('/')
    .filter((segment) => segment !== '' && !locales.includes(segment));

  let slug = '/' + segments.join('/');
  slug = slug.replace(/\.mdx?$/i, '');
  slug = stripLocaleSuffix(slug, locales);
  slug = slug.replace(/\/index$/i, '');
  return slug || '/';
}

/**
 * The locale a document is written in: what its frontmatter declares, else a
 * recognised filename suffix or path segment, else the default.
 *
 * Frontmatter outranks the path because it is the only mechanism available
 * when the filename isn't the author's to choose — a package's `README.md`.
 */
export function pathToLocale(
  file: string,
  options: { locales?: readonly string[]; defaultLocale?: string; frontmatter?: Record<string, unknown> } = {},
): string {
  const locales = options.locales ?? [];
  const frontmatter = options.frontmatter ?? {};

  const declared = asNonEmptyString(frontmatter.locale ?? frontmatter.language);
  if (declared !== null) return declared;

  const segments = toPosix(file).split('/');

  // The name outranks the directory: `nb/terms.en.md` is English filed under a
  // Norwegian directory, and naming the file is the more deliberate act.
  const name = (segments.at(-1) ?? '').replace(/\.mdx?$/i, '');
  const suffix = name.slice(name.lastIndexOf('.') + 1);
  if (locales.includes(suffix)) return suffix;

  return segments.slice(0, -1).find((segment) => locales.includes(segment)) ?? options.defaultLocale ?? 'en';
}

/** Drops a trailing `.<locale>` from an extension-less path. */
export function stripLocaleSuffix(path: string, locales: readonly string[]): string {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= path.lastIndexOf('/')) return path;
  return locales.includes(path.slice(lastDot + 1)) ? path.slice(0, lastDot) : path;
}

/** A leading slash, and no trailing one — the shape every slug is compared in. */
export function normalizeSlug(slug: string): string {
  const withLeading = slug.startsWith('/') ? slug : `/${slug}`;
  return withLeading.length > 1 && withLeading.endsWith('/')
    ? withLeading.slice(0, -1)
    : withLeading;
}

/**
 * Resolve a relative path against the directory of `from`, the way a link in a
 * markdown file reads on disk. POSIX semantics only — these are repo-relative
 * paths, never platform paths.
 */
export function resolveRelativePath(from: string, relative: string): string {
  const rooted = relative.startsWith('/');
  const segments = rooted ? [] : toPosix(from).split('/').slice(0, -1);

  for (const segment of toPosix(relative).replace(/^\//, '').split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment !== '..') {
      segments.push(segment);
    } else if (segments.length > 0 && segments.at(-1) !== '..') {
      segments.pop();
    } else if (!rooted) {
      // Climbing past the start keeps the `..`, the way POSIX normalize does.
      // Swallowing it would let `../../../c.md` land on a real `c.md` near the
      // top — a link pointing somewhere unintended, which is the one outcome
      // resolveLink exists to avoid. Left in, nothing in the manifest matches.
      segments.push('..');
    }
  }

  return segments.join('/');
}

function toPosix(path: string): string {
  return path.replaceAll('\\', '/');
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
