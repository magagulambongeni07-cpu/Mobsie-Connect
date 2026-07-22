/* Mobsie Connect API — Express server
   Run: npm install && npm start   (defaults to http://localhost:4000)
   Docs: ../docs/API.md · Handover: ../docs/HANDOVER.md */
const express = require('express');
const cors = require('cors');
const ENV = require('./env');
const store = require('./store');
const auth = require('./auth');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(cors({ origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(',') }));

const d = () => store.load();
const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const who = req => (req.user ? req.user.name : 'Anonymous');
const role = req => (req.user ? req.user.role : '—');

/* ---------------- Public ---------------- */
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'mobsie-connect-api', school: d()._meta.schoolName, time: new Date().toISOString() }));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const out = auth.login(email, password);
  if (out.error) return res.status(401).json(out);
  store.audit(out.user.name, out.user.role, 'Signed in', out.user.email, 'info');
  res.json(out);
});

// Public admission application (website / app "Apply" button)
app.post('/api/apply', (req, res) => {
  const { child, parent, email, phone, branch, grade } = req.body || {};
  if (!child || !parent) return res.status(400).json({ error: 'child and parent names are required.' });
  const db = d();
  const rec = {
    id: 'APP-' + (1100 + db.applications.length),
    child, parent, email: email || '', phone: phone || '',
    school: db._meta.schoolName, schoolId: 'sch-1',
    branch: branch || db.branches[0].name, grade: grade || 'Grade R',
    status: 'Pending Review', date: new Date().toDateString(), docs: 0,
  };
  db.applications.unshift(rec);
  db.counters.pendingReview++;
  db.appCounts[0]++;
  store.audit(parent, 'Public', 'Submitted application', rec.id + ' — ' + child, 'ok');
  store.save();
  res.status(201).json(rec);
});

/* ---------------- Authenticated below ---------------- */
app.use('/api', auth.requireAuth);

app.get('/api/auth/me', (req, res) => res.json({ user: req.user }));

/* ---------------- Parent (mobile app) routes ---------------- */
function parentOnly(req, res, next) {
  if (req.user.role !== 'Parent') return res.status(403).json({ error: 'Parent account required.' });
  req.parent = d().parents.find(p => p.id === req.user.sub);
  if (!req.parent) return res.status(404).json({ error: 'Parent record not found.' });
  next();
}

app.get('/api/me', parentOnly, (req, res) => {
  const db = d(); const p = req.parent;
  const children = db.learners.filter(l => l.parentId === p.id || l.parent === p.name);
  res.json({
    id: p.id, name: p.name, email: p.email, phone: p.phone,
    school: p.school, branch: p.branch, balance: p.balance, status: p.status,
    children: children.map(c => ({ id: c.id, name: c.name, grade: c.grade, cls: c.cls, branch: c.branch, attendance: c.attendance, fees: c.fees })),
  });
});

app.get('/api/me/invoices', parentOnly, (req, res) => {
  res.json(d().invoices.filter(i => i.parentId === req.parent.id || i.parent === req.parent.name));
});

app.get('/api/me/payments', parentOnly, (req, res) => {
  res.json(d().payments.filter(p => p.parentId === req.parent.id || p.parent === req.parent.name));
});

// Mock payment — replace with a real gateway (PayFast/Peach/Stitch) later
app.post('/api/me/pay', parentOnly, (req, res) => {
  const db = d();
  const inv = db.invoices.find(i => i.id === req.body.invoiceId && (i.parentId === req.parent.id || i.parent === req.parent.name));
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  if (inv.status === 'Paid') return res.status(409).json({ error: 'Invoice already paid.' });
  inv.status = 'Paid';
  const pay = { id: 'PAY-' + (9100 + db.payments.length), parentId: req.parent.id, parent: req.parent.name,
    school: inv.school, branch: inv.branch, amount: inv.amount, method: req.body.method || 'Card',
    date: new Date().toDateString(), status: 'Successful', ref: inv.id };
  db.payments.unshift(pay);
  req.parent.balance = Math.max(0, (req.parent.balance || 0) - inv.amount);
  store.audit(req.parent.name, 'Parent', 'Paid invoice in app', inv.id, 'ok');
  store.save();
  res.json({ payment: pay, invoice: inv });
});

app.get('/api/me/gallery', parentOnly, (req, res) => {
  res.json(d().albums.filter(a => a.branch === req.parent.branch));
});

app.get('/api/me/homework', parentOnly, (req, res) => {
  res.json(d().homeworkList.filter(h => h.school === req.parent.branch));
});

app.get('/api/me/events', parentOnly, (req, res) => {
  res.json(d().events.filter(e => e.sub.includes('All') || e.sub.includes(req.parent.branch)));
});

