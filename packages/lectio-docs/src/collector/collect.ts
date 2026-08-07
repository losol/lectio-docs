import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

import fg from 'fast-glob';

import { parseFrontmatter } from '../content/frontmatter.js';
import type { Manifest, PageMeta } from '../content/types.js';
import type { DocSource, DocsConfig } from './config.js';

interface CollectOptions {
  /** Absolute path to the repo/project root */
  rootDir: string;
  /** The docs configuration */
  config: DocsConfig;
  /** Absolute path to the directory containing docs.config.ts */
  configDir: string;
}

/**
 * Collect documentation from across the repo into a single output directory,
 * and emit a `manifest.json` describing every collected page.
 *
 * Each source glob is resolved relative to rootDir. Files are copied to
 * config.output (relative to configDir) under the source's target path.
 *
 * `README.md` is renamed to `<parent-dir>.md` (e.g. libs/event-sdk/README.md →
 * <target>/event-sdk.md). Frontmatter (title, description) is auto-generated
 * from package.json when configured. The manifest is the input to the
 * framework-agnostic `./content` content source.
 */
export async function collect({ rootDir, config, configDir }: CollectOptions): Promise<void> {
  // Fail fast on a template without the placeholder — it would otherwise
  // silently resolve to the same edit URL for every page.
  if (config.editUrl && !config.editUrl.includes('{path}')) {
    throw new Error(
      `docs config: editUrl must contain a {path} placeholder, got "${config.editUrl}"`,
    );
  }

  const locales = config.locales ?? [];
  const defaultLocale = config.defaultLocale ?? 'en';
  if (locales.length > 0 && !locales.includes(defaultLocale)) {
    throw new Error(
      `docs config: defaultLocale "${defaultLocale}" is not in locales [${locales.join(', ')}]`,
    );
  }

  const outputDir = resolve(configDir, config.output);

  // Clean output directory
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
    console.log(`Cleaned: ${outputDir}`);
  }
  mkdirSync(outputDir, { recursive: true });

  let totalFiles = 0;
  const pages: PageMeta[] = [];

  for (const source of config.sources) {
    const files = await fg(source.glob, {
      cwd: rootDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      dot: false,
    });

    if (files.length === 0) {
      console.warn(`  ⚠ No files matched: ${source.glob}`);
      continue;
    }

    for (const file of files) {
      const sourcePath = resolve(rootDir, file);
      const targetPath = buildTargetPath(file, source, outputDir, locales);

      const content = readFileSync(sourcePath, 'utf-8');
      const { content: enriched, frontmatter } = enrichContent(content, sourcePath, source, rootDir);

      const targetDir = dirname(targetPath);
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(targetPath, enriched);

      const relTarget = relative(outputDir, targetPath).replaceAll('\\', '/');
      const slug = fileToSlug(relTarget, locales);
      // Read from the source path, not the target: a locale-named directory is
      // part of where the file came from and need not survive into the output.
      const locale = detectLocale(file, frontmatter, locales, defaultLocale);
      // Only frontmatter can name an unlisted locale — a suffix or a directory
      // has to match `locales` to be read as one at all. Left in the manifest,
      // but said out loud: a typo here silently orphans a translation.
      if (locales.length > 0 && !locales.includes(locale)) {
        console.warn(
          `  ⚠ ${relative(rootDir, sourcePath)}: frontmatter declares locale ` +
            `"${locale}", which is not in locales [${locales.join(', ')}] — ` +
            'the page is collected, but no reader will ask for it',
        );
      }
      const sourceRel = String(frontmatter.source ?? relative(rootDir, sourcePath)).replaceAll('\\', '/');
      pages.push({
        slug,
        title: String(frontmatter.title ?? slugTitle(slug)),
        description: frontmatter.description == null ? undefined : String(frontmatter.description),
        source: sourceRel,
        // Single-language sets carry no locale at all, so their manifests stay
        // exactly as before; multilingual ones state it on every page rather
        // than leaning on the reader's default matching the collector's.
        locale: locales.length === 0 ? undefined : locale,
        // Resolved here, not in the host: only the collector knows which repo
        // a page came from, which is what keeps multi-repo sourcing possible.
        editUrl: config.editUrl ? config.editUrl.replaceAll('{path}', sourceRel) : undefined,
        file: relTarget,
        section: source.target,
        frontmatter,
      });

      console.log(`  ${relative(rootDir, sourcePath)} → ${relTarget}`);
      totalFiles++;
    }
  }

  const manifest: Manifest = { version: 1, pages };
  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nCollected ${totalFiles} files into ${relative(rootDir, outputDir)}`);
  console.log(`Wrote manifest: ${relative(rootDir, manifestPath)} (${pages.length} pages)`);
}

/**
 * Determine the output file path for a source file.
 * README.md becomes index.md so it acts as a directory index page.
 */
function buildTargetPath(
  file: string,
  source: DocSource,
  outputDir: string,
  locales: string[] = [],
): string {
  const fileName = basename(file);
  const fileDir = dirname(file);

  // README.md is renamed so it acts as an index page. A README at the
  // collection root is the site's home (index.md → the target itself, e.g. "/");
  // a nested one is named after its parent directory, so
  // libs/event-sdk/README.md → /libraries/event-sdk.
  //
  // A translated README (README.nb.md) is renamed the same way and keeps its
  // suffix, so it lands beside the original and slugs to the same page.
  const readme = /^readme(?:\.([^.]+))?\.md$/i.exec(fileName);
  const readmeLocale = readme?.[1];
  if (readme && (readmeLocale === undefined || locales.includes(readmeLocale))) {
    // A locale directory names the translation, not the page: guides/nb/README.md
    // is the Norwegian /guides. Name it after the grandparent and carry the locale
    // as a suffix, or it would slug to "/nb" instead of collapsing onto "/guides".
    const dirLocale = locales.includes(basename(fileDir)) ? basename(fileDir) : undefined;
    const locale = readmeLocale ?? dirLocale;
    const suffix = locale === undefined ? '' : `.${locale}`;
    const parentDir = basename(dirLocale === undefined ? fileDir : dirname(fileDir));
    const targetName = parentDir === '.' ? `index${suffix}.md` : `${parentDir}${suffix}.md`;
    return join(outputDir, source.target, targetName);
  }

  // For files inside a directory structure like "docs/developer/Config.md",
  // preserve the relative path under the target
  const globBase = getGlobBase(source.glob);
  const relativePath = relative(globBase, file);

  // If relative is empty (exact file match), use the filename directly
  if (!relativePath || relativePath === '.') {
    return join(outputDir, source.target, fileName);
  }
  return join(outputDir, source.target, relativePath);
}

/**
 * Get the static base directory from a glob pattern.
 * "docs/(star)(star)/(star).mdx" -> "docs"
 * "libs/(star)/README.md" -> "libs"
 */
function getGlobBase(glob: string): string {
  const parts = glob.split('/');
  const staticParts: string[] = [];
  for (const part of parts) {
    if (part.includes('*') || part.includes('{') || part.includes('?')) break;
    staticParts.push(part);
  }
  return staticParts.join('/') || '.';
}

/**
 * Enrich file content with frontmatter from package.json if configured,
 * or ensure existing frontmatter is preserved.
 */
function enrichContent(
  content: string,
  sourcePath: string,
  source: DocSource,
  rootDir: string,
): { content: string; frontmatter: Record<string, unknown> } {
  const {
    frontmatter: existingFrontmatter,
    body,
    unsupportedKeys,
  } = parseFrontmatter(content);

  // The reader handles scalars. Anything structural is named here rather than
  // disappearing between the source file and the manifest.
  if (unsupportedKeys.length > 0) {
    console.warn(
      `  ⚠ ${relative(rootDir, sourcePath)}: frontmatter keys not read ` +
        `(only scalar values are): ${unsupportedKeys.join(', ')}`,
    );
  }

  const frontmatter: Record<string, unknown> = { ...existingFrontmatter };

  // Auto-generate title/description from package.json
  if (source.titleFromPackageJson || source.descriptionFromPackageJson) {
    const pkg = findNearestPackageJson(sourcePath);
    if (pkg) {
      if (source.titleFromPackageJson && !frontmatter.title) {
        // Strip @scope/ prefix: "@eventuras/event-sdk" → "event-sdk"
        const name = pkg.name?.replace(/^@[^/]+\//, '') ?? basename(dirname(sourcePath));
        frontmatter.title = name;
      }
      if (source.descriptionFromPackageJson && !frontmatter.description && pkg.description) {
        frontmatter.description = pkg.description;
      }
    }
  }

  // If no title, derive from first heading or filename
  if (!frontmatter.title) {
    const heading = /^#\s+(.+)$/m.exec(body)?.[1];
    if (heading) {
      frontmatter.title = heading.trim();
    }
  }

  // Add source reference (relative to repo root, POSIX separators for portability)
  frontmatter.source = relative(rootDir, sourcePath).replaceAll('\\', '/');

  return { content: formatFrontmatter(frontmatter) + body, frontmatter };
}

/**
 * Map an output-relative file path to a URL slug.
 * "index.md" → "/", "guides/index.md" → "/guides", "libraries/x.md" → "/libraries/x"
 *
 * A locale marker is dropped on the way — "terms.nb.md" and "nb/terms.md" both
 * slug to "/terms" — so a document's translations share one URL.
 */
function fileToSlug(file: string, locales: string[] = []): string {
  const segments = file
    .replaceAll('\\', '/')
    .split('/')
    .filter((segment) => !locales.includes(segment));

  let slug = '/' + segments.join('/');
  slug = slug.replace(/\.mdx?$/i, '');
  slug = stripLocaleSuffix(slug, locales);
  slug = slug.replace(/\/index$/i, '');
  return slug || '/';
}

/** Drops a trailing ".<locale>" from an extension-less path. */
function stripLocaleSuffix(path: string, locales: string[]): string {
  const lastDot = path.lastIndexOf('.');
  if (lastDot <= path.lastIndexOf('/')) return path;
  return locales.includes(path.slice(lastDot + 1)) ? path.slice(0, lastDot) : path;
}

/**
 * The locale a document is written in: what its frontmatter declares, else a
 * recognised filename suffix or path segment, else the configured default.
 * See {@link DocsConfig.defaultLocale} for why frontmatter outranks the path.
 */
function detectLocale(
  file: string,
  frontmatter: Record<string, unknown>,
  locales: string[],
  defaultLocale: string,
): string {
  const declared = frontmatter.locale ?? frontmatter.language;
  if (typeof declared === 'string' && declared.trim() !== '') return declared.trim();

  const segments = file.replaceAll('\\', '/').split('/');

  // The name outranks the directory: `nb/terms.en.md` is English filed under a
  // Norwegian directory, and naming the file is the more deliberate act.
  const name = (segments.at(-1) ?? '').replace(/\.mdx?$/i, '');
  const suffix = name.slice(name.lastIndexOf('.') + 1);
  if (locales.includes(suffix)) return suffix;

  const inPath = segments.slice(0, -1).find((segment) => locales.includes(segment));
  return inPath ?? defaultLocale;
}

/** Fallback page title derived from the slug's last segment. */
function slugTitle(slug: string): string {
  const seg = slug === '/' ? 'Home' : slug.slice(slug.lastIndexOf('/') + 1);
  const s = seg.replace(/[-_]/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Walk up from a file path to find the nearest package.json.
 */
function findNearestPackageJson(
  filePath: string,
): { name?: string; description?: string } | null {
  let dir = dirname(filePath);
  const root = resolve('/');

  while (dir !== root) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        return JSON.parse(readFileSync(pkgPath, 'utf-8'));
      } catch {
        return null;
      }
    }
    dir = dirname(dir);
  }
  return null;
}

/**
 * Format a frontmatter object as a YAML frontmatter block.
 */
function formatFrontmatter(data: Record<string, unknown>): string {
  if (Object.keys(data).length === 0) return '';

  const lines = Object.entries(data).map(([key, value]) => {
    const str = String(value);
    // Quote strings that contain special YAML characters
    if (typeof value === 'string' && /[:#{}[\],&*?|>!%@`]/.test(str)) {
      return `${key}: "${str.replaceAll('"', String.raw`\"`)}"`;
    }
    return `${key}: ${str}`;
  });

  return `---\n${lines.join('\n')}\n---\n\n`;
}
