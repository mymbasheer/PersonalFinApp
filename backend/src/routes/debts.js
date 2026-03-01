// backend/src/routes/debts.js
'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');

router.get('/', auth, (req, res) => {
  res.json({ debts: getDB().prepare('SELECT * FROM debts WHERE user_id=? ORDER BY id').all(req.user.id) });
});

router.post('/', auth, (req, res) => {
  const { name, lender, debtType, balance, emi, interestRate, monthsRemaining, totalMonths, color } = req.body;
  if (!name || !balance) return res.status(422).json({ error: 'name and balance required' });
  const db = getDB();
  const r = db.prepare(`INSERT INTO debts(user_id,name,lender,debt_type,balance,emi,interest_rate,months_remaining,total_months,color) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, name, lender||'', debtType||'Personal Loan', Number(balance), Number(emi)||0, Number(interestRate)||0, Number(monthsRemaining)||0, Number(totalMonths)||0, color||'#E05252');
  res.status(201).json({ debt: db.prepare('SELECT * FROM debts WHERE id=?').get(r.lastInsertRowid) });
});

// GET /api/debts/:id/schedule — amortization schedule
router.get('/:id/schedule', auth, (req, res) => {
  const debt = getDB().prepare('SELECT * FROM debts WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!debt) return res.status(404).json({ error: 'Not found' });
  const schedule = [];
  let balance = debt.balance;
  const mr = debt.interest_rate / 100 / 12;
  for (let m = 1; m <= Math.min(debt.months_remaining, 360); m++) {
    const interest  = Math.round(balance * mr);
    const principal = Math.min(Math.round(debt.emi - interest), Math.round(balance));
    const closing   = Math.max(0, Math.round(balance - principal));
    schedule.push({ month: m, opening: Math.round(balance), emi: Math.round(debt.emi), interest, principal, closing });
    balance = closing;
    if (balance <= 0) break;
  }
  res.json({ debt, schedule });
});

router.delete('/:id', auth, (req, res) => {
  const d = getDB().prepare('SELECT id FROM debts WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  getDB().prepare('DELETE FROM debts WHERE id=?').run(d.id);
  res.json({ success: true });
});

module.exports = router;
