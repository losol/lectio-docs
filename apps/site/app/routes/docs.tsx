import { useMemo } from 'react';
import { Link, useLoaderData } from 'react-router';

import type { TreeNode } from '@eventuras/lectio-docs/content';
import { MarkdownContent, extractHeadings, type MarkdownComponents } from '@eventuras/markdown';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { NavTree, type NavTreeGroup, type NavTreeItem } from '@eventuras/ratio-ui/core/NavTree';
import { TableOfContents } from '@eventuras/ratio-ui/core/TableOfContents';
import { getTextContent, slugify } from '@eventuras/ratio-ui/utils';

import { getContentSource } from '../content.server';

export async function loader({ params }: { params: Record<string, string | undefined> }) {
  const source = getContentSource();

  // Docs are served at the site root, so manifest slugs map 1:1 onto URLs.
  const rest = (params['*'] ?? '').replace(/\/$/, '');
  const slug = rest ? `/${rest}` : '/';

  const page = await source.getPage(slug);
  if (!page) throw new Response(`No document for "${slug}"`, { status: 404 });

  return { page, tree: source.getTree(), slug };
}

/**
 * Content tree → NavTree groups: root-level pages form the first (unlabelled)
 * group, and each bare section becomes its own group with its title as the
 * uppercase eyebrow — the grouped-sidebar look from the design sketch, derived
 * from the manifest rather than hand-maintained.
 */
function toNavGroups(tree: TreeNode[]): NavTreeGroup[] {
  const toItem = (node: TreeNode): NavTreeItem => ({
    title: node.title,
    ...(node.slug ? { href: node.slug } : { id: node.title }),
    ...(node.children.length > 0 ? { children: node.children.map(toItem) } : {}),
  });

  const rootPages = tree.filter((n) => n.children.length === 0);
  const sections = tree.filter((n) => n.children.length > 0);

  return [
    { items: rootPages.map(toItem) },
    ...sections.map((section) => ({
      label: section.title,
      items: [
        // A section that is itself a page keeps a link to it at the top.
        ...(section.slug ? [{ title: 'Overview', href: section.slug }] : []),
        ...section.children.map(toItem),
      ],
    })),
  ];
}

/** React Router adapter for NavTree — forwards active/indent/aria props. */
function NavLink({ href, ...rest }: { href: string; children: React.ReactNode }) {
  return <Link to={href} {...rest} />;
}

export default function DocsPage() {
  const { page, tree, slug } = useLoaderData<typeof loader>();

  const navGroups = useMemo(() => toNavGroups(tree), [tree]);
  const headings = useMemo(() => extractHeadings(page.body), [page.body]);

  // The only override left: anchor ids on h2/h3, slugged with ratio-ui's own
  // slugify — the same function extractHeadings uses for the TOC, so scroll-spy
  // and anchors can't drift. Everything else (code blocks, inline code,
  // blockquotes, dividers) renders theme-aware upstream since markdown 0.13.
  const markdownComponents: MarkdownComponents = useMemo(
    () => ({
      h2: ({ children }) => (
        <Heading as="h2" id={slugify(getTextContent(children))} style={{ scrollMarginTop: 76 }}>
          {children}
        </Heading>
      ),
      h3: ({ children }) => (
        <Heading as="h3" id={slugify(getTextContent(children))} style={{ scrollMarginTop: 76 }}>
          {children}
        </Heading>
      ),
    }),
    [],
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        maxWidth: 1400,
        margin: '0 auto',
        width: '100%',
        fontFamily: 'var(--font-body)',
        color: 'var(--text)',
      }}
    >
      <aside
        style={{
          position: 'sticky',
          top: 60,
          flexShrink: 0,
          width: 262,
          maxHeight: 'calc(100vh - 60px)',
          overflowY: 'auto',
          padding: '26px 16px 40px 24px',
          borderRight: '1px solid var(--border-1)',
        }}
      >
        <NavTree groups={navGroups} currentPath={slug} LinkComponent={NavLink} aria-label="Documentation" />
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 40,
          maxWidth: 1040,
          margin: '0 auto',
          padding: '40px 40px 80px',
        }}
      >
        <main style={{ flex: 1, minWidth: 0 }}>
          <MarkdownContent
            markdown={page.body}
            allowExternalLinks
            customComponents={markdownComponents}
          />

          <footer
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 48,
              paddingTop: 20,
              borderTop: '1px solid var(--border-1)',
              fontSize: 14,
              color: 'var(--text-subtle)',
            }}
          >
            <span>
              collected from <code>{page.source}</code>
            </span>
            {/* The edit link is provenance from the manifest (collect() resolves
                the configured editUrl template per page) — the site knows
                nothing about which repo the content came from. */}
            {page.editUrl && (
              <a
                href={page.editUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--primary)' }}
              >
                Edit this page
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                </svg>
              </a>
            )}
          </footer>
        </main>

        {headings.length > 0 && (
          <aside style={{ flexShrink: 0, width: 190, position: 'sticky', top: 86, alignSelf: 'flex-start' }}>
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>
    </div>
  );
}
