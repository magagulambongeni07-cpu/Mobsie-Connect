'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/*
  AppShell renders the Control Centre chrome (the same DOM skeleton the original
  app used) and, on the client only, loads the app modules and boots them.

  Why this shape? The Control Centre's 35 pages, charts, tables, drawers and
  data layer are ~4,000 lines of verified vanilla JS built around a render() +
  mount() pattern. Rather than risk a line-by-line JSX rewrite, we keep that
  code intact as client-only modules (components/legacy/*) and let React own the
  routing, the page container and the app lifecycle. Each URL is a real Next.js
  route; navigating re-renders the active page through the legacy engine.

  To migrate a page to idiomatic React later, replace its entry in
  components/legacy/pages/* with a React component and render it here by route —
  the data layer (window.DB) and helpers stay the same.
*/

let libsPromise = null;
function loadLibs() {
  // Import order matters: icons/data/charts/ui/app-core, then the pages.
  if (!libsPromise) libsPromise = import('@/components/legacy/boot');
  return libsPromise;
}

export default function AppShell({ route = 'dashboard' }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    // Let the legacy layer drive Next navigation for in-app links.
    window.__mobsieNavigate = (r) => router.push('/' + r);
    loadLibs().then(() => {
      if (cancelled) return;
      if (typeof window.MobsieBoot === 'function') window.MobsieBoot(route);
    });
    return () => {
      cancelled = true;
    };
  }, [route, router]);

  return (
    <div id="app" className="app">
      <aside className="sidebar" id="sidebar" aria-label="Main navigation" suppressHydrationWarning />
      <div className="sidebar-scrim" id="sidebarScrim" />
      <div className="main">
        <header className="topbar" id="topbar" suppressHydrationWarning />
        <main className="content" id="content" tabIndex={-1} suppressHydrationWarning />
      </div>

      {/* Overlays the imperative UI helpers mount into */}
      <div className="search-overlay" id="searchOverlay" hidden />
      <div className="drawer-root" id="drawerRoot" />
      <div className="modal-root" id="modalRoot" />
      <div className="chart-tip" id="chartTip" hidden />
      <div className="toast-stack" id="toastStack" />
    </div>
  );
}
