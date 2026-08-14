/**
 * The order pages appear in — the navigation's order, since the tree follows
 * the manifest.
 *
 * Pure string and number work over `PageMeta`, so a host assembling a manifest
 * at runtime sorts it exactly the way `collect()` does at build time.
 */

import { normalizeSlug } from './paths.js';
import type { PageMeta } from './types.js';

export interface SortPagesOptions {
  /**
   * Path segment names in the order they should appear, wherever they occur:
   * `['concepts', 'reference', 'recipes']` gives every section the same three
   * subsections in the same three places. This is the only handle on a
   * directory that holds no page of its own — there is no file to put
   * frontmatter in.
   */
  order?: readonly string[];
}

/**
 * Sort pages into reading order.
 *
 * Within a level, three rules in turn:
 *
 * 1. **A number wins.** `order:` in a page's frontmatter, or a name's position
 *    in {@link SortPagesOptions.order} (counted from 1), lowest first. The two
 *    share one scale, so `order: ['reference']` and `order: 2` on a sibling
 *    page mean what they read as.
 * 2. **Then alphabetical**, numeric-aware — `2-x` before `10-x`. Pages that
 *    name no order follow those that do.
 * 3. **A section's own page leads it**, ahead of everything nested below.
 *
 * Alphabetical rather than "as the glob found them": a filesystem's order
 * differs between machines, which is what makes three sections with the same
 * three subfolders come out in three different orders.
 *
 * Stable, so translations of one document (same slug, different locale) keep
 * the order they were collected in.
 */
export function sortPages(
  pages: readonly PageMeta[],
  { order = [] }: SortPagesOptions = {},
): PageMeta[] {
  const listed = new Map(order.map((name, index) => [name, index + 1]));

  // A directory's rank comes from the page that *is* that directory — its
  // index page — since the directory itself has no frontmatter to read.
  const declared = new Map<string, number>();
  for (const page of pages) {
    const rank = toRank(page.frontmatter?.order);
    if (rank !== null) declared.set(normalizeSlug(page.slug), rank);
  }

  const rankOf = (path: string, segment: string): number =>
    listed.get(segment) ?? declared.get(path) ?? Number.POSITIVE_INFINITY;

  return [...pages].sort((a, b) => {
    const left = segmentsOf(a.slug);
    const right = segmentsOf(b.slug);

    let path = '';
    for (let depth = 0; depth < Math.min(left.length, right.length); depth++) {
      const one = left[depth] as string;
      const other = right[depth] as string;
      if (one === other) {
        path += `/${one}`;
        continue;
      }
      const rank = rankOf(`${path}/${one}`, one);
      const otherRank = rankOf(`${path}/${other}`, other);
      if (rank !== otherRank) return rank < otherRank ? -1 : 1;
      return one.localeCompare(other, 'en', { numeric: true });
    }

    // Same path as far as the shorter one goes: it is the other's section.
    return left.length - right.length;
  });
}

function segmentsOf(slug: string): string[] {
  return slug.split('/').filter(Boolean);
}

/**
 * `order` as a number. Frontmatter values arrive as written (the reader coerces
 * nothing), so `order: 2` is the string `"2"` — and anything that isn't a
 * finite number is no order at all rather than a `NaN` that sorts randomly.
 */
function toRank(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
