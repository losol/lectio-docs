/** A leading `---` block, capturing its contents. */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Block scalar indicators: `|`, `>`, and their chomping/indent variants. */
const BLOCK_SCALAR_RE = /^[|>][+-]?\d*$/;

export interface Frontmatter {
  /** Scalar `key: value` pairs, values as written. */
  frontmatter: Record<string, unknown>;
  /** The markdown after the block — the whole document when there is none. */
  body: string;
  /**
   * Keys whose value this reader cannot represent: block sequences, nested
   * maps, folded and literal scalars, flow collections. Reported rather than
   * dropped in silence, so a caller can warn instead of losing them quietly.
   */
  unsupportedKeys: string[];
}

/**
 * Strip a leading YAML frontmatter block from markdown, returning the body.
 *
 * The manifest already carries the parsed frontmatter, so the content source
 * only needs the body. Pure string work — safe in any runtime.
 */
export function stripFrontmatter(content: string): string {
  const match = FRONTMATTER_RE.exec(content);
  return match === null ? content : content.slice(match[0].length);
}

/**
 * Read a document's leading YAML frontmatter block, and return it with the
 * body it precedes. A document without one reads as `{}` and itself.
 *
 * Deliberately not a YAML parser. Documentation frontmatter is a handful of
 * `key: value` lines — every document collected by this package's own docs
 * uses `title`, `description` and `source`, nothing else — and reading them
 * here keeps the dependency tree at what the collector and the search index
 * genuinely need. Values stay strings; nothing is coerced, so `draft: false`
 * is the string `"false"` rather than a surprise.
 *
 * What it *cannot* represent it names in `unsupportedKeys` rather than
 * swallowing. That is the difference that matters: a reader this small is
 * fine, a reader this small that loses a `tags:` list without saying so
 * is not.
 */
export function parseFrontmatter(content: string): Frontmatter {
  const match = FRONTMATTER_RE.exec(content);
  if (match === null) return { frontmatter: {}, body: content, unsupportedKeys: [] };

  const frontmatter: Record<string, unknown> = {};
  const unsupportedKeys: string[] = [];
  const lines = (match[1] ?? '').split(/\r?\n/);

  let lastKey: string | null = null;
  for (const [index, line] of lines.entries()) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    // Indented: a continuation of the key above — a list item, a nested key,
    // or a folded scalar's text. Whatever it is, we can't hold it.
    if (/^\s/.test(line)) {
      if (lastKey !== null && !unsupportedKeys.includes(lastKey)) unsupportedKeys.push(lastKey);
      continue;
    }

    const separator = line.indexOf(':');
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    if (key === '') continue;
    lastKey = key;

    const value = unquote(line.slice(separator + 1).trim());
    if (BLOCK_SCALAR_RE.test(value) || isFlowCollection(value)) {
      unsupportedKeys.push(key);
      continue;
    }

    // A bare `key:` is only an empty string if nothing is nested beneath it;
    // the indented-line branch above catches the case where something is.
    if (value === '' && isIndented(lines[index + 1])) continue;

    frontmatter[key] = value;
  }

  return { frontmatter, body: content.slice(match[0].length), unsupportedKeys };
}

function isIndented(line: string | undefined): boolean {
  return line !== undefined && /^\s+\S/.test(line);
}

/** Inline `[a, b]` or `{a: 1}` — written as a collection, not as text. */
function isFlowCollection(value: string): boolean {
  return (
    (value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))
  );
}

function unquote(value: string): string {
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  return quoted && value.length >= 2 ? value.slice(1, -1) : value;
}
