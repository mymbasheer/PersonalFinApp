// backend/src/utils/db.js
'use strict';
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../db/personalfinapp.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db;
function getDB() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('synchronous = NORMAL');
  }
  return _db;
}
module.exports = { getDB };
