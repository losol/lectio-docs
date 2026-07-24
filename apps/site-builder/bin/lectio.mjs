#!/usr/bin/env node
/**
 * lectio — run one command, get a docs site.
 *
 * `lectio build` in a repo with a docs.config.{ts,js,mjs}:
 *
 *   1. collects the configured sources (manifest + markdown)
 *   2. builds the search index
 *   3. materializes THIS package's own site app into .lectio/site — the same
 *      app that ships as the demo (apps/site-builder), so there is no separate
 *      template to keep in sync. React Router does not apply its app-source
 *      transforms (the .server boundary, loader stripping) to files under
 *      node_modules, so the app is copied out to a normal build dir here.
 *   4. links the build dir's node_modules to THIS package's dependency dir —
 *      dirname(realpath(<own package>)) holds the deps in both pnpm's
 *      virtual-store layout and npm's flat layout — so the consumer installs
 *      nothing beyond lectio-docs itself
 *   5. runs the React Router build there (prerenders every page)
 *   6. copies the static output to ./dist
 *
 * Spike quality: build command only, minimal argument handling.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

const command = process.argv[2];
if (command !== 'build') {
  console.error('Usage: lectio build');
  process.exit(command ? 1 : 0);
}

const cwd = process.cwd();

// --- 1. discover + load the user's docs config -----------------------------
const configPath = ['docs.config.ts', 'docs.config.js', 'docs.config.mjs']
  .map((name) => resolve(cwd, name))
  .find((candidate) => existsSync(candidate));
if (!configPath) {
  console.error('No docs.config.{ts,js,mjs} found in the current directory.');
  process.exit(1);
}

const config = (await import(pathToFileURL(configPath).href)).default;
if (!config?.sources || !config?.output) {
  console.error('The docs config must export { output, sources }.');
  process.exit(1);
}

// The repo root is where you run this from — the dir holding docs.config. Every
// source glob and edit-URL path is resolved relative to it (collect's rootDir).
// We deliberately do NOT walk up to an ancestor .git: that made the base depend
// on where a .git happened to sit above cwd, which breaks when the config lives
// in a nested dir (e.g. examples/) or in some CI checkouts.
const rootDir = cwd;

// --- 2. collect + index -----------------------------------------------------
const { collect } = await import('@eventuras/lectio-docs');
const { buildSearchIndex } = await import('@eventuras/lectio-docs/build-index');

await collect({ rootDir, config, configDir: cwd });
const contentDir = resolve(cwd, config.output);

// --- 3. materialize this package's site app --------------------------------
// Copy app/ + wiring out of the package. Once installed, the package lives
// under node_modules, where RR won't apply its app-source transforms — copying
// to a normal dir restores the .server boundary and loader stripping.
const siteDir = resolve(cwd, '.lectio/site');
rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });

const pkgRoot = fileURLToPath(new URL('..', import.meta.url));
cpSync(join(pkgRoot, 'app'), join(siteDir, 'app'), { recursive: true });
cpSync(join(pkgRoot, 'react-router.config.ts'), join(siteDir, 'react-router.config.ts'));
cpSync(join(pkgRoot, 'vite.config.ts'), join(siteDir, 'vite.config.ts'));

// Minimal package.json for the build dir. Only isbot matters: react-router dev
// auto-installs it when missing, which would hit the network mid-build.
// Everything else resolves through the linked node_modules (step 4).
writeFileSync(
  join(siteDir, 'package.json'),
  JSON.stringify({ name: 'lectio-site', private: true, type: 'module', dependencies: { isbot: '^5' } }, null, 2) + '\n',
);

// A self-contained tsconfig so esbuild (which transforms react-router.config.ts
// and vite.config.ts) stops here instead of walking up into the consumer's
// repo. Without it, a parent tsconfig — e.g. one that `extends` a base package
// — gets picked up and can fail to resolve, breaking the build for reasons that
// have nothing to do with the docs.
writeFileSync(
  join(siteDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        skipLibCheck: true,
      },
    },
    null,
    2,
  ) + '\n',
);

// Where the app reads content from, and the branding it renders. site.config.ts
// was copied above with this repo's own branding; overwrite it with the
// consumer's, so app/ stays generic and config-driven.
writeFileSync(join(siteDir, 'lectio.config.json'), JSON.stringify({ contentDir }, null, 2) + '\n');
writeFileSync(
  join(siteDir, 'app', 'site.config.ts'),
  `// Generated by lectio build — do not edit.
export const site = {
  title: ${JSON.stringify(config.site?.title ?? 'Docs')},
  githubUrl: ${JSON.stringify(config.site?.githubUrl)} as string | undefined,
};
`,
);

mkdirSync(join(siteDir, 'public'), { recursive: true });
await buildSearchIndex({
  contentDir,
  outputPath: join(siteDir, 'public', 'search-index.json'),
  log: (message) => console.log(message),
});

// --- 4. dependency resolution via symlink -----------------------------------
// Own package dir = parent of bin/. Where the deps live depends on layout:
//  - workspace dev / npm with nesting: <own>/node_modules holds them
//  - installed via pnpm: realpath resolves into the virtual store, whose
//    parent dir holds this package's deps as siblings
//  - npm flat: dirname(realpath) is the flat node_modules holding everything
//
// We can't just test whether <own>/node_modules EXISTS: pnpm creates an empty
// one inside the package in the virtual store, so its presence doesn't mean the
// deps are there. Pick the candidate that actually holds a known direct dep
// (react-router) instead.
const ownPackageDir = realpathSync(pkgRoot);
const depsDir =
  [join(ownPackageDir, 'node_modules'), dirname(ownPackageDir)].find((dir) =>
    existsSync(join(dir, 'react-router')),
  ) ?? dirname(ownPackageDir);

// A REAL node_modules directory with one symlink per package — not a single
// symlink to depsDir. Vite writes into node_modules (.vite-temp config
// bundles, dep cache); with a whole-dir symlink those writes would land in
// this package's own node_modules. Per-package links keep resolution working
// while writes stay local to the materialized site.
const siteModules = join(siteDir, 'node_modules');
mkdirSync(siteModules, { recursive: true });
for (const entry of readdirSync(depsDir)) {
  if (entry.startsWith('.')) continue; // .bin, .vite-temp, .modules.yaml, …
  if (entry.startsWith('@')) {
    mkdirSync(join(siteModules, entry), { recursive: true });
    for (const scoped of readdirSync(join(depsDir, entry))) {
      symlinkSync(join(depsDir, entry, scoped), join(siteModules, entry, scoped), 'dir');
    }
  } else {
    symlinkSync(join(depsDir, entry), join(siteModules, entry), 'dir');
  }
}

// --- 5. run the React Router build ------------------------------------------
const rrDevPkg = require.resolve('@react-router/dev/package.json');
const rrBin = join(dirname(rrDevPkg), require(rrDevPkg).bin['react-router']);
const result = spawnSync(process.execPath, [rrBin, 'build'], {
  cwd: siteDir,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

// --- 6. static output --------------------------------------------------------
const outDir = resolve(cwd, 'dist');
rmSync(outDir, { recursive: true, force: true });
cpSync(join(siteDir, 'build', 'client'), outDir, { recursive: true });
console.log(`\nDocs site built → ${outDir}`);
