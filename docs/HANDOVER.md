# Developer Handover — Mobsie Connect (Next.js)

Hi Samuel 👋 — this is the **Mobsie Connect Control Centre** as a **Next.js
frontend**. It runs entirely in the browser on **mock data** — there is no
backend server and no database. Everything (schools, campuses, learners,
payments…) is generated in-app and persists to the browser's `localStorage`.

## What it is

A school-management admin dashboard for **one school group with 5 live
campuses** (Soshanguve 1 & 2, Mamelodi, Cosmo City–Randburg, Sky-City–Alberton)
plus an expansion pipeline (Atteridgeville, Soweto, Thembisa). 35 pages:
dashboard, admissions, students, academics, finance, communications, media,
shop, analytics, documents, support, users, roles, audit, settings.

The school's display name is one constant — `SCHOOL_NAME` in
`components/legacy/data.js`. Change it there and it flows through the whole app.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production / static build (outputs a plain `out/` folder you can host on any
static host — Vercel, Netlify, GitHub Pages, S3, nginx):

```bash
npm run build        # → ./out
npx serve out        # preview the static build locally
```

Node 18+ required.

## Project structure

```
app/
  layout.js              Root layout + <html>/<body>
  globals.css            The whole design system (tokens, components, responsive)
  page.js                "/" → renders the dashboard
  [route]/page.js        One static page per route (generateStaticParams lists all 35)
components/
  AppShell.js            'use client' — renders the chrome + boots the app on the client
  legacy/
    boot.js              Imports the modules below in dependency order
    icons.js             SVG icon set  → window.MCIcon
    data.js              Mock data + localStorage persistence → window.DB
    charts.js            Dependency-free SVG charts → window.Charts
    ui.js                Tables, drawers, modals, menus, toasts → window.UI
    app-core.js          Sidebar, topbar, page host, ⌘K search → window.App / MobsieBoot
    pages/*.js           The 35 pages (one file per module) → window.Pages
```

### How rendering works (read this before editing pages)

The 35 pages are built with a `render()` (returns an HTML string) + `mount(el)`
(wires up events) pattern — ~4,000 lines of verified UI. Next.js owns the
routing, the URLs and the app lifecycle; `AppShell` loads the page modules on
the client and renders the active page into `#content`. Each sidebar link is a
real Next.js route (`/dashboard`, `/schools`, …) so back/forward and deep-links
work, and `npm run build` prerenders every one as static HTML.

**To convert a page to idiomatic React** (optional, incremental): write a React
component for it and render it by route inside `AppShell` instead of calling the
legacy `render()/mount()`. The data layer (`window.DB`) and helpers stay the
same, so you can migrate one page at a time without touching the others.

## The mock data

`components/legacy/data.js` seeds everything deterministically (same on every
fresh load) and exposes it as `window.DB`. Any change made in the UI (approve an
application, add a campus, mark an invoice paid…) mutates `DB` and is saved to
`localStorage`, so it survives refresh. **Settings → Reset Demo Data** clears it
back to the seed.

There is no network layer to mock or stub — if/when you add a real backend
later, replace the reads/writes in `data.js` (and the per-page mutations) with
`fetch` calls; the UI code above it doesn't change.

## Notes

- Pure client app: `data.js`, `ui.js` etc. touch `window`/`localStorage`, so
  they are loaded only in the browser (dynamic-imported inside `AppShell`'s
  effect), never during the static prerender.
- No environment variables, no secrets, nothing to configure to run it.
- The design system lives entirely in `app/globals.css` (brand colours are CSS
  custom properties at the top).
