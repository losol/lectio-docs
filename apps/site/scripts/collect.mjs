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
  },
});

await buildSearchIndex({
  contentDir,
  outputPath: join(appDir, 'public', 'search-index.json'),
  log: (message) => console.log(message),
});
