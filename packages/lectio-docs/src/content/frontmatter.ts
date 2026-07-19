const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

/**
 * Strip a leading YAML frontmatter block from markdown, returning the body.
 *
 * The manifest already carries the parsed frontmatter, so the content source
 * only needs the body. Pure string work — safe in any runtime.
 */
export function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_RE, '');
}
