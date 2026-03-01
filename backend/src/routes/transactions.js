// backend/src/routes/transactions.js
'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');

router.get('/', auth, (req, res) => {
  const { month, type, limit = 100, offset = 0 } = req.query;
  let sql = 'SELECT * FROM transactions WHERE user_id=?', p = [req.user.id];
  if (month) { sql += ' AND txn_date LIKE ?'; p.push(month + '%'); }
  if (type)  { sql += ' AND type=?'; p.push(type); }
  sql += ' ORDER BY txn_date DESC, id DESC LIMIT ? OFFSET ?';
  p.push(Number(limit), Number(offset));
  res.json({ transactions: getDB().prepare(sql).all(...p) });
});

router.get('/summary', auth, (req, res) => {
  const db = getDB(); const { month } = req.query;
  const p = [req.user.id, ...(month ? [month + '%'] : [])];
  const mw = month ? ' AND txn_date LIKE ?' : '';
  const totalExpense = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE user_id=? AND type='expense'${mw}`).get(...p).s;
  const totalIncome  = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE user_id=? AND type='income'${mw}`).get(...p).s;
  const byCat = db.prepare(`SELECT category, SUM(amount) total FROM transactions WHERE user_id=? AND type='expense'${mw} GROUP BY category`).all(...p);
  res.json({ totalExpense, totalIncome, byCat });
});

router.post('/', auth, (req, res) => {
  const { type, category, description, amount, paymentMethod, txnDate, note, isRecurring } = req.body;
  if (!amount || !txnDate) return res.status(422).json({ error: 'amount and txnDate required' });
  const db = getDB();
  const r = db.prepare(`INSERT INTO transactions(user_id,type,category,description,amount,payment_method,txn_date,note,is_recurring)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(req.user.id, type||'expense', category||'other', description||'',
    Number(amount), paymentMethod||'Cash', txnDate, note||'', isRecurring?1:0);
  res.status(201).json({ transaction: db.prepare('SELECT * FROM transactions WHERE id=?').get(r.lastInsertRowid) });
});

router.put('/:id', auth, (req, res) => {
  const db = getDB();
  const t  = db.prepare('SELECT * FROM transactions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const { type, category, description, amount, paymentMethod, txnDate, note } = req.body;
  db.prepare(`UPDATE transactions SET type=?,category=?,description=?,amount=?,payment_method=?,txn_date=?,note=? WHERE id=?`)
    .run(type||t.type, category||t.category, description??t.description, amount!=null?Number(amount):t.amount,
         paymentMethod||t.payment_method, txnDate||t.txn_date, note??t.note, t.id);
  res.json({ transaction: db.prepare('SELECT * FROM transactions WHERE id=?').get(t.id) });
});

router.delete('/:id', auth, (req, res) => {
  const t = getDB().prepare('SELECT id FROM transactions WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  getDB().prepare('DELETE FROM transactions WHERE id=?').run(t.id);
  res.json({ success: true });
});

module.exports = router;
