import { Link, useLoaderData } from 'react-router';

import type { TreeNode } from '@eventuras/lectio-docs/content';

import { getContentSource } from '../content.server';

export async function loader({ params }: { params: Record<string, string | undefined> }) {
  const source = getContentSource();

  // Docs are served at the site root, so manifest slugs map 1:1 onto URLs.
  const rest = (params['*'] ?? '').replace(/\/$/, '');
  const slug = rest ? `/${rest}` : '/';

  const page = await source.getPage(slug);
  if (!page) throw new Response(`No document for "${slug}"`, { status: 404 });

  return { page, tree: source.getTree() };
}

function Nav({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul style={{ listStyle: 'none', paddingLeft: '0.9rem', margin: 0 }}>
      {nodes.map((node) => (
        <li key={node.slug ?? node.title} style={{ margin: '0.35rem 0' }}>
          {node.slug ? (
            <Link to={node.slug}>{node.title}</Link>
          ) : (
            <span style={{ color: '#888' }}>{node.title}</span>
          )}
          {node.children.length > 0 && <Nav nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

export default function DocsPage() {
  const { page, tree } = useLoaderData<typeof loader>();

  return (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 1000,
        margin: '3rem auto',
        padding: '0 1rem',
        lineHeight: 1.5,
      }}
    >
      <aside style={{ minWidth: 190, borderRight: '1px solid #eee', paddingRight: '1rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Docs</strong>
        <Nav nodes={tree} />
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/search" style={{ color: '#888' }}>
            Search
          </Link>
        </p>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ marginBottom: '0.25rem' }}>{page.title}</h1>
        {page.description && <p style={{ color: '#666', marginTop: 0 }}>{page.description}</p>}
        <p style={{ fontSize: '0.8rem', color: '#999' }}>
          collected from <code>{page.source}</code>
        </p>

        {/* Raw markdown for now — mapping markdown to components is Phase 4. */}
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: '#f6f6f6',
            padding: '1rem',
            borderRadius: 6,
            overflowX: 'auto',
          }}
        >
          {page.body}
        </pre>
      </main>
    </div>
  );
}
