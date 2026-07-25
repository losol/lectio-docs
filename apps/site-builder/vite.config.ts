import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  // The `lectio` CLI symlinks the site's dependencies in from wherever the
  // package was installed (npx cache, pnpm store, …), whose realpaths sit
  // outside the materialized site dir. Let the dev server read them — otherwise
  // React Router's default client entry can't load and the page renders blank.
  // Dev-server only; the static build is unaffected.
  server: { fs: { strict: false } },
});
