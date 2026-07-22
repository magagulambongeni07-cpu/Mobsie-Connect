/* Auth: JWT login for staff (adminUsers) and parents (mobile app). */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ENV = require('./env');
const store = require('./store');

const ADMIN_ROLES = ['Super Admin','School Owner','Branch Principal','Finance Manager','Admissions','Support Agent','Support Lead','Teacher'];

function login(email, password){
  const d = store.load();
  email = String(email || '').toLowerCase().trim();
  const staff = d.adminUsers.find(u => u.email.toLowerCase() === email);
  if (staff && staff.passwordHash && bcrypt.compareSync(password, staff.passwordHash)) {
    if (staff.status === 'Suspended') return { error: 'Account suspended — contact your administrator.' };
    return { token: sign({ sub: staff.id, kind: 'staff', role: staff.role, name: staff.name, email: staff.email, scope: staff.scope }),
      user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, scope: staff.scope } };
  }
  const parent = d.parents.find(p => p.email.toLowerCase() === email);
  if (parent && parent.passwordHash && bcrypt.compareSync(password, parent.passwordHash)) {
    return { token: sign({ sub: parent.id, kind: 'parent', role: 'Parent', name: parent.name, email: parent.email, branch: parent.branch }),
      user: { id: parent.id, name: parent.name, email: parent.email, role: 'Parent', branch: parent.branch } };
  }
  return { error: 'Invalid email or password.' };
}

function sign(payload){
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '30d' });
}

// Express middleware: require a valid token; attaches req.user
function requireAuth(req, res, next){
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token. Login at POST /api/auth/login first.' });
  try {
    req.user = jwt.verify(token, ENV.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Require a staff role (any admin-side role). Parents are rejected.
function requireStaff(req, res, next){
  if (!req.user || !ADMIN_ROLES.includes(req.user.role))
    return res.status(403).json({ error: 'Staff access required.' });
  next();
}

// Require one of the given roles
function requireRole(...roles){
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}.` });
    next();
  };
}

module.exports = { login, sign, requireAuth, requireStaff, requireRole, ADMIN_ROLES };
