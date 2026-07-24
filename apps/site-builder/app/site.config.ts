// Site branding, the one place the app is not generic. Committed here with the
// reference site's own values; the lectio CLI overwrites this file when it
// materializes this same app for another repo, so everything under app/ stays
// shared between the two.
export const site = {
  title: 'Lectio Docs',
  githubUrl: 'https://github.com/losol/lectio-docs' as string | undefined,
};
