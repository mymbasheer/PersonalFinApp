// backend/src/routes/goals.js
'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');

router.get('/', auth, (req, res) => {
  res.json({ goals: getDB().prepare('SELECT * FROM goals WHERE user_id=? ORDER BY id').all(req.user.id) });
});

router.post('/', auth, (req, res) => {
  const { name, icon, target, color, deadline } = req.body;
  if (!name || !target) return res.status(422).json({ error: 'name and target required' });
  const db = getDB();
  const r  = db.prepare('INSERT INTO goals(user_id,name,icon,target,saved,color,deadline) VALUES(?,?,?,?,0,?,?)').run(req.user.id, name, icon||'🎯', Number(target), color||'#3A8DDE', deadline||null);
  res.status(201).json({ goal: db.prepare('SELECT * FROM goals WHERE id=?').get(r.lastInsertRowid) });
});

router.put('/:id/deposit', auth, (req, res) => {
  const db   = getDB();
  const goal = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  const newSaved = Math.min(goal.saved + (Number(req.body.amount) || 0), goal.target);
  db.prepare('UPDATE goals SET saved=? WHERE id=?').run(newSaved, goal.id);
  res.json({ goal: db.prepare('SELECT * FROM goals WHERE id=?').get(goal.id) });
});

router.delete('/:id', auth, (req, res) => {
  const g = getDB().prepare('SELECT id FROM goals WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!g) return res.status(404).json({ error: 'Not found' });
  getDB().prepare('DELETE FROM goals WHERE id=?').run(g.id);
  res.json({ success: true });
});

module.exports = router;
