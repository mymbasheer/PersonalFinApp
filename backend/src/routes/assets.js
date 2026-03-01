// backend/src/routes/assets.js
'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');

const crudFor = (table, label) => {
  router.get('/', auth, (req, res) => {
    res.json({ [label]: getDB().prepare(`SELECT * FROM ${table} WHERE user_id=? ORDER BY id`).all(req.user.id) });
  });
  router.post('/', auth, (req, res) => {
    const { name, category, value, color } = req.body;
    if (!name || value == null) return res.status(422).json({ error: 'name and value required' });
    const db = getDB();
    const r  = db.prepare(`INSERT INTO ${table}(user_id,name,category,value,color) VALUES(?,?,?,?,?)`).run(req.user.id, name, category||'Other', Number(value), color||'#27AE60');
    res.status(201).json({ item: db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(r.lastInsertRowid) });
  });
  router.put('/:id', auth, (req, res) => {
    const db = getDB();
    const row = db.prepare(`SELECT * FROM ${table} WHERE id=? AND user_id=?`).get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const { name, category, value, color } = req.body;
    db.prepare(`UPDATE ${table} SET name=?,category=?,value=?,color=? WHERE id=?`).run(name||row.name, category||row.category, value!=null?Number(value):row.value, color||row.color, row.id);
    res.json({ item: db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(row.id) });
  });
  router.delete('/:id', auth, (req, res) => {
    const row = getDB().prepare(`SELECT id FROM ${table} WHERE id=? AND user_id=?`).get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    getDB().prepare(`DELETE FROM ${table} WHERE id=?`).run(row.id);
    res.json({ success: true });
  });
};

// Net worth = assets – liabilities
router.get('/networth', auth, (req, res) => {
  const db = getDB();
  const assets = db.prepare('SELECT * FROM assets WHERE user_id=?').all(req.user.id);
  const liabs  = db.prepare('SELECT * FROM liabilities WHERE user_id=?').all(req.user.id);
  const totalAssets = assets.reduce((a, x) => a + x.value, 0);
  const totalLiabs  = liabs.reduce((a, x) => a + x.value, 0);
  const netWorth    = totalAssets - totalLiabs;
  // Save snapshot
  db.prepare(`INSERT INTO networth_snapshots(user_id,snapshot_date,total_assets,total_liabilities,net_worth) VALUES(?,date('now'),?,?,?)`).run(req.user.id, totalAssets, totalLiabs, netWorth);
  res.json({ assets, liabilities: liabs, totalAssets, totalLiabilities: totalLiabs, netWorth });
});

crudFor('assets', 'assets');
module.exports = router;
