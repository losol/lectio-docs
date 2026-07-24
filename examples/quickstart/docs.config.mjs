// A minimal Lectio setup. Point `sources` at your markdown, name your site,
// then run `npx lectio build` to get a static, searchable docs site in ./dist.
export default {
  // Where the collected manifest + markdown land (gitignored).
  output: '.lectio',

  // Which files to gather, and where they mount. `target: '/'` puts content/ at
  // the site root, so content/index.md becomes `/` and content/guides/x.md
  // becomes `/guides/x`.
  sources: [{ glob: 'content/**/*.md', target: '/' }],

  // "Edit this page" link template; {path} is filled with each page's source
  // path (relative to this config's dir). Point it at your own repo.
  editUrl: 'https://github.com/your-org/your-repo/edit/main/{path}',

  // Branding rendered in the site header.
  site: {
    title: 'Quickstart',
    githubUrl: 'https://github.com/your-org/your-repo',
  },
};
