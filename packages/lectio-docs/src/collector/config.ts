export interface DocSource {
  /** Glob pattern relative to repo root, e.g. "docs/**​/*.mdx" or "libs/star/README.md" */
  glob: string;

  /** Target path in output directory, e.g. "/" or "/libraries" */
  target: string;

  /** Read title from nearest package.json "name" field (strips @scope/) */
  titleFromPackageJson?: boolean;

  /** Read description from nearest package.json "description" field */
  descriptionFromPackageJson?: boolean;

  /** Override the section title shown in navigation */
  sectionTitle?: string;
}

export interface DocsConfig {
  /** Output directory for collected docs (relative to config file) */
  output: string;

  /** Documentation sources to collect */
  sources: DocSource[];

  /**
   * Template for "edit this page" links, resolved per page at collect time
   * with `{path}` replaced by the source file's repo-relative path. A template
   * rather than repo+branch fields keeps the collector forge-agnostic —
   * GitHub, GitLab and Gitea all shape their edit URLs differently:
   *
   * - GitHub: `https://github.com/org/repo/edit/main/{path}`
   * - GitLab: `https://gitlab.com/org/repo/-/edit/main/{path}`
   *
   * Omit it and pages simply carry no `editUrl`.
   */
  editUrl?: string;

  /**
   * Locales this documentation set is written in, as BCP-47 tags, e.g.
   * `['en', 'nb']`. Only these are recognised in a filename suffix or a path
   * segment, which is what keeps `notes.draft.md` and `apps/v2/README.md` from
   * being read as translations. Omit for a single-language set and nothing
   * about collection changes.
   *
   * Frontmatter always wins over either — see {@link DocsConfig.defaultLocale}.
   */
  locales?: string[];

  /**
   * Locale a document that declares none is written in. Defaults to `"en"`.
   *
   * A document's locale is taken from the first of these that applies:
   *
   * 1. `locale:` (or `language:`) in its frontmatter — explicit, always wins,
   *    and the only mechanism available when the filename isn't ours to choose
   *    (a package's `README.md`).
   * 2. A filename suffix, `terms.nb.md`. The recommended convention for docs
   *    the repository does control: self-evident, and it survives being
   *    collected into one flat directory.
   * 3. A path segment, `nb/terms.md`, for repositories already laid out that way.
   * 4. This default.
   *
   * The locale is stripped from the slug either way, so every translation of a
   * document shares one URL and stays one page in the navigation.
   */
  defaultLocale?: string;
}

export function defineDocsConfig(config: DocsConfig): DocsConfig {
  return config;
}
