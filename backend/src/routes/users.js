// backend/src/routes/users.js
'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');
const { taxBreakdown } = require('../utils/tax');

// GET /api/users/profile
router.get('/profile', auth, (req, res) => {
  const u = { ...req.user }; delete u.pwd_hash;
  res.json({ user: u, tax: taxBreakdown(u.monthly_gross || 0) });
});

// PUT /api/users/profile
router.put('/profile', auth, (req, res) => {
  const db = getDB();
  const { firstName, lastName, nic, dob, gender, district, occupation,
          employer, email, monthlyGross, incomeType, otherIncome } = req.body;
  db.prepare(`UPDATE users SET first_name=COALESCE(?,first_name), last_name=COALESCE(?,last_name),
    nic=COALESCE(?,nic), dob=COALESCE(?,dob), gender=COALESCE(?,gender),
    district=COALESCE(?,district), occupation=COALESCE(?,occupation),
    employer=COALESCE(?,employer), email=COALESCE(?,email),
    monthly_gross=COALESCE(?,monthly_gross), income_type=COALESCE(?,income_type),
    other_income=COALESCE(?,other_income), updated_at=datetime('now') WHERE id=?`).run(
    firstName||null, lastName||null, nic||null, dob||null, gender||null,
    district||null, occupation||null, employer||null, email||null,
    monthlyGross!=null?Number(monthlyGross):null, incomeType||null,
    otherIncome!=null?Number(otherIncome):null, req.user.id);
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  delete u.pwd_hash;
  res.json({ user: u });
});

// PUT /api/users/push-token
router.put('/push-token', auth, (req, res) => {
  const { token } = req.body;
  getDB().prepare('UPDATE users SET push_token=? WHERE id=?').run(token, req.user.id);
  res.json({ success: true });
});

// GET /api/users/budgets
router.get('/budgets', auth, (req, res) => {
  const rows = getDB().prepare('SELECT category, monthly_budget FROM expense_budgets WHERE user_id=?').all(req.user.id);
  const budgets = Object.fromEntries(rows.map(r => [r.category, r.monthly_budget]));
  res.json({ budgets });
});

// PUT /api/users/budgets
router.put('/budgets', auth, (req, res) => {
  const { budgets } = req.body;
  const db = getDB();
  const s = db.prepare('INSERT OR REPLACE INTO expense_budgets(user_id,category,monthly_budget) VALUES(?,?,?)');
  db.transaction(() => {
    for (const [cat, val] of Object.entries(budgets || {}))
      s.run(req.user.id, cat, Number(val) || 0);
  })();
  res.json({ success: true });
});

module.exports = router;