app.get('/api/me/newsletters', parentOnly, (req, res) => {
  res.json(d().newsletters.filter(n => n.status === 'Sent'));
});

app.get('/api/me/messages', parentOnly, (req, res) => {
  const conv = d().conversations.find(c => c.parentId === req.parent.id || c.who === req.parent.name);
  res.json(conv ? conv.msgs : []);
});

app.post('/api/me/messages', parentOnly, (req, res) => {
  const db = d();
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required.' });
  let conv = db.conversations.find(c => c.parentId === req.parent.id || c.who === req.parent.name);
  if (!conv) {
    conv = { id: uid('c'), parentId: req.parent.id, who: req.parent.name, school: req.parent.school,
      branch: req.parent.branch, unread: 0, time: 'now', msgs: [], preview: text };
    db.conversations.unshift(conv);
  }
  // Note: from the school's side this is an INcoming message
  conv.msgs.push({ dir: 'in', text, time: new Date().toTimeString().slice(0, 5) });
  conv.unread++; conv.preview = text; conv.time = 'now';
  store.save();
  res.status(201).json(conv.msgs[conv.msgs.length - 1]);
});

app.post('/api/devices', parentOnly, (req, res) => {
  const token = String(req.body.pushToken || '').trim();
  if (!token) return res.status(400).json({ error: 'pushToken is required.' });
  req.parent.pushTokens = req.parent.pushTokens || [];
  if (!req.parent.pushTokens.includes(token)) req.parent.pushTokens.push(token);
  store.save();
  res.json({ ok: true, registered: req.parent.pushTokens.length });
});

/* ---------------- Staff routes ---------------- */
app.use('/api', auth.requireStaff);

// Everything the Control Centre needs in one call
const STATE_KEYS = ['schools','branches','teachers','parents','learners','applications','appCounts',
  'interviews','waitingList','payments','invoices','discounts','conversations','newsletters',
  'pushLog','smsLog','campaigns','feedback','albums','mediaFiles','products','ordersList',
  'documentsList','tickets','adminUsers','rolePerms','auditLog','events','counters','customCal',
  'homeworkList','docFolders','reportRuns'];

// Strip secrets before sending data to any client
function publicState(){
  const db = d(); const out = {};
  for (const k of STATE_KEYS) out[k] = db[k];
  out.parents = db.parents.map(({ passwordHash, pushTokens, ...p }) => p);
  out.adminUsers = db.adminUsers.map(({ passwordHash, ...u }) => u);
  return out;
}

app.get('/api/bootstrap', (req, res) => {
  res.json({ school: d()._meta.schoolName, totals: store.totals(), state: publicState() });
});

// Control Centre whole-state sync (see HANDOVER.md — migrate screens to granular endpoints over time)
app.put('/api/state', auth.requireRole('Super Admin', 'School Owner'), (req, res) => {
  const db = d(); const body = req.body || {};
  for (const k of STATE_KEYS) {
    if (!(k in body)) continue;
    if (k === 'parents') {
      // Preserve credentials the front-end never sees
      const byId = Object.fromEntries(db.parents.map(p => [p.id, p]));
      db.parents = body.parents.map(p => ({ ...p, passwordHash: byId[p.id]?.passwordHash, pushTokens: byId[p.id]?.pushTokens || [] }));
    } else if (k === 'adminUsers') {
      const byId = Object.fromEntries(db.adminUsers.map(u => [u.id || u.email, u]));
      db.adminUsers = body.adminUsers.map(u => ({ ...u, passwordHash: byId[u.id || u.email]?.passwordHash }));
    } else {
      db[k] = body[k];
    }
  }
  store.save();
  res.json({ ok: true, savedAt: new Date().toISOString() });
});

app.get('/api/summary', (req, res) => {
  const db = d();
  res.json({ totals: store.totals(), appCounts: db.appCounts, counters: db.counters });
});

app.get('/api/audit', (req, res) => res.json(d().auditLog.slice(0, Number(req.query.limit || 100))));

app.get('/api/roles', (req, res) => res.json(d().rolePerms));
app.put('/api/roles', auth.requireRole('Super Admin'), (req, res) => {
  d().rolePerms = req.body;
  store.audit(who(req), role(req), 'Updated role permissions', 'RBAC matrix', 'warn');
  store.save();
  res.json({ ok: true });
});

/* ---- Generic CRUD for every module ---- */
const RESOURCES = {
  branches: 'branches', learners: 'learners', parents: 'parents', teachers: 'teachers',
  applications: 'applications', interviews: 'interviews', 'waiting-list': 'waitingList',
  invoices: 'invoices', payments: 'payments', discounts: 'discounts',
  newsletters: 'newsletters', push: 'pushLog', sms: 'smsLog', campaigns: 'campaigns',
  feedback: 'feedback', albums: 'albums', media: 'mediaFiles', products: 'products',
  orders: 'ordersList', documents: 'documentsList', tickets: 'tickets',
  users: 'adminUsers', events: 'events', homework: 'homeworkList', 'report-runs': 'reportRuns',
};

