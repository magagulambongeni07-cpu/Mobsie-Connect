# Mobsie Connect — Control Centre

An enterprise-grade **school management platform**, built to the standard of
HubSpot, Stripe, Linear and Google Workspace Admin — with the friendly orange /
green / purple identity of the Mobsie Connect mobile app.

This is a **Next.js frontend running on mock data** — no backend, no database.
Everything runs in the browser and persists to `localStorage`.

Seeded with the real school structure: **5 live campuses** — Soshanguve Branch 1
& 2 and Mamelodi (Pretoria), Cosmo City–Randburg and Sky-City–Alberton
(Johannesburg) — plus an expansion pipeline for **Atteridgeville, Soweto and
Thembisa**. The school group's name is one constant (`SCHOOL_NAME` in
`components/legacy/data.js`).

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

Static production build (host the `out/` folder anywhere):

```bash
npm run build          # → ./out
npx serve out          # preview locally
```

## What's inside

| Area | Pages |
|---|---|
| Executive | Dashboard (KPIs, fees vs last month, application donut, attendance, activity, campus leaderboard, events, growth, system health) |
| Platform | Our School (campus cards + expansion pipeline), Branches |
| Admissions | Applications (funnel + pipeline tabs), Interviews, Waiting List |
| Students | Learners, Parents, Teachers |
| Academics | **Daily Activity** (build the parent-app timeline, with live phone preview), Attendance (ring + heatmap), Homework, Reports, Calendar |
| Finance | Payments, Invoices, Statements & payouts, Discounts |
| Communications | Messages (live chat), Newsletters, Push, SMS, Email Campaigns, Feedback |
| Media & Shop | Gallery albums, Media Library, Products, Orders, Inventory |
| Insights | Analytics, Documents |
| Operations | Support Tickets, Users, Roles & Permissions (clickable RBAC matrix), Audit Logs |
| System | Settings — General, White Label branding (live preview), Billing, Notifications, Integrations, Security |

## Fully interactive

Every button performs a real action against the mock data — approve or reject
applications, schedule interviews, open a new campus, enrol learners, mark
invoices paid, retry payments, restock the shop, resolve tickets, send
newsletters/push/SMS, toggle RBAC permissions, download CSV exports. Changes
persist in the browser; **Settings → Reset Demo Data** restores the seed.

Plus: **⌘K / Ctrl-K global search**, a campus switcher, sortable/paginated
tables, record drawers, modals, and dependency-free SVG charts with tooltips.

## Tech

Next.js (App Router) · React · plain CSS design system · zero runtime
dependencies beyond React/Next. Static-exportable (`output: 'export'`).

See **`docs/HANDOVER.md`** for the developer guide (architecture, how the pages
render, how to migrate a page to idiomatic React, how to add a real backend
later).
