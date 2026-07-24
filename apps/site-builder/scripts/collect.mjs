import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collect } from '@eventuras/lectio-docs';
import { buildSearchIndex } from '@eventuras/lectio-docs/build-index';

// Collect the repo-root `docs/` tree into this app's `.lectio/` directory, then
// build the search index from that manifest into `public/`. Both are generated
// artifacts, not committed.
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appDir, '../..');
const contentDir = join(appDir, '.lectio');

await collect({
  rootDir: repoRoot,
  configDir: appDir,
  config: {
    output: '.lectio',
    sources: [{ glob: 'docs/**/*.md', target: '/' }],
    editUrl: 'https://github.com/losol/lectio-docs/edit/main/{path}',
  },
});

await buildSearchIndex({
  contentDir,
  outputPath: join(appDir, 'public', 'search-index.json'),
  log: (message) => console.log(message),
});

// The generic app code (content.server.ts, routes.ts) reads the content
// location from here — the same file the lectio CLI writes when it materializes
// this app for another repo. That shared indirection is what lets app/ be
// copied to the CLI template unchanged.
writeFileSync(join(appDir, 'lectio.config.json'), JSON.stringify({ contentDir }, null, 2) + '\n');