for (const [route, key] of Object.entries(RESOURCES)) {
  const col = () => d()[key];

  app.get('/api/' + route, (req, res) => {
    let rows = col();
    if (req.query.q) {
      const q = String(req.query.q).toLowerCase();
      rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    }
    if (req.query.branch) rows = rows.filter(r => (r.branch || r.school) === req.query.branch);
    const offset = Number(req.query.offset || 0);
    const limit = Math.min(200, Number(req.query.limit || 100));
    res.json({ total: rows.length, offset, limit, items: rows.slice(offset, offset + limit) });
  });

  app.get('/api/' + route + '/:id', (req, res) => {
    const row = col().find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: route + ' not found: ' + req.params.id });
    const { passwordHash, ...safe } = row;
    res.json(safe);
  });

  app.post('/api/' + route, (req, res) => {
    const rec = { id: uid(route.slice(0, 3)), ...req.body };
    col().unshift(rec);
    store.audit(who(req), role(req), 'Created ' + route.replace(/s$/, ''), rec.name || rec.child || rec.title || rec.id, 'ok');
    store.save();
    res.status(201).json(rec);
  });

  app.patch('/api/' + route + '/:id', (req, res) => {
    const row = col().find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: route + ' not found: ' + req.params.id });
    delete req.body.id; delete req.body.passwordHash;
    Object.assign(row, req.body);
    store.audit(who(req), role(req), 'Updated ' + route.replace(/s$/, ''), row.name || row.child || row.title || row.id, 'info');
    store.save();
    res.json(row);
  });

  app.delete('/api/' + route + '/:id', (req, res) => {
    const rows = col();
    const i = rows.findIndex(r => r.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: route + ' not found: ' + req.params.id });
    const [gone] = rows.splice(i, 1);
    store.audit(who(req), role(req), 'Deleted ' + route.replace(/s$/, ''), gone.name || gone.child || gone.title || gone.id, 'warn');
    store.save();
    res.json({ ok: true });
  });
}

/* ---- Domain actions (the verbs the Control Centre uses) ---- */
function findOr404(res, key, id) {
  const row = d()[key].find(r => r.id === id);
  if (!row) res.status(404).json({ error: id + ' not found.' });
  return row;
}

function moveAppStatus(a, st) {
  const db = d();
  const S = ['Pending Review', 'Documents Required', 'Interview Scheduled', 'Approved', 'Rejected'];
  const oldI = S.indexOf(a.status), newI = S.indexOf(st);
  if (oldI >= 0 && db.appCounts[oldI] > 0) db.appCounts[oldI]--;
  if (newI >= 0) db.appCounts[newI]++;
  if (a.status === 'Pending Review' && st !== 'Pending Review' && db.counters.pendingReview > 0) db.counters.pendingReview--;
  a.status = st;
}

app.post('/api/applications/:id/approve', (req, res) => {
  const a = findOr404(res, 'applications', req.params.id); if (!a) return;
  moveAppStatus(a, 'Approved');
  store.audit(who(req), role(req), 'Approved application', a.id + ' — ' + a.child, 'ok');
  store.save(); res.json(a);
});

app.post('/api/applications/:id/reject', (req, res) => {
  const a = findOr404(res, 'applications', req.params.id); if (!a) return;
  moveAppStatus(a, 'Rejected');
  store.audit(who(req), role(req), 'Rejected application', a.id + ' — ' + a.child, 'warn');
  store.save(); res.json(a);
});

app.post('/api/applications/:id/schedule-interview', (req, res) => {
  const a = findOr404(res, 'applications', req.params.id); if (!a) return;
  const db = d();
  const iv = { id: 'INT-' + (300 + db.interviews.length), child: a.child, parent: a.parent,
    school: a.school, branch: a.branch, grade: a.grade,
    date: req.body.date || 'TBC', time: req.body.time || '09:00',
    interviewer: req.body.interviewer || 'Admissions', mode: req.body.mode || 'In-person', status: 'Scheduled' };
  db.interviews.unshift(iv);
  moveAppStatus(a, 'Interview Scheduled');
  store.audit(who(req), role(req), 'Scheduled interview', a.child + ' — ' + iv.date, 'ok');
  store.save(); res.status(201).json(iv);
});

