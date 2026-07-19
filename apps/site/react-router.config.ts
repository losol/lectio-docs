import type { Config } from '@react-router/dev/config';

export default {
  // SSR on by default. For a fully static reference site later, flip to
  // `ssr: false` + `prerender: true` (or a list of paths) — SSG in one line.
  ssr: true,
} satisfies Config;
