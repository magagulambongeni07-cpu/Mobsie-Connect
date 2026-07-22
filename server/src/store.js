/* JSON-file data store. One source of truth: server/data/db.json.
   Simple by design — swap this module for Postgres/Prisma later without
   touching the routes (see docs/HANDOVER.md → "Upgrading the store"). */
const fs = require('fs');
const path = require('path');
const seed = require('./seed');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

let db = null;
let saveTimer = null;

function load(){
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      return db;
    } catch (e) {
      console.error('db.json is corrupt — reseeding. (Backed up to db.bad.json)');
      fs.copyFileSync(DB_PATH, path.join(DATA_DIR, 'db.bad.json'));
    }
  }
  db = seed.build();
  persistNow();
  console.log('Seeded fresh database at', DB_PATH);
  return db;
}

function persistNow(){
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1));
}

// Debounced save — call after every mutation
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 250);
}

function resetToSeed(){
  db = seed.build();
  persistNow();
  return db;
}

// Append an audit entry (kept to the latest 500)
function audit(who, role, act, target, type){
  const d = load();
  d.auditLog.unshift({ id:'au-'+Date.now(), who, role, act, target,
    time:new Date().toISOString(), type: type || 'info' });
  if (d.auditLog.length > 500) d.auditLog.length = 500;
  save();
}

// Recompute headline totals from live campuses
function totals(){
  const d = load();
  const live = d.branches.filter(b => b.status !== 'Coming Soon');
  return {
    schools: d.schools.length,
    branches: live.length,
    students: live.reduce((a,b)=>a+b.students,0),
    parents: Math.round(live.reduce((a,b)=>a+b.students,0)*0.78),
    teachers: live.reduce((a,b)=>a+b.teachers,0),
    mrr: live.reduce((a,b)=>a+b.revenue,0),
  };
}

module.exports = { load, save, persistNow, resetToSeed, audit, totals, DB_PATH };
