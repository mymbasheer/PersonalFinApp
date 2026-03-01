// backend/db/migrate.js
'use strict';
require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || './db/personalfinapp.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const tables = [
`CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  nic           TEXT,
  dob           TEXT,
  gender        TEXT,
  district      TEXT DEFAULT 'Colombo',
  occupation    TEXT,
  employer      TEXT,
  phone         TEXT NOT NULL UNIQUE,
  email         TEXT,
  language      TEXT DEFAULT 'English',
  pwd_hash      TEXT NOT NULL,
  monthly_gross REAL DEFAULT 0,
  income_type   TEXT DEFAULT 'Monthly Salary',
  other_income  REAL DEFAULT 0,
  bio_cred      TEXT,
  push_token    TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS income_sources (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inc_type    TEXT NOT NULL,
  description TEXT,
  amount      REAL NOT NULL DEFAULT 0,
  frequency   TEXT DEFAULT 'Monthly',
  taxable     INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS expense_budgets (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category       TEXT NOT NULL,
  monthly_budget REAL DEFAULT 0,
  UNIQUE(user_id, category)
)`,

`CREATE TABLE IF NOT EXISTS transactions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'expense',
  category       TEXT DEFAULT 'other',
  description    TEXT,
  amount         REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  txn_date       TEXT NOT NULL,
  note           TEXT,
  receipt_uri    TEXT,
  is_recurring   INTEGER DEFAULT 0,
  created_at     TEXT DEFAULT (datetime('now'))
)`,

`CREATE INDEX IF NOT EXISTS idx_txn_user_date
   ON transactions(user_id, txn_date DESC)`,

`CREATE TABLE IF NOT EXISTS goals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT '🎯',
  target     REAL NOT NULL DEFAULT 0,
  saved      REAL DEFAULT 0,
  color      TEXT DEFAULT '#3A8DDE',
  deadline   TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS debts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  lender           TEXT,
  debt_type        TEXT DEFAULT 'Personal Loan',
  balance          REAL NOT NULL DEFAULT 0,
  emi              REAL DEFAULT 0,
  interest_rate    REAL DEFAULT 0,
  months_remaining INTEGER DEFAULT 0,
  total_months     INTEGER DEFAULT 0,
  color            TEXT DEFAULT '#E05252',
  created_at       TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS assets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  category   TEXT DEFAULT 'Other',
  value      REAL NOT NULL DEFAULT 0,
  color      TEXT DEFAULT '#27AE60',
  created_at TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS liabilities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  category   TEXT DEFAULT 'Other',
  value      REAL NOT NULL DEFAULT 0,
  color      TEXT DEFAULT '#E05252',
  created_at TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS insurance_policies (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ins_type     TEXT NOT NULL,
  provider     TEXT,
  policy_name  TEXT,
  premium      REAL DEFAULT 0,
  frequency    TEXT DEFAULT 'Monthly',
  coverage     REAL DEFAULT 0,
  renewal_date TEXT,
  status       TEXT DEFAULT 'Active',
  color        TEXT DEFAULT '#3A8DDE',
  created_at   TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS reminders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  reminder_type TEXT DEFAULT 'bill',
  due_date      TEXT NOT NULL,
  amount        REAL DEFAULT 0,
  recurring     TEXT DEFAULT 'Monthly',
  icon          TEXT DEFAULT '🔔',
  color         TEXT DEFAULT '#D4A843',
  enabled       INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now'))
)`,

`CREATE TABLE IF NOT EXISTS networth_snapshots (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date     TEXT NOT NULL,
  total_assets      REAL DEFAULT 0,
  total_liabilities REAL DEFAULT 0,
  net_worth         REAL DEFAULT 0
)`,
];

console.log('\n🇱🇰  PersonalFinApp v4 — Running database migrations...\n');
db.transaction(() => {
  for (const sql of tables) {
    const name = sql.match(/TABLE IF NOT EXISTS (\w+)/)?.[1]
               || sql.match(/INDEX IF NOT EXISTS (\w+)/)?.[1]
               || 'statement';
    try { db.prepare(sql).run(); console.log(`  ✓  ${name}`); }
    catch (e) { console.error(`  ✗  ${name}: ${e.message}`); }
  }
})();

console.log(`\n✅  Migration complete → ${path.resolve(DB_PATH)}\n`);
db.close();