app.post('/api/invoices/:id/mark-paid', (req, res) => {
  const inv = findOr404(res, 'invoices', req.params.id); if (!inv) return;
  if (inv.status === 'Paid') return res.status(409).json({ error: 'Invoice already paid.' });
  inv.status = 'Paid';
  const db = d();
  db.payments.unshift({ id: 'PAY-' + (9100 + db.payments.length), parentId: inv.parentId, parent: inv.parent,
    school: inv.school, branch: inv.branch, amount: inv.amount, method: req.body.method || 'EFT',
    date: new Date().toDateString(), status: 'Successful', ref: inv.id });
  store.audit(who(req), role(req), 'Marked invoice paid', inv.id, 'ok');
  store.save(); res.json(inv);
});

app.post('/api/payments/:id/retry', (req, res) => {
  const p = findOr404(res, 'payments', req.params.id); if (!p) return;
  p.status = 'Successful';
  store.audit(who(req), role(req), 'Retried payment', p.id, 'ok');
  store.save(); res.json(p);
});

app.post('/api/tickets/:id/resolve', (req, res) => {
  const t = findOr404(res, 'tickets', req.params.id); if (!t) return;
  t.status = 'Resolved';
  store.audit(who(req), role(req), 'Resolved ticket', t.id, 'ok');
  store.save(); res.json(t);
});

app.post('/api/tickets/:id/assign', (req, res) => {
  const t = findOr404(res, 'tickets', req.params.id); if (!t) return;
  t.agent = req.body.agent || who(req);
  if (t.status === 'Open') t.status = 'In Progress';
  store.audit(who(req), role(req), 'Assigned ticket', t.id + ' → ' + t.agent, 'info');
  store.save(); res.json(t);
});

app.post('/api/orders/:id/ready', (req, res) => {
  const o = findOr404(res, 'ordersList', req.params.id); if (!o) return;
  o.status = 'Ready for Collection';
  store.save(); res.json(o);
});

app.post('/api/orders/:id/collected', (req, res) => {
  const o = findOr404(res, 'ordersList', req.params.id); if (!o) return;
  o.status = 'Collected';
  store.save(); res.json(o);
});

app.post('/api/products/:id/restock', (req, res) => {
  const p = findOr404(res, 'products', req.params.id); if (!p) return;
  p.stock += Number(req.body.units || 50);
  p.status = p.stock === 0 ? 'Out of Stock' : p.stock < 20 ? 'Low Stock' : 'Active';
  store.audit(who(req), role(req), 'Restocked product', p.name, 'ok');
  store.save(); res.json(p);
});

// Send a communication: channel = newsletter | push | sms | campaign
app.post('/api/comms/:channel', (req, res) => {
  const db = d();
  const { channel } = req.params;
  const { subject, body, audience } = req.body || {};
  if (!subject) return res.status(400).json({ error: 'subject is required.' });
  const aud = audience || 'All campuses';
  const size = aud === 'All campuses' ? store.totals().parents
    : Math.round((db.branches.find(b => b.name === aud)?.students || 180) * 0.78);
  let rec;
  if (channel === 'newsletter') { rec = { id: uid('nl'), title: subject, audience: aud, sent: 'Just now', recipients: size, openRate: 0, status: 'Sent' }; db.newsletters.unshift(rec); }
  else if (channel === 'push') { rec = { id: uid('pu'), title: subject, audience: aud, time: 'Just now', delivered: size, opened: 0, status: 'Delivered' }; db.pushLog.unshift(rec); }
  else if (channel === 'sms') { rec = { id: uid('sm'), to: aud, msg: subject, time: 'Just now', count: size, status: 'Delivered' }; db.smsLog.unshift(rec); }
  else if (channel === 'campaign') { rec = { id: uid('cp'), name: subject, subject, audience: aud, sent: size, openRate: 0, clickRate: 0, status: 'Running' }; db.campaigns.unshift(rec); }
  else return res.status(400).json({ error: 'Unknown channel. Use newsletter | push | sms | campaign.' });
  store.audit(who(req), role(req), 'Sent ' + channel, subject + ' → ' + aud, 'ok');
  store.save();
  res.status(201).json(rec);
});

/* ---------------- Errors & boot ---------------- */
app.use('/api', (req, res) => res.status(404).json({ error: 'No such endpoint. See docs/API.md.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

store.load();
app.listen(ENV.PORT, () => {
  console.log(`\n  Mobsie Connect API running on http://localhost:${ENV.PORT}`);
  console.log(`  Health check:  GET  http://localhost:${ENV.PORT}/api/health`);
  console.log(`  Staff login:   POST http://localhost:${ENV.PORT}/api/auth/login  { email: "${ENV.ADMIN_EMAIL}", password: "…" }`);
  console.log(`  Docs: docs/API.md · docs/HANDOVER.md\n`);
});
