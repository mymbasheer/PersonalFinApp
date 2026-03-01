// backend/src/utils/tax.js  — IRD 2025 APIT Engine
'use strict';

const SLABS_2025 = [
  { from: 0,        to: 1_800_000,  rate: 0  },
  { from: 1_800_000,to: 2_800_000,  rate: 6  },
  { from: 2_800_000,to: 3_800_000,  rate: 12 },
  { from: 3_800_000,to: 5_800_000,  rate: 18 },
  { from: 5_800_000,to: 7_800_000,  rate: 24 },
  { from: 7_800_000,to: Infinity,   rate: 30 },
];

/** Annual APIT tax for given annual gross income (LKR) */
function calcAPIT(annualGross) {
  let tax = 0;
  for (const slab of SLABS_2025) {
    if (annualGross <= slab.from) break;
    const taxable = Math.min(annualGross, slab.to) - slab.from;
    tax += taxable * slab.rate / 100;
  }
  return Math.round(tax);
}

/** Full breakdown for a given monthly gross */
function taxBreakdown(monthlyGross) {
  const annual     = monthlyGross * 12;
  const annualTax  = calcAPIT(annual);
  const monthlyTax = annualTax / 12;
  const epfEmployee = monthlyGross * 0.08;
  const epfEmployer = monthlyGross * 0.12;
  const etfEmployer = monthlyGross * 0.03;
  const netMonthly  = monthlyGross - monthlyTax - epfEmployee;
  const effectiveRate = annual > 0 ? (annualTax / annual * 100) : 0;
  const currentSlab = SLABS_2025.find(s => annual > s.from && annual <= s.to) || SLABS_2025[0];

  return {
    monthlyGross,
    annualGross:  annual,
    annualAPIT:   annualTax,
    monthlyAPIT:  Math.round(monthlyTax),
    epfEmployee:  Math.round(epfEmployee),
    epfEmployer:  Math.round(epfEmployer),
    etfEmployer:  Math.round(etfEmployer),
    netMonthly:   Math.round(netMonthly),
    netAnnual:    Math.round(netMonthly * 12),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    taxBracket:   currentSlab.rate,
    slabs:        SLABS_2025,
  };
}

module.exports = { calcAPIT, taxBreakdown, SLABS_2025 };
