# Mobsie Connect API — Reference

Base URL (dev): `http://localhost:4000/api`
All requests and responses are JSON. Authenticated calls need
`Authorization: Bearer <token>` from the login endpoint.

## Auth

### `POST /auth/login` — staff or parent login *(public)*
```bash
curl -s http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"thandi@mobsie.co.za","password":"admin123"}'
# → { "token":"eyJ…", "user": { "id":"u-0","name":"Thandi Admin","role":"Super Admin", … } }
```
Parents log in with their email + the parent password (`parent123` in dev) and
receive `role: "Parent"` tokens that only work on `/me/*` routes.

### `GET /auth/me` — decode the current token

## Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check, school name |
| POST | `/apply` | Public admission application `{child, parent, email?, phone?, branch?, grade?}` → lands in the Admissions pipeline |

## Parent (mobile app) — token with `role: "Parent"`

| Method | Path | Purpose |
|---|---|---|
| GET | `/me` | Profile + children (grade, class, attendance, fee status) |
| GET | `/me/invoices` | The parent's invoices |
| GET | `/me/payments` | Payment history |
| POST | `/me/pay` | `{invoiceId, method?}` — mock payment; marks invoice paid, creates a payment, reduces balance |
| GET | `/me/gallery` | Albums for the child's campus |
| GET | `/me/homework` | Homework for the child's campus |
| GET | `/me/events` | Calendar events (campus + whole-school) |
| GET | `/me/newsletters` | Sent newsletters |
| GET | `/me/messages` | Chat thread with the school |
| POST | `/me/messages` | `{text}` — send a message (appears in Control Centre inbox) |
| POST | `/devices` | `{pushToken}` — register the device for push |

```bash
TOKEN=$(curl -s http://localhost:4000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"<parent-email>","password":"parent123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s http://localhost:4000/api/me -H "Authorization: Bearer $TOKEN"
```

## Staff — token with any staff role

### Aggregates

| Method | Path | Purpose |
|---|---|---|
| GET | `/bootstrap` | Everything the Control Centre needs (all collections + totals), secrets stripped |
| GET | `/summary` | Headline totals, application pipeline counts |
| GET | `/audit?limit=100` | Audit trail (every mutation is logged automatically) |
| GET/PUT | `/roles` | RBAC permission matrix (PUT: Super Admin only) |
| PUT | `/state` | Control-Centre whole-state sync (Super Admin / School Owner). **Do not build the mobile app on this.** |

### Resource CRUD

Every module has the same five endpoints. `GET` lists support
`?q=<search>&branch=<campus>&limit=&offset=` and return
`{total, offset, limit, items}`.

```
GET    /api/<resource>          list + search + paginate
GET    /api/<resource>/:id      one record
POST   /api/<resource>          create (server assigns id)
PATCH  /api/<resource>/:id      partial update
DELETE /api/<resource>/:id      delete
```

Resources: `branches` `learners` `parents` `teachers` `applications`
`interviews` `waiting-list` `invoices` `payments` `discounts` `newsletters`
`push` `sms` `campaigns` `feedback` `albums` `media` `products` `orders`
`documents` `tickets` `users` `events` `homework` `report-runs`

```bash
curl -s "http://localhost:4000/api/learners?branch=Cosmo%20City%20Branch&q=grade%20r" \
  -H "Authorization: Bearer $TOKEN"
```

### Domain actions

| Method | Path | Effect |
|---|---|---|
| POST | `/applications/:id/approve` | Status → Approved; pipeline counts + badge update |
| POST | `/applications/:id/reject` | Status → Rejected |
| POST | `/applications/:id/schedule-interview` | `{date, time, mode?, interviewer?}` — creates interview, moves status |
| POST | `/invoices/:id/mark-paid` | `{method?}` — marks paid + records a payment |
| POST | `/payments/:id/retry` | Failed payment → Successful |
| POST | `/tickets/:id/resolve` | Ticket → Resolved |
| POST | `/tickets/:id/assign` | `{agent}` — assigns; Open → In Progress |
| POST | `/orders/:id/ready` | Order → Ready for Collection |
| POST | `/orders/:id/collected` | Order → Collected |
| POST | `/products/:id/restock` | `{units?=50}` — adds stock, recomputes status |
| POST | `/comms/:channel` | `{subject, body?, audience?}` — channel = `newsletter` \| `push` \| `sms` \| `campaign`; appends to the matching log |

## Errors

Errors are always `{ "error": "human-readable message" }` with a meaningful
status: `400` bad input · `401` no/bad token · `403` wrong role ·
`404` not found · `409` conflict (e.g. paying a paid invoice).

## Notes

- IDs are strings (`br-3`, `APP-1042`, `INV-000880`, server-generated for new records).
- Amounts are integer Rand values.
- Dates are display strings in the seed (demo); switch to ISO 8601 when you move to Postgres.
- Passwords are bcrypt-hashed; hashes and push tokens are never returned by any endpoint.
