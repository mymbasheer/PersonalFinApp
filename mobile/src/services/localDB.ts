// mobile/src/services/localDB.ts
// ─────────────────────────────────────────────────
// Offline-first SQLite layer (react-native-sqlite-storage).
//
// Schema v2 features:
//  • schema_version table for migrations
//  • pending_sync queue for offline writes
//  • cache table with TTL expiry + indexed expiry column
//  • All tables use proper constraints
// ─────────────────────────────────────────────────

import SQLite from 'react-native-sqlite-storage';
import type { PendingSync } from '../types';

SQLite.enablePromise(true);

const DB_NAME = 'personalfinapp_v2.db';
const DB_VERSION = 2;

let db: SQLite.SQLiteDatabase | null = null;

// ── DDL Migrations ───────────────────────────────

const MIGRATIONS: string[][] = [
  // v1 → initial schema
  [
    `CREATE TABLE IF NOT EXISTS schema_version (
       version INTEGER NOT NULL
     )`,
    `INSERT INTO schema_version VALUES (1)`,

    // Offline write queue
    `CREATE TABLE IF NOT EXISTS pending_sync (
       id          TEXT    PRIMARY KEY,
       entity      TEXT    NOT NULL,
       method      TEXT    NOT NULL CHECK(method IN ('POST','PUT','DELETE')),
       endpoint    TEXT    NOT NULL,
       payload     TEXT    NOT NULL DEFAULT '{}',
       created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
     )`,

    // Read-through cache with expiry
    `CREATE TABLE IF NOT EXISTS cache (
       key        TEXT PRIMARY KEY,
       value      TEXT NOT NULL,
       expires_at TEXT NOT NULL
     )`,
    `CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache (expires_at)`,
  ],

  // v2 → add local draft transactions (typed with full fields)
  [
    `CREATE TABLE IF NOT EXISTS local_transactions (
       id             TEXT    PRIMARY KEY,
       user_id        INTEGER NOT NULL,
       type           TEXT    NOT NULL CHECK(type IN ('expense','income')),
       category       TEXT    NOT NULL,
       description    TEXT    NOT NULL DEFAULT '',
       amount         REAL    NOT NULL CHECK(amount >= 0),
       payment_method TEXT    NOT NULL DEFAULT 'Cash',
       txn_date       TEXT    NOT NULL,
       note           TEXT    NOT NULL DEFAULT '',
       synced         INTEGER NOT NULL DEFAULT 0,
       created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
     )`,
    `CREATE INDEX IF NOT EXISTS idx_ltxn_user   ON local_transactions (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ltxn_synced ON local_transactions (synced)`,
    `CREATE INDEX IF NOT EXISTS idx_ltxn_date   ON local_transactions (txn_date)`,
    `UPDATE schema_version SET version = 2`,
  ],
];

// ── Init ─────────────────────────────────────────

export async function initLocalDB(): Promise<void> {
  db = await SQLite.openDatabase({ name: DB_NAME, location: 'default' });

  // Determine current schema version
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`,
  );
  const [versionResult] = await db.executeSql(
    `SELECT version FROM schema_version LIMIT 1`,
  );
  const currentVersion: number =
    versionResult.rows.length > 0 ? versionResult.rows.item(0).version : 0;

  // Run pending migrations
  for (let v = currentVersion; v < DB_VERSION; v++) {
    const steps = MIGRATIONS[v];
    if (!steps) continue;
    for (const sql of steps) await db.executeSql(sql);
    if (__DEV__) console.log(`[LocalDB] Migrated v${v} → v${v + 1}`);
  }

  // Evict expired cache entries on startup
  await evictExpiredCache();

  if (__DEV__) console.log(`[LocalDB] Ready (schema v${DB_VERSION})`);
}

// ── Offline transaction queue ────────────────────

export async function saveOfflineTxn(txn: {
  userId: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  txnDate: string;
  note?: string;
}): Promise<string> {
  if (!db) throw new Error('LocalDB not initialised');
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.executeSql(
    `INSERT INTO local_transactions
       (id, user_id, type, category, description, amount, payment_method, txn_date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, txn.userId, txn.type, txn.category, txn.description ?? '',
      txn.amount, txn.paymentMethod, txn.txnDate, txn.note ?? ''],
  );
  return id;
}

export async function getUnsyncedTxns(): Promise<SQLite.ResultSet['rows'] extends { item: (i: number) => infer T } ? T[] : never[]> {
  if (!db) return [];
  const [results] = await db.executeSql(
    `SELECT * FROM local_transactions WHERE synced = 0 ORDER BY created_at`,
  );
  const rows: unknown[] = [];
  for (let i = 0; i < results.rows.length; i++) rows.push(results.rows.item(i));
  return rows as never[];
}

export async function markSynced(localId: string): Promise<void> {
  if (!db) return;
  await db.executeSql(
    `UPDATE local_transactions SET synced = 1 WHERE id = ?`,
    [localId],
  );
}

// ── Pending sync queue (for other entities) ──────

export async function enqueuePendingSync(item: Omit<PendingSync, 'id' | 'created_at'>): Promise<void> {
  if (!db) return;
  const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.executeSql(
    `INSERT INTO pending_sync (id, entity, method, endpoint, payload) VALUES (?, ?, ?, ?, ?)`,
    [id, item.entity, item.method, item.endpoint, item.payload],
  );
}

export async function getPendingSync(): Promise<PendingSync[]> {
  if (!db) return [];
  const [r] = await db.executeSql(`SELECT * FROM pending_sync ORDER BY created_at`);
  const rows: PendingSync[] = [];
  for (let i = 0; i < r.rows.length; i++) rows.push(r.rows.item(i) as PendingSync);
  return rows;
}

export async function removePendingSync(id: string): Promise<void> {
  if (!db) return;
  await db.executeSql(`DELETE FROM pending_sync WHERE id = ?`, [id]);
}

// ── Read-through cache ───────────────────────────

/** Store a value in the cache with a TTL in seconds (default 5 min) */
export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!db) return;
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await db.executeSql(
    `INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)`,
    [key, JSON.stringify(value), expires],
  );
}

/** Retrieve a cached value; returns null if missing or expired */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!db) return null;
  const [r] = await db.executeSql(
    `SELECT value, expires_at FROM cache WHERE key = ?`,
    [key],
  );
  if (r.rows.length === 0) return null;
  const row = r.rows.item(0);
  if (new Date(row.expires_at) < new Date()) {
    await db.executeSql(`DELETE FROM cache WHERE key = ?`, [key]);
    return null;
  }
  try { return JSON.parse(row.value) as T; } catch { return null; }
}

export async function cacheDelete(key: string): Promise<void> {
  if (!db) return;
  await db.executeSql(`DELETE FROM cache WHERE key = ?`, [key]);
}

/** Remove all expired entries — called at startup */
async function evictExpiredCache(): Promise<void> {
  if (!db) return;
  await db.executeSql(
    `DELETE FROM cache WHERE expires_at < datetime('now')`,
  );
}
