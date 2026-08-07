import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Build the starter `docs.config.ts` for a repo that has none.
 *
 * Follows monorepo conventions: root docs/ on top, then apps, packages, libs.
 * Name variants share a group (apps/ or Applications/ → /apps; libs/ or
 * Libraries/ → /libs); globs need each dir's real name, so match against
 * actual root entries. Source order is sidebar order.
 */
export function starterConfig(cwd) {
  const rootEntries = readdirSync(cwd, { withFileTypes: true });
  const dirsNamed = (...aliases) =>
    rootEntries.filter((e) => e.isDirectory() && aliases.includes(e.name.toLowerCase())).map((e) => e.name);

  const docsDirs = dirsNamed('docs');
  const appDirs = dirsNamed('apps', 'applications');
  const packageDirs = dirsNamed('packages');
  const libDirs = dirsNamed('libs', 'libraries');

  const sources = [];
  const group = (dirs, target) => {
    for (const dir of dirs) {
      sources.push(`{ glob: '${dir}/*/README.md', target: '${target}', titleFromPackageJson: true }`);
      sources.push(`{ glob: '${dir}/*/docs/**/*.md', target: '${target}' }`);
    }
  };

  if (docsDirs.length + appDirs.length + packageDirs.length + libDirs.length > 0) {
    for (const dir of docsDirs) sources.push(`{ glob: '${dir}/**/*.md', target: '/' }`);
    // The root README is the home page — unless a docs index.md claims "/".
    const hasDocsIndex = docsDirs.some((dir) => existsSync(resolve(cwd, dir, 'index.md')));
    if (existsSync(resolve(cwd, 'README.md')) && !hasDocsIndex) sources.push(`{ glob: 'README.md', target: '/' }`);
    group(appDirs, '/apps');
    group(packageDirs, '/packages');
    group(libDirs, '/libs');
  } else {
    // Whole-tree sweep — collect skips node_modules, dist, .next and dotfiles.
    sources.push(`{ glob: '**/*.md', target: '/' }`);
  }

  return `// Created by lectio — edit to taste, then re-run.
// Source order is sidebar order.
export default {
  output: '.lectio',
  sources: [
${sources.map((entry) => `    ${entry},`).join('\n')}
  ],
  site: { title: 'Docs' },
};
`;
}
