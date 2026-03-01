// mobile/src/services/localDB.ts
// Offline-first local SQLite on the device (react-native-sqlite-storage)
// Syncs with backend when online. Works offline too.
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export async function initLocalDB() {
  db = await SQLite.openDatabase({ name: 'personalfinapp.db', location: 'default' });
  await db.executeSql(`CREATE TABLE IF NOT EXISTS local_transactions (
    id TEXT PRIMARY KEY, user_id INTEGER, type TEXT, category TEXT,
    description TEXT, amount REAL, payment_method TEXT, txn_date TEXT,
    note TEXT, synced INTEGER DEFAULT 0, created_at TEXT
  )`);
  await db.executeSql(`CREATE TABLE IF NOT EXISTS local_cache (
    key TEXT PRIMARY KEY, value TEXT, updated_at TEXT
  )`);
  console.log('[LocalDB] Initialized');
}

export async function saveOfflineTxn(txn: any) {
  if (!db) return;
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.executeSql(
    `INSERT INTO local_transactions (id,user_id,type,category,description,amount,payment_method,txn_date,note,synced,created_at) VALUES (?,?,?,?,?,?,?,?,?,0,datetime('now'))`,
    [id, txn.userId, txn.type, txn.category, txn.description, txn.amount, txn.paymentMethod, txn.txnDate, txn.note || '']
  );
  return id;
}

export async function getUnsyncedTxns(): Promise<any[]> {
  if (!db) return [];
  const [results] = await db.executeSql('SELECT * FROM local_transactions WHERE synced=0');
  const rows: any[] = [];
  for (let i = 0; i < results.rows.length; i++) rows.push(results.rows.item(i));
  return rows;
}

export async function markSynced(localId: string) {
  if (!db) return;
  await db.executeSql('UPDATE local_transactions SET synced=1 WHERE id=?', [localId]);
}

export async function cacheSet(key: string, value: any) {
  if (!db) return;
  await db.executeSql(`INSERT OR REPLACE INTO local_cache(key,value,updated_at) VALUES(?,?,datetime('now'))`, [key, JSON.stringify(value)]);
}

export async function cacheGet(key: string): Promise<any | null> {
  if (!db) return null;
  const [r] = await db.executeSql('SELECT value FROM local_cache WHERE key=?', [key]);
  if (r.rows.length === 0) return null;
  try { return JSON.parse(r.rows.item(0).value); } catch { return null; }
}
