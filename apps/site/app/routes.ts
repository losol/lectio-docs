import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Search lives in the site header (CommandPalette, ⌘K) — no route for it.
export default [
  // Docs occupy the site root: manifest slugs map 1:1 onto URLs. A splat alone
  // does not match "/", so the index route renders the same module for the root.
  index('routes/docs.tsx', { id: 'docs-index' }),
  route('*', 'routes/docs.tsx'),
] satisfies RouteConfig;
