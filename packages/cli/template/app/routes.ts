import { type RouteConfig, index, route } from '@react-router/dev/routes';

// Docs occupy the site root: manifest slugs map 1:1 onto URLs. A splat alone
// does not match "/", so the index route renders the same module for the root.
export default [
  index('routes/docs.tsx', { id: 'docs-index' }),
  route('*', 'routes/docs.tsx'),
] satisfies RouteConfig;
