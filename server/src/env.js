/* Tiny .env loader — no dependency needed. Reads server/.env if present. */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

module.exports = {
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'thandi@mobsie.co.za',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  PARENT_PASSWORD: process.env.PARENT_PASSWORD || 'parent123',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
