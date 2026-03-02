// backend/src/routes/auth.js
'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../utils/db');
const auth = require('../middleware/auth');

const sign = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register',
  [body('firstName').trim().notEmpty(), body('phone').trim().notEmpty(),
  body('password').isLength({ min: 8 })],
  async (req, res, next) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) return res.status(422).json({ errors: errs.array() });
      const db = getDB();
      const { firstName, lastName, nic, dob, gender, district, occupation,
        employer, phone, email, monthlyGross, incomeType, otherIncome,
        password, expenses } = req.body;
      if (db.prepare('SELECT id FROM users WHERE phone=?').get(phone))
        return res.status(409).json({ error: 'Phone already registered' });
      const pwdHash = await bcrypt.hash(password, 12);
      const r = db.prepare(`INSERT INTO users
        (first_name,last_name,nic,dob,gender,district,occupation,employer,phone,email,
         monthly_gross,income_type,other_income,pwd_hash)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        firstName, lastName || '', nic || null, dob || null, gender || null,
        district || 'Colombo', occupation || null, employer || null,
        phone, email || null, Number(monthlyGross) || 0,
        incomeType || 'Monthly Salary', Number(otherIncome) || 0, pwdHash);
      const uid = r.lastInsertRowid;
      db.prepare(`INSERT INTO income_sources(user_id,inc_type,description,amount,frequency,taxable)
                  VALUES(?,?,?,?,?,?)`).run(uid, incomeType || 'Monthly Salary', 'Primary Income', Number(monthlyGross) || 0, 'Monthly', 1);
      if (expenses && typeof expenses === 'object') {
        const s = db.prepare('INSERT OR REPLACE INTO expense_budgets(user_id,category,monthly_budget) VALUES(?,?,?)');
        for (const [c, v] of Object.entries(expenses)) if (Number(v) > 0) s.run(uid, c, Number(v));
      }
      // Default data
      db.prepare(`INSERT INTO reminders(user_id,title,reminder_type,due_date,recurring,icon,color) VALUES(?,?,?,?,?,?,?)`).run(uid, 'IRD Tax Return', 'tax', '2026-11-30', 'Annual', '📋', '#D4A843');
      const gS = db.prepare('INSERT INTO goals(user_id,name,icon,target,color,deadline) VALUES(?,?,?,?,?,?)');
      gS.run(uid, 'Emergency Fund', '🛡', 500000, '#27AE60', '2026-12-31');
      gS.run(uid, 'House Down Payment', '🏡', 2500000, '#3A8DDE', '2027-06-30');
      const user = db.prepare('SELECT * FROM users WHERE id=?').get(uid);
      delete user.pwd_hash;
      res.status(201).json({ token: sign(uid), user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });
    const user = getDB().prepare('SELECT * FROM users WHERE phone=?').get(phone);
    if (!user || !(await bcrypt.compare(password, user.pwd_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });
    delete user.pwd_hash;
    res.json({ token: sign(user.id), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/biometric-login  (device verified identity; server issues token)
router.post('/biometric-login', (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const user = getDB().prepare('SELECT * FROM users WHERE phone=?').get(phone);
    if (!user || !user.bio_cred) return res.status(404).json({ error: 'No biometric registered' });
    delete user.pwd_hash;
    res.json({ token: sign(user.id), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/biometric-register
router.post('/biometric-register', auth, (req, res, next) => {
  try {
    const { credentialId } = req.body;
    if (!credentialId) return res.status(422).json({ error: 'credentialId required' });
    getDB().prepare('UPDATE users SET bio_cred=? WHERE id=?').run(credentialId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res, next) => {
  try {
    const u = { ...req.user }; delete u.pwd_hash; res.json({ user: u });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
