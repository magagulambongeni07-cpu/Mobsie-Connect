# Mobsie Connect — Control Centre

An enterprise-grade, multi-tenant **school management platform** design, built to the standard of
HubSpot, Stripe, Linear and Google Workspace Admin — while keeping the friendly orange / green /
purple identity of the Mobsie Connect mobile app.

**Open `index.html` in any browser. No build step, no dependencies, no server required.**

```
python3 -m http.server 8000   # optional — file:// works too
```

## What's inside

| Area | Pages |
|---|---|
| Executive | Dashboard (KPIs, revenue vs MRR, application donut, attendance, activity, leaderboard, events, growth, system health) |
| Platform | Schools directory (cards, plans, quick actions, drawer with subscription & branches), Branches |
| Admissions | Applications (funnel + pipeline tabs), Interviews, Waiting List |
| Students | Learners, Parents, Teachers — directories with profile drawers |
| Academics | Attendance (ring + heatmap + branch table), Homework, Reports, Calendar |
| Finance | Payments, Invoices, Statements & payouts, Discounts |
| Communications | Messages (live chat), Newsletters, Push, SMS, Email Campaigns, Feedback Centre |
| Media & Shop | Gallery albums, Media Library, Products, Orders, Inventory |
| Insights | Analytics, Documents |
| Operations | Support Tickets, Users, Roles & Permissions (clickable RBAC matrix), Audit Logs |
| System | Settings — General, **White Label branding with live preview**, Billing plans, Notifications, Integrations, Security |

## Product model

Multi-tenant hierarchy: **Platform → Schools → Branches → Teachers → Classes → Parents → Students.**
Every record belongs to a school; schools have unlimited branches. The top-bar **school / branch
switcher** lets a Super Admin jump into any school instantly — every scoped page re-filters live.

Roles: Super Admin, School Owner, Branch Principal, Finance Manager, Admissions, Teacher, Parent
(mobile app) — enforced visually through the Roles & Permissions matrix.

## Interactions that work

- **⌘K / Ctrl-K global search** across schools, branches, people, invoices, documents and tickets
- Sortable, paginated, searchable data tables everywhere
- Record drawers (schools, branches, learners, parents, teachers, applications, payments, tickets…)
- Modals for create flows, dropdown menus, toasts, tab groups, toggles
- Chart tooltips with crosshairs; RBAC matrix cells toggle on click; chat sends replies

## Architecture

```
index.html
assets/css/mobsie.css        design tokens + component library (~1 file, responsive to ultra-wide)
assets/js/icons.js           inline SVG icon set
assets/js/data.js            seeded deterministic demo data (128 schools, 380+ branches, ZAR)
assets/js/charts.js          dependency-free SVG charts: line, donut, ring, bars, spark, funnel, heatmap
assets/js/ui.js              shared components: stat tiles, tables, drawers, modals, menus, badges
assets/js/app.js             shell: sidebar, topbar, hash router, school switcher, global search
assets/js/pages/*.js         one module per sidebar section
```

Chart colours follow a fixed categorical order (`#EA580C → #7C3AED → #16A34A → #2563EB`) validated
for colour-vision-deficiency separation and contrast on white.
