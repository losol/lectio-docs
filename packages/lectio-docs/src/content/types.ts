/**
 * The framework-agnostic content-source contract.
 *
 * Pure TS — no React, no Node. A build-time `collect()` step emits a
 * {@link Manifest} (roadmap Phase 2); a host builds a {@link ContentSource}
 * from it and injects how bodies are loaded
 * (`fetch` in a SPA, `import.meta.glob` with a bundler, `fs` in Node, an
 * importer in Payload). Lectio never assumes which framework it runs in.
 */

/** A single collected document, as recorded in the manifest (metadata, no body). */
export interface PageMeta {
  /** URL path, always starting with "/", e.g. "/libraries/event-sdk". */
  slug: string;
  /** Human title (frontmatter › package.json › first heading › filename). */
  title: string;
  /** Optional short description from frontmatter. */
  description?: string;
  /** Repo-relative path to the original source file (provenance / edit links). */
  source: string;
  /**
   * Resolved "edit this page" link for the original source file, when the
   * collector was configured with an `editUrl` template. Resolved at collect
   * time because only the collector knows which repo a page came from.
   */
  editUrl?: string;
  /** Output-relative path to the collected file — the key `loadBody` receives. */
  file: string;
  /** Section this page belongs to, e.g. "/libraries" (the source's target). */
  section?: string;
  /**
   * BCP-47 locale tag this page is written in, e.g. "nb". Omitted for a page
   * that declares none, which the content source reads as its `defaultLocale`
   * — so a single-language manifest, and every manifest written before locales
   * existed, keeps working unchanged.
   */
  locale?: string;
  /** Full frontmatter, for host-specific extension beyond the typed fields. */
  frontmatter: Record<string, unknown>;
}

/**
 * The serialized output of the build-time collector — metadata only, bodies
 * stay on disk. (Emitting this from `collect()` is roadmap Phase 2.)
 */
export interface Manifest {
  /** Manifest schema version, for forward-compatibility. */
  version: 1;
  /** All collected pages, in collection order. */
  pages: PageMeta[];
}

/** A page with its body loaded. */
export interface Page extends PageMeta {
  /** Raw markdown body (frontmatter stripped). The host owns rendering. */
  body: string;
}

/** A node in the navigation tree. May be a section, a page, or both. */
export interface TreeNode {
  /** Display title (a page's title, or a humanized segment for bare sections). */
  title: string;
  /** Present when this node is itself a page (a section can have an index page). */
  slug?: string;
  /** Child nodes nested under this one, in collection order. */
  children: TreeNode[];
}

/** A link resolved to the page it points at, and whatever followed the path. */
export interface ResolvedLink {
  page: PageMeta;
  /** The `#fragment` or `?query` the href carried, or an empty string. */
  suffix: string;
}

/** Host-injected body loader. Receives a page's metadata (use `page.file`). */
export type LoadBody = (page: PageMeta) => string | Promise<string>;

export interface CreateContentSourceOptions {
  /** The manifest emitted by `collect()`. */
  manifest: Manifest;
  /** How to load a page's raw file contents. Sync or async. */
  loadBody: LoadBody;
  /**
   * Locale a page with no `locale` of its own is taken to be written in, and
   * the one every read falls back to. Defaults to `"en"`.
   */
  defaultLocale?: string;
}

export interface ContentSource {
  /**
   * Navigation tree derived from page slugs, one entry per slug: the requested
   * locale's version of a page where there is one, the fallback otherwise. A
   * nav that hid untranslated pages would be worse than one that shows them in
   * another language. Pure, synchronous.
   */
  getTree(locale?: string): TreeNode[];
  /** Flat list of page metadata, resolved for a locale the same way. Pure, synchronous. */
  getPages(locale?: string): PageMeta[];
  /**
   * Load one page (metadata + body) by slug, in the closest locale available:
   * the one asked for, else the default. The returned `locale` is the one the
   * page is actually written in, so a host can tell the reader when it differs
   * from what they asked for. `null` if the slug is unknown.
   */
  getPage(slug: string, locale?: string): Promise<Page | null>;
  /**
   * Locales the manifest holds, in first-seen order. Pages that declare none
   * count as `defaultLocale`, so a single-language manifest reports exactly
   * `[defaultLocale]` rather than nothing — one locale, not zero.
   */
  getLocales(): string[];
  /**
   * The page a relative `*.md` link points at, resolved against the `source`
   * path of the document containing it — pass `page.source`.
   *
   * Documentation is authored to read on disk and on a forge as well as in a
   * host, so documents link to each other by path. Resolving against the
   * source rather than the bare filename is what lets two sections each hold a
   * `config.md`, and settles language on the way: a link from `nb/privacy.md`
   * to `terms.md` lands on the Norwegian version of that page.
   *
   * Null for off-site, root-relative and anchor-only hrefs, and for files the
   * manifest doesn't hold — leave those as the author wrote them, so a typo
   * reads as a broken link instead of pointing somewhere unintended.
   */
  resolveLink(href: string, fromSource: string): ResolvedLink | null;
}
