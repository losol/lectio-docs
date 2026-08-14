export interface DocSource {
  /**
   * Glob pattern relative to the repo root — a whole tree, or one file per
   * package. Copyable examples are in the README: a `*` next to a `/` would end
   * this comment, and both ways around that (an escape, a zero-width space)
   * paste back as a glob that matches the wrong files.
   */
  glob: string;

  /** Target path in output directory, e.g. "/" or "/libraries" */
  target: string;

  /**
   * Globs to leave out of this source, e.g. `['docs/ADR/**']` to publish the
   * documentation without its decision records. Relative to the repo root, the
   * same as `glob`. `node_modules`, `dist` and `.next` are always excluded.
   */
  ignore?: string[];

  /** Read title from nearest package.json "name" field (strips @scope/) */
  titleFromPackageJson?: boolean;

  /** Read description from nearest package.json "description" field */
  descriptionFromPackageJson?: boolean;

  /** Override the section title shown in navigation */
  sectionTitle?: string;

  /**
   * Path segment names in the order they should appear in the navigation,
   * wherever they occur in this source:
   *
   * ```ts
   * order: ['concepts', 'reference', 'recipes']
   * ```
   *
   * Eight sections holding those same three subfolders then read the same way
   * in all eight, from one line. This is the only handle on a directory that
   * holds no page of its own — there is no file to put frontmatter in.
   *
   * A name's position counts from 1 and shares its scale with a page's `order:`
   * frontmatter, so the two can be mixed at one level. Everything unnamed
   * follows, alphabetically.
   */
  order?: string[];
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
   * Template for linking to a source file on its forge, `{path}` replaced by
   * the file's repo-relative path — `https://github.com/org/repo/blob/main/{path}`.
   *
   * Documentation links to files that aren't published: a README outside the
   * collected globs, a section this deployment leaves out. With a template,
   * those links go to the forge instead of nowhere; without one, they are left
   * as the author wrote them. Recorded in the manifest, since the host that
   * renders the links reads that rather than this config.
   */
  sourceUrl?: string;

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
