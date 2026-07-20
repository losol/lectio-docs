import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collect } from '@eventuras/lectio-docs';

// Collect the repo-root `docs/` tree into this app's `.lectio/` directory.
// Run as part of `dev` and `build` — the output is generated, not committed.
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appDir, '../..');

await collect({
  rootDir: repoRoot,
  configDir: appDir,
  config: {
    output: '.lectio',
    sources: [{ glob: 'docs/**/*.md', target: '/' }],
  },
});
