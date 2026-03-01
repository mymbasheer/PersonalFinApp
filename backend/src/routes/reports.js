// backend/src/routes/reports.js
'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');
const { taxBreakdown } = require('../utils/tax');

// GET /api/reports/tax
router.get('/tax', auth, (req, res) => {
  const user = req.user;
  const bd   = taxBreakdown(user.monthly_gross || 0);
  res.json({
    user: { firstName: user.first_name, lastName: user.last_name, nic: user.nic, district: user.district },
    taxYear: '2025/2026', ...bd,
    filingDeadline: '2026-11-30',
    penalties: 'LKR 50,000 or 10% of tax payable (whichever higher)',
  });
});

// GET /api/reports/networth
router.get('/networth', auth, (req, res) => {
  const db     = getDB();
  const assets = db.prepare('SELECT * FROM assets WHERE user_id=?').all(req.user.id);
  const liabs  = db.prepare('SELECT * FROM liabilities WHERE user_id=?').all(req.user.id);
  const history= db.prepare('SELECT * FROM networth_snapshots WHERE user_id=? ORDER BY snapshot_date DESC LIMIT 12').all(req.user.id);
  const totalA = assets.reduce((a,x) => a + x.value, 0);
  const totalL = liabs.reduce((a,x) => a + x.value, 0);
  res.json({ assets, liabilities: liabs, totalAssets: totalA, totalLiabilities: totalL, netWorth: totalA - totalL, history });
});

// GET /api/reports/monthly?month=2026-03
router.get('/monthly', auth, (req, res) => {
  const db     = getDB();
  const month  = req.query.month || new Date().toISOString().slice(0,7);
  const txns   = db.prepare("SELECT * FROM transactions WHERE user_id=? AND txn_date LIKE ? ORDER BY txn_date").all(req.user.id, month + '%');
  const budgets= db.prepare('SELECT category, monthly_budget FROM expense_budgets WHERE user_id=?').all(req.user.id);
  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.monthly_budget]));
  const expenses  = txns.filter(t => t.type === 'expense');
  const income    = txns.filter(t => t.type === 'income');
  const byCat = expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
  res.json({ month, transactions: txns, totalExpense: expenses.reduce((a,t)=>a+t.amount,0), totalIncome: income.reduce((a,t)=>a+t.amount,0), byCat, budgets: budgetMap, tax: taxBreakdown(req.user.monthly_gross || 0) });
});

module.exports = router;
