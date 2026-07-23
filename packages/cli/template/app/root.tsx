import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

// Design tokens + component styles for ratio-ui, which @eventuras/markdown
// renders the collected markdown with. `?url` + the links export: React
// Router renders the whole <html> document, so the stylesheet must be a real
// <link> in the SSR head rather than something Vite injects after hydration.
import ratioUiStylesheet from '@eventuras/ratio-ui/ratio-ui.css?url';

import { SiteHeader } from './components/site-header';

export function links() {
  return [{ rel: 'stylesheet', href: ratioUiStylesheet }];
}

// Resolve the theme before first paint so a stored dark-mode choice or the
// system preference paints correctly from the first frame.
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
