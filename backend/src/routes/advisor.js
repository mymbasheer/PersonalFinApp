// backend/src/routes/advisor.js
'use strict';
const router = require('express').Router();
const axios  = require('axios');
const auth   = require('../middleware/auth');
const { getDB } = require('../utils/db');
const { taxBreakdown } = require('../utils/tax');

router.post('/chat', auth, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(422).json({ error: 'messages array required' });

  const user = req.user;
  const bd   = taxBreakdown(user.monthly_gross || 0);
  const db   = getDB();
  const txnSummary = db.prepare(`SELECT category, SUM(amount) total FROM transactions WHERE user_id=? AND type='expense' AND txn_date>=date('now','start of month') GROUP BY category`).all(user.id);

  const systemPrompt = `You are a professional Sri Lankan personal finance advisor integrated into PersonalFinApp.

USER PROFILE:
- Name: ${user.first_name} ${user.last_name}
- District: ${user.district || 'Unknown'}
- Occupation: ${user.occupation || 'Unknown'}
- Monthly Gross: LKR ${user.monthly_gross?.toLocaleString() || 0}
- Monthly APIT Tax: LKR ${bd.monthlyAPIT?.toLocaleString() || 0}
- Monthly EPF (8%): LKR ${bd.epfEmployee?.toLocaleString() || 0}
- Net Monthly Take-Home: LKR ${bd.netMonthly?.toLocaleString() || 0}
- Tax Bracket: ${bd.taxBracket || 0}%

THIS MONTH'S SPENDING:
${txnSummary.map(t => `- ${t.category}: LKR ${t.total?.toLocaleString()}`).join('\n') || 'No transactions yet'}

KNOWLEDGE BASE:
- IRD 2025: Tax-free threshold LKR 1.8M/year; slabs 0%/6%/12%/18%/24%/30%; filing deadline Nov 30
- WHT on bank interest: 10% from April 2025
- Capital Gains Tax: 15% from April 2025
- EPF: 8% employee + 12% employer; ETF: 3% employer
- Life insurance relief: up to LKR 100,000/year deductible
- CEB electricity tariffs 2024/25 domestic slabs apply
- LankaPay, HNB, Sampath, BOC, Commercial, NSB, People's, Seylan banks
- Sri Lanka NSB, HNB FD rates typically 9-11% p.a.
- Gold: hallmarked per SLSI SLS 196; import duty 15% + VAT 18%; pawn rate ~75%

Always:
- Give specific LKR amounts and percentages
- Reference IRD regulations where relevant
- Be concise and actionable
- Respond in English (or Sinhala if user writes in Sinhala)`;

  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('YOUR_KEY')) {
      // Fallback mock response if no API key
      return res.json({
        reply: `Hi ${user.first_name}! I'm your AI financial advisor. To enable full AI responses, add your Anthropic API key to the backend .env file (ANTHROPIC_API_KEY). \n\nBased on your profile: Your monthly net take-home is LKR ${bd.netMonthly?.toLocaleString()} after LKR ${bd.monthlyAPIT?.toLocaleString()} APIT tax and LKR ${bd.epfEmployee?.toLocaleString()} EPF contribution. Your effective tax rate is ${bd.effectiveRate}%.`
      });
    }

    const resp = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30000,
    });

    res.json({ reply: resp.data.content[0].text });
  } catch (e) {
    console.error('[Advisor]', e.response?.data || e.message);
    res.status(500).json({ error: 'AI advisor temporarily unavailable', details: e.message });
  }
});

module.exports = router;
