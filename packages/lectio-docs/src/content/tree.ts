import type { PageMeta, TreeNode } from './types.js';

/**
 * Build a navigation tree from flat page slugs.
 *
 * Each slug's segments become nested sections. A page whose slug is exactly a
 * section path (e.g. "/libraries", alongside "/libraries/event-sdk") attaches as
 * that section's index page — its `slug` and real `title` land on the node.
 * Bare sections with no index page get a humanized segment as their title.
 */
export function buildTree(pages: PageMeta[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const byPath = new Map<string, TreeNode>();

  const ensure = (path: string): TreeNode => {
    const existing = byPath.get(path);
    if (existing) return existing;

    const node: TreeNode = { title: humanize(lastSegment(path)), children: [] };
    byPath.set(path, node);

    const parentPath = path.slice(0, path.lastIndexOf('/'));
    if (parentPath) {
      ensure(parentPath).children.push(node);
    } else {
      roots.push(node);
    }
    return node;
  };

  for (const page of pages) {
    const segments = page.slug.split('/').filter(Boolean);

    // A root index page ("/") has no segments — attach it as a root node
    // rather than dropping it silently.
    if (segments.length === 0) {
      const node = ensure('/');
      node.title = page.title;
      node.slug = page.slug;
      continue;
    }

    let path = '';
    segments.forEach((seg, i) => {
      path += `/${seg}`;
      const node = ensure(path);
      if (i === segments.length - 1) {
        node.title = page.title;
        node.slug = page.slug;
      }
    });
  }

  return roots;
}

function lastSegment(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

function humanize(segment: string): string {
  const s = segment.replace(/[-_]/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
