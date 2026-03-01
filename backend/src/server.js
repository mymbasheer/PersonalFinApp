// backend/src/server.js
'use strict';
require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 300 }));
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 15,
  message: { error: 'Too many auth attempts. Try in 15 minutes.' } }));

// ── Health
app.get('/health', (_, res) => res.json({
  status: 'ok', version: '4.0.0', time: new Date().toISOString()
}));

// ── Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/income',       require('./routes/income'));
app.use('/api/goals',        require('./routes/goals'));
app.use('/api/debts',        require('./routes/debts'));
app.use('/api/assets',       require('./routes/assets'));
app.use('/api/insurance',    require('./routes/insurance'));
app.use('/api/reminders',    require('./routes/reminders'));
app.use('/api/market',       require('./routes/market'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/advisor',      require('./routes/advisor'));

// ── 404
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

// ── Error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🇱🇰  PersonalFinApp Backend v4.0.0`);
  console.log(`    http://0.0.0.0:${PORT}  [${process.env.NODE_ENV || 'development'}]\n`);
});

module.exports = app;
