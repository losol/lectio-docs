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
}

export function defineDocsConfig(config: DocsConfig): DocsConfig {
  return config;
}
