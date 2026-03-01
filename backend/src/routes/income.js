// backend/src/routes/income.js
'use strict';
const r = require('express').Router(), auth = require('../middleware/auth'), {getDB} = require('../utils/db');
r.get('/', auth, (req,res) => res.json({sources: getDB().prepare('SELECT * FROM income_sources WHERE user_id=? ORDER BY id DESC').all(req.user.id)}));
r.post('/', auth, (req,res) => { const {incType,description,amount,frequency,taxable}=req.body; const db=getDB(); const ins=db.prepare('INSERT INTO income_sources(user_id,inc_type,description,amount,frequency,taxable) VALUES(?,?,?,?,?,?)').run(req.user.id,incType,description||'',Number(amount)||0,frequency||'Monthly',taxable?1:0); res.status(201).json({source:db.prepare('SELECT * FROM income_sources WHERE id=?').get(ins.lastInsertRowid)}); });
r.delete('/:id', auth, (req,res) => { const t=getDB().prepare('SELECT id FROM income_sources WHERE id=? AND user_id=?').get(req.params.id,req.user.id); if(!t) return res.status(404).json({error:'Not found'}); getDB().prepare('DELETE FROM income_sources WHERE id=?').run(t.id); res.json({success:true}); });
module.exports = r;
