import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  route('search', 'routes/search.tsx'),
  // Docs occupy the site root: manifest slugs map 1:1 onto URLs. A splat alone
  // does not match "/", so the index route renders the same module for the root.
  index('routes/docs.tsx', { id: 'docs-index' }),
  route('*', 'routes/docs.tsx'),
] satisfies RouteConfig;
