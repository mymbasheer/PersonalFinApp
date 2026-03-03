// mobile/src/utils/tax.ts
// ─────────────────────────────────────────────────
// IRD 2025 tax computation utilities.
// Format helpers → src/utils/format.ts
// ─────────────────────────────────────────────────

import { TAX_SLABS_2025 } from './constants';
import type { TaxBreakdown } from '../types';

/**
 * Calculate annual APIT (Advance Personal Income Tax) from annual gross.
 * IRD 2025 progressive slab method.
 */
export function calcAPIT(annualGross: number): number {
  let tax = 0;
  for (const s of TAX_SLABS_2025) {
    if (annualGross <= s.from) break;
    tax += (Math.min(annualGross, s.to) - s.from) * s.rate / 100;
  }
  return Math.round(tax);
}

/**
 * Full tax & deduction breakdown for a monthly gross salary.
 * Returns all figures needed for pay-slip display.
 */
export function taxBreakdown(monthlyGross: number): TaxBreakdown {
  const annual = monthlyGross * 12;
  const annualTax = calcAPIT(annual);
  const epfEmployee = Math.round(monthlyGross * 0.08);  // 8% employee
  const epfEmployer = Math.round(monthlyGross * 0.12);  // 12% employer
  const etfEmployer = Math.round(monthlyGross * 0.03);  // 3% ETF
  const netMonthly = Math.round(monthlyGross - annualTax / 12 - epfEmployee);
  const effectiveRate = annual > 0
    ? +((annualTax / annual) * 100).toFixed(2)
    : 0;
  const slab = [...TAX_SLABS_2025].find(
    s => annual > s.from && annual <= s.to,
  ) ?? TAX_SLABS_2025[0];

  return {
    monthlyGross,
    annualGross: annual,
    annualAPIT: annualTax,
    monthlyAPIT: Math.round(annualTax / 12),
    epfEmployee,
    epfEmployer,
    etfEmployer,
    netMonthly,
    netAnnual: netMonthly * 12,
    effectiveRate,
    taxBracket: slab.rate,
    slabs: TAX_SLABS_2025.map(s => ({ ...s })),
  };
}
