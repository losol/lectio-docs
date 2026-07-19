import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Externalize every runtime dep (and its subpaths) so they aren't bundled into the lib.
const runtimeExternals = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
].map((name) => new RegExp(`^${escapeRegex(name)}(/.*)?$`));

// Vanilla TS/Node core — no React. The React bindings live in
// `@eventuras/lectio-docs-react`, which owns the JSX build + 'use client'.
export default defineConfig({
  plugins: [dts({ entryRoot: 'src', outDir: 'dist', include: ['src/**/*'] })],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        'search/index': 'src/search/index.ts',
        'search/build-index': 'src/search/build-index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [...runtimeExternals, /^node:/, ...builtinModules],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
