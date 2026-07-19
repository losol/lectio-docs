/**
 * The framework-agnostic content-source contract.
 *
 * Pure TS — no React, no Node. `collect()` emits a {@link Manifest}; a host
 * builds a {@link ContentSource} from it and injects how bodies are loaded
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
  /** Output-relative path to the collected file — the key `loadBody` receives. */
  file: string;
  /** Section this page belongs to, e.g. "/libraries" (the source's target). */
  section?: string;
  /** Full frontmatter, for host-specific extension beyond the typed fields. */
  frontmatter: Record<string, unknown>;
}

/** The serialized output of `collect()` — metadata only, bodies stay on disk. */
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

/** Host-injected body loader. Receives a page's metadata (use `page.file`). */
export type LoadBody = (page: PageMeta) => string | Promise<string>;

export interface CreateContentSourceOptions {
  /** The manifest emitted by `collect()`. */
  manifest: Manifest;
  /** How to load a page's raw file contents. Sync or async. */
  loadBody: LoadBody;
}

export interface ContentSource {
  /** Navigation tree derived from page slugs. Pure, synchronous. */
  getTree(): TreeNode[];
  /** Flat list of all page metadata, in collection order. Pure, synchronous. */
  getPages(): PageMeta[];
  /** Load one page (metadata + body) by slug; `null` if the slug is unknown. */
  getPage(slug: string): Promise<Page | null>;
}
