import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

// Design tokens + component styles for ratio-ui, which @eventuras/markdown
// renders the collected markdown with.
//
// `?url` + the links export, not a side-effect import: React Router renders
// the whole <html> document, so the stylesheet must be a real <link> in the
// SSR head rather than something Vite injects after hydration.
import ratioUiStylesheet from '@eventuras/ratio-ui/ratio-ui.css?url';

import { SiteHeader } from './components/site-header';

export function links() {
  return [{ rel: 'stylesheet', href: ratioUiStylesheet }];
}

// Resolve the theme before first paint so a stored dark-mode choice (the
// header's ThemeToggle writes it) or the system preference paints correctly
// from the first frame — an effect after hydration would flash light first.
// Since ratio-ui 2.15 this is purely about avoiding that flash: the page is
// visible by default and the old hide-until-themed gate is opt-in
// (`data-theme-loading`), which we don't need with a blocking script.
const themeInit = `document.documentElement.setAttribute('data-theme', (function () { try { var t = localStorage.getItem('lectio-theme'); if (t === 'light' || t === 'dark') return t; } catch (e) {} return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; })());`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  );
}
