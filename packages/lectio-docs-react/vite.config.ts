import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/** Preserve 'use client' directives so RSC/Next consumers keep client boundaries. */
function preserveUseClient() {
  return {
    name: 'preserve-use-client',
    enforce: 'post' as const,
    generateBundle(
      _options: unknown,
      bundle: Record<string, { type: string; code?: string; moduleIds?: string[] }>,
    ) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.code) continue;
        const hasDirective = chunk.moduleIds?.some((id) => {
          try {
            const src = readFileSync(id, 'utf-8')
              .replace(/^(\s*\/\/.*\n)+/, '')
              .replace(/^(\s*\/\*[\s\S]*?\*\/\s*)/, '');
            return src.trimStart().startsWith("'use client'") || src.trimStart().startsWith('"use client"');
          } catch {
            return false;
          }
        });
        const codeStart = chunk.code.trimStart();
        if (hasDirective && !codeStart.startsWith("'use client'") && !codeStart.startsWith('"use client"')) {
          chunk.code = `'use client';\n${chunk.code}`;
        }
      }
    },
  };
}

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

export default defineConfig({
  plugins: [
    react(),
    dts({ entryRoot: 'src', outDir: 'dist', include: ['src/**/*'] }),
    preserveUseClient(),
  ],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', ...runtimeExternals, /^node:/, ...builtinModules],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
