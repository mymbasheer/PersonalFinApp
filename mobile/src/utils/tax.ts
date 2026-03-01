// mobile/src/utils/tax.ts
import { TAX_SLABS_2025 } from './constants';

export function calcAPIT(annualGross: number): number {
  let tax = 0;
  for (const s of TAX_SLABS_2025) {
    if (annualGross <= s.from) break;
    tax += (Math.min(annualGross, s.to) - s.from) * s.rate / 100;
  }
  return Math.round(tax);
}

export function taxBreakdown(monthlyGross: number) {
  const annual        = monthlyGross * 12;
  const annualTax     = calcAPIT(annual);
  const epfEmployee   = Math.round(monthlyGross * 0.08);
  const netMonthly    = Math.round(monthlyGross - annualTax / 12 - epfEmployee);
  const effectiveRate = annual > 0 ? +(annualTax / annual * 100).toFixed(2) : 0;
  const slab = TAX_SLABS_2025.find(s => annual > s.from && annual <= s.to) || TAX_SLABS_2025[0];
  return {
    monthlyGross, annualGross: annual,
    annualAPIT: annualTax, monthlyAPIT: Math.round(annualTax / 12),
    epfEmployee, epfEmployer: Math.round(monthlyGross * 0.12),
    etfEmployer: Math.round(monthlyGross * 0.03),
    netMonthly, netAnnual: netMonthly * 12,
    effectiveRate, taxBracket: slab.rate,
    slabs: TAX_SLABS_2025,
  };
}

// mobile/src/utils/format.ts
export const fmt  = (n: number) => Math.round(n || 0).toLocaleString('en-LK');
export const fmtK = (n: number) => {
  const a = Math.abs(n || 0);
  return a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}K` : `${Math.round(n || 0)}`;
};
export const today    = () => new Date().toISOString().slice(0, 10);
export const fmtDate  = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};
export const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);
export const curMonth  = () => new Date().toISOString().slice(0, 7);
