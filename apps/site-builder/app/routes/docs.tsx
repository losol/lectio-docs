import { useMemo } from 'react';
import { Link, useLoaderData } from 'react-router';

import type { TreeNode } from '@eventuras/lectio-docs/content';
import { MarkdownContent, extractHeadings, type MarkdownComponents } from '@eventuras/markdown';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Link as TextLink } from '@eventuras/ratio-ui/core/Link';
import { NavTree } from '@eventuras/ratio-ui/core/NavTree';
import { TableOfContents } from '@eventuras/ratio-ui/core/TableOfContents';
import { getTextContent, slugify } from '@eventuras/ratio-ui/utils';

import { getContentSource } from '../content.server';
import { linkKey, resolveDocLinks, type DocLinks } from '../doc-links';
import docsStylesheet from './docs.css?url';

export function links() {
  return [{ rel: 'stylesheet', href: docsStylesheet }];
}

export async function loader({ params }: { params: Record<string, string | undefined> }) {
  const source = getContentSource();

  // Docs are served at the site root, so manifest slugs map 1:1 onto URLs.
  const rest = (params['*'] ?? '').replace(/\/$/, '');
  const slug = rest ? `/${rest}` : '/';

  const page = await source.getPage(slug);
  if (!page) throw new Response(`No document for "${slug}"`, { status: 404 });

  // navGroups is computed here (plain, serializable data) rather than in the
  // component so the site header can pick it up via useMatches and render the
  // same tree in its mobile Navbar.Collapse. Links are resolved here for a
  // second reason: only the server holds the manifest.
  return { page, navGroups: toNavGroups(source.getTree()), slug, links: resolveDocLinks(source, page) };
}

/**
 * Serializable shape of the nav tree — a plain-strings subset of ratio-ui's
 * NavTreeGroup (whose `title: ReactNode` doesn't survive React Router's
 * loader-serialization typing). Structurally assignable to what NavTree takes,
 * and shared with the site header, which reads it back via useMatches.
 */
export interface DocsNavItem {
  title: string;
  href?: string;
  id?: string;
  children?: DocsNavItem[];
}
export interface DocsNavGroup {
  label?: string;
  items: DocsNavItem[];
}

/**
 * Content tree → NavTree groups: root-level pages form the first (unlabelled)
 * group, and each bare section becomes its own group with its title as the
 * uppercase eyebrow — the grouped-sidebar look from the design sketch, derived
 * from the manifest rather than hand-maintained.
 */
function toNavGroups(tree: TreeNode[]): DocsNavGroup[] {
  const toItem = (node: TreeNode): DocsNavItem => ({
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

// `scheme:` or protocol-relative `//host` — anything that leaves this origin.
const ABSOLUTE_HREF = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * A link in the body, pointed at wherever the loader resolved it: a page of
 * this site, a file on the forge, or — for anything it left alone (off-site,
 * anchors within the page) — exactly what the author wrote.
 *
 * In-site destinations navigate client-side, the way the nav does; the rest
 * are plain anchors, off-site ones in a new tab.
 */
function DocAnchor({
  href = '',
  links,
  children,
}: {
  href?: string;
  links: DocLinks;
  children: React.ReactNode;
}) {
  const resolved = links[linkKey(href)];
  const to = resolved?.href ?? href;
  // Off-site by the href itself: a scheme, or `//host/x` — another origin
  // wearing the same leading slash a site path has.
  const offSite = ABSOLUTE_HREF.test(to);
  const internal = resolved ? !resolved.external : to.startsWith('/') && !offSite;

  if (internal) {
    // ratio-ui owns the appearance, React Router the navigation: it renders
    // `component` with both props, and its own href (from `to`) wins.
    return (
      <TextLink href={to} component={Link} componentProps={{ to }}>
        {children}
      </TextLink>
    );
  }

  return (
    <TextLink
      href={to}
      componentProps={offSite ? { rel: 'noopener noreferrer', target: '_blank' } : undefined}
    >
      {children}
    </TextLink>
  );
}

export default function DocsPage() {
  const { page, navGroups, slug, links } = useLoaderData<typeof loader>();

  const headings = useMemo(() => extractHeadings(page.body), [page.body]);

  // Two overrides: anchor ids on h2/h3, slugged with ratio-ui's own slugify —
  // the same function extractHeadings uses for the TOC, so scroll-spy and
  // anchors can't drift — and anchors, which follow the loader's resolution of
  // the links documents make to each other. Everything else (code blocks,
  // inline code, blockquotes, dividers) renders theme-aware upstream since
  // markdown 0.13.
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
      a: ({ href, children }) => (
        <DocAnchor href={href} links={links}>
          {children}
        </DocAnchor>
      ),
    }),
    [links],
  );

  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <NavTree groups={navGroups} currentPath={slug} LinkComponent={NavLink} aria-label="Documentation" />
      </aside>

      <div className="docs-content-wrap">
        <main className="docs-main">
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
          <aside className="docs-toc">
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>
    </div>
  );
}
