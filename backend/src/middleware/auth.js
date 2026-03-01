// backend/src/middleware/auth.js
'use strict';
const jwt    = require('jsonwebtoken');
const { getDB } = require('../utils/db');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authorization header missing' });

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = getDB().prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
