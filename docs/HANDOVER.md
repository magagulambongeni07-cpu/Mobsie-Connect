# Developer Handover — Mobsie Connect

Hi Samuel 👋 — this document gets you from `git clone` to a running full-stack
system and tells you exactly where to plug the mobile app in.

## What this repo contains

```
index.html + assets/       The Control Centre web app (no build step — plain HTML/CSS/JS)
server/                    The backend API (Node 18+, Express, JWT auth)
docs/API.md                Full endpoint reference with curl examples
docs/HANDOVER.md           This file
```

The product: **one school group, 5 live campuses** (Soshanguve 1 & 2, Mamelodi,
Cosmo City–Randburg, Sky-City–Alberton) plus an expansion pipeline
(Atteridgeville, Soweto, Thembisa). The school's display name is a single
constant in two places — keep them in sync if you change it:
`assets/js/data.js` → `SCHOOL_NAME` and `server/src/seed.js` → `SCHOOL_NAME`.

## Run it (2 minutes)

```bash
cd server
cp .env.example .env        # change JWT_SECRET + passwords before going live
npm install
npm start                   # → http://localhost:4000
```

Then open `index.html` in a browser (or serve the repo root:
`python3 -m http.server 8000`). The Control Centre auto-detects the API at
`http://localhost:4000/api`, logs in, and shows a **"Connected to Mobsie API"**
toast. Every change made in the UI is now stored server-side in
`server/data/db.json` — refresh, switch browsers, it persists.

No API running? The web app silently falls back to browser-local demo mode, so
the front-end always works.

**Default accounts** (seeded, change via `.env`):

| Who | Email | Password | Role |
|---|---|---|---|
| Thandi (owner) | `thandi@mobsie.co.za` | `admin123` | Super Admin |
| Campus principals | `naledi@…`, `sipho@…`, `lerato@…`, `ayanda@…`, `kagiso@…` `@mobsie.co.za` | `staff123` | Branch Principal |
| Any seeded parent | see `GET /api/parents` | `parent123` | Parent (mobile app) |

`npm run seed` resets the database to the seed data.

## Architecture

- **`server/src/index.js`** — all routes. Public: health, login, `/api/apply`.
  Parent (mobile): `/api/me/*`. Staff: generic CRUD for every module + domain
  actions (approve application, mark invoice paid, restock, resolve ticket…).
- **`server/src/store.js`** — persistence. Currently a JSON file
  (`server/data/db.json`). It exposes `load / save / audit / totals`; to move to
  Postgres/Prisma later, replace this one module — routes don't touch the disk.
- **`server/src/auth.js`** — JWT login for staff and parents, `requireAuth` /
  `requireStaff` / `requireRole` middlewares. bcrypt-hashed passwords.
- **`server/src/seed.js`** — the 5-campus seed data (mirrors the front-end).
- **`assets/js/api.js`** — the Control Centre's adapter. On boot it calls
  `GET /api/bootstrap` and swaps in server data; after every mutation it syncs
  the state back with `PUT /api/state` (debounced).

### About the state-sync model (read this)

The Control Centre currently syncs its **whole state** to `PUT /api/state`
after each change. This was the fastest way to make the finished UI real, and
it's fine for a single-admin school. The **granular REST endpoints already
exist and work** (see API.md) — they operate on the same store. The intended
path: migrate Control-Centre screens from state-sync to the granular endpoints
one module at a time (start with Admissions and Invoices), then delete the
`/api/state` route. **Build the mobile app against the granular endpoints
only** — never against `/api/state`.

## Linking the mobile app

Point the app at the API base URL (`http://<host>:4000/api`) and use:

1. **Login** — `POST /api/auth/login` with the parent's email/password → save
   the JWT, send it as `Authorization: Bearer <token>` on every call.
2. **Home screen** — `GET /api/me` (profile + children with attendance & fee
   status).
3. **Fees** — `GET /api/me/invoices`, `GET /api/me/payments`,
   `POST /api/me/pay { invoiceId }`. The pay endpoint is a **mock** — swap in a
   real gateway (PayFast / Peach / Stitch / Yoco) inside that route.
4. **Gallery** — `GET /api/me/gallery` (albums scoped to the child's campus).
5. **Homework** — `GET /api/me/homework`.
6. **Calendar** — `GET /api/me/events`.
7. **Newsletters** — `GET /api/me/newsletters`.
8. **Chat with the school** — `GET /api/me/messages`,
   `POST /api/me/messages { text }`. Messages appear instantly in the Control
   Centre's Messages inbox.
9. **Push tokens** — `POST /api/devices { pushToken }` registers the device
   (stored per parent; hook FCM/APNs delivery into the `/api/comms/push` route).
10. **New enquiries** — `POST /api/apply` is public (no auth) for an
    application form; it lands in the Control Centre's Admissions pipeline
    with the sidebar badge updating.

Everything a parent does through these endpoints shows up live in the Control
Centre, and vice-versa.

## Production checklist (before real families use it)

- [ ] Change `JWT_SECRET`, `ADMIN_PASSWORD`, `PARENT_PASSWORD` in `.env`
- [ ] Restrict `CORS_ORIGIN` to your real app/web domains
- [ ] Put the API behind HTTPS (any reverse proxy — Caddy/nginx — or a PaaS like Railway/Render/Fly)
- [ ] Swap the JSON store for Postgres (replace `store.js`; the seed gives you the schema shape)
- [ ] Replace the mock `POST /api/me/pay` with a real payment gateway + webhooks
- [ ] Real file storage for gallery/media uploads (S3-compatible; currently metadata only)
- [ ] Rate-limit `/api/auth/login` and `/api/apply`
- [ ] Add a proper password-reset flow (email OTP)
- [ ] Migrate Control-Centre screens off `PUT /api/state` (see above)

## Questions the code answers quickly

- *Where do roles/permissions live?* `GET/PUT /api/roles` and the seed's
  `rolePerms` — the Control Centre's matrix edits persist here.
- *Where's the audit trail?* Every mutating route calls `store.audit(...)`;
  read it at `GET /api/audit`.
- *How do I add a module?* Add a collection to `seed.js`, one line to the
  `RESOURCES` map in `index.js`, and you have full CRUD + search + pagination.
