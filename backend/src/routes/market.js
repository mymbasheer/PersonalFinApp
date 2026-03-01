// backend/src/routes/market.js
'use strict';
const router = require('express').Router();
const axios  = require('axios');
const BASE   = 'https://api.frankfurter.app';

// 1-hour cache
let FX_CACHE = null, GOLD_CACHE = null, FX_TS = 0, GOLD_TS = 0;
const TTL = 3_600_000;

router.get('/fx', async (req, res) => {
  try {
    if (FX_CACHE && Date.now() - FX_TS < TTL) return res.json({ ...FX_CACHE, cached: true });
    const { data } = await axios.get(`${BASE}/latest?from=USD&to=LKR,GBP,EUR,AED,SGD,AUD,CAD,JPY,INR,MYR,QAR,SAR`, { timeout: 8000 });
    const lkr = data.rates.LKR || 302;
    FX_CACHE = {
      base: 'LKR', date: data.date, source: 'Frankfurter (ECB)', live: true,
      rates: { LKR:1, USD:+(1/lkr).toFixed(6), GBP:+((data.rates.GBP||.79)/lkr).toFixed(6), EUR:+((data.rates.EUR||.92)/lkr).toFixed(6),
        AED:+((data.rates.AED||3.67)/lkr).toFixed(6), SGD:+((data.rates.SGD||1.35)/lkr).toFixed(6), AUD:+((data.rates.AUD||1.55)/lkr).toFixed(6),
        CAD:+((data.rates.CAD||1.36)/lkr).toFixed(6), JPY:+((data.rates.JPY||149)/lkr).toFixed(6), INR:+((data.rates.INR||83)/lkr).toFixed(6),
        MYR:+((data.rates.MYR||4.7)/lkr).toFixed(6), QAR:+((data.rates.QAR||3.64)/lkr).toFixed(6), SAR:+((data.rates.SAR||3.75)/lkr).toFixed(6) },
      usdToLkr: lkr
    };
    FX_TS = Date.now();
    res.json(FX_CACHE);
  } catch (e) {
    res.json({ rates:{LKR:1,USD:.00331,GBP:.00261,EUR:.00305,AED:.01215,SGD:.00445,AUD:.00514,CAD:.00453,JPY:.499,INR:.276,MYR:.01542,QAR:.01205,SAR:.01241}, usdToLkr:302, live:false, error:e.message });
  }
});

router.get('/gold', async (req, res) => {
  try {
    if (GOLD_CACHE && Date.now() - GOLD_TS < TTL) return res.json({ ...GOLD_CACHE, cached: true });
    const [xau, fx] = await Promise.all([
      axios.get(`${BASE}/latest?from=XAU&to=USD`, { timeout: 8000 }),
      axios.get(`${BASE}/latest?from=USD&to=LKR`, { timeout: 8000 }),
    ]);
    const ozUSD = xau.data.rates.USD || 2050;
    const lkr   = fx.data.rates.LKR  || 302;
    const g24   = Math.round((ozUSD / 31.1035) * lkr);
    GOLD_CACHE = {
      lkrPerGram: { '24K':g24, '22K':Math.round(g24*.9167), '21K':Math.round(g24*.875), '18K':Math.round(g24*.75), '14K':Math.round(g24*.585), '9K':Math.round(g24*.375) },
      sovereign8g: Math.round(g24*.9167*8),
      usdPerOz: ozUSD, usdToLkr: lkr,
      date: new Date().toISOString().slice(0,10), source: 'Frankfurter XAU/USD', live: true,
    };
    GOLD_TS = Date.now();
    res.json(GOLD_CACHE);
  } catch (e) {
    res.json({ lkrPerGram:{'24K':26800,'22K':24567,'21K':23450,'18K':20100,'14K':15678,'9K':10050}, sovereign8g:196536, live:false, error:e.message });
  }
});

module.exports = router;
