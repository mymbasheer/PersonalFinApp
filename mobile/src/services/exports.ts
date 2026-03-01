// mobile/src/services/exports.ts
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { Share } from 'react-native';
import XLSX from 'xlsx';
import { taxBreakdown } from '../utils/tax';
import { fmt, today } from '../utils/tax';

// ── PDF Export
export async function exportTaxPDF(user: any) {
  const bd = taxBreakdown(user.monthly_gross || 0);
  const html = `
  <html><head><meta charset="utf-8"/>
  <style>
    body{font-family:Arial;background:#060D1A;color:#E8F0FD;padding:30px}
    h1{color:#D4A843;font-size:24px;margin-bottom:4px}
    h2{color:#D4A843;font-size:14px;margin:20px 0 8px}
    .sub{color:#7A9CC4;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#0D1929;color:#D4A843;padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1px}
    td{padding:9px 14px;border-bottom:1px solid #1A2D47;font-size:13px}
    tr:nth-child(even)td{background:#0a1520}
    .hi{color:#1DB8A8;font-weight:bold}
    .red{color:#E05252}
    footer{color:#3D5A7A;font-size:10px;margin-top:30px;border-top:1px solid #1A2D47;padding-top:12px}
  </style></head><body>
  <h1>🇱🇰 PersonalFinApp v4</h1>
  <div class="sub">Annual Tax Report — FY 2025/2026 · IRD 2025 Compliant</div>
  <table><tr><th colspan="2">TAXPAYER DETAILS</th></tr>
  <tr><td>Name</td><td>${user.first_name} ${user.last_name}</td></tr>
  <tr><td>NIC</td><td>${user.nic || '—'}</td></tr>
  <tr><td>District</td><td>${user.district || '—'}</td></tr>
  <tr><td>Occupation</td><td>${user.occupation || '—'}</td></tr>
  <tr><td>Generated</td><td>${new Date().toLocaleDateString('en-LK')}</td></tr>
  </table>
  <h2>APIT CALCULATION (IRD 2025)</h2>
  <table><tr><th>Description</th><th>Amount (LKR)</th></tr>
  <tr><td>Annual Gross Income</td><td class="hi">${fmt(bd.annualGross)}</td></tr>
  <tr><td>Tax-Free Threshold</td><td>1,800,000</td></tr>
  <tr><td>Taxable Income</td><td>${fmt(Math.max(0, bd.annualGross - 1800000))}</td></tr>
  <tr><td>Annual APIT Tax</td><td class="red">${fmt(bd.annualAPIT)}</td></tr>
  <tr><td>Monthly APIT</td><td class="red">${fmt(bd.monthlyAPIT)}</td></tr>
  <tr><td>Effective Tax Rate</td><td>${bd.effectiveRate}%</td></tr>
  <tr><td>Tax Bracket</td><td>${bd.taxBracket}%</td></tr>
  <tr><td>EPF Employee (8%/month)</td><td>${fmt(bd.epfEmployee)}</td></tr>
  <tr><td>EPF Employer (12%/month)</td><td>${fmt(bd.epfEmployer)}</td></tr>
  <tr><td>ETF Employer (3%/month)</td><td>${fmt(bd.etfEmployer)}</td></tr>
  <tr><td>Net Monthly Take-Home</td><td class="hi">${fmt(bd.netMonthly)}</td></tr>
  </table>
  <h2>TAX SLABS 2025</h2>
  <table><tr><th>Annual Income Band</th><th>Rate</th></tr>
  <tr><td>Up to LKR 1,800,000</td><td>0% (Tax-free)</td></tr>
  <tr><td>LKR 1,800,001 – 2,800,000</td><td>6%</td></tr>
  <tr><td>LKR 2,800,001 – 3,800,000</td><td>12%</td></tr>
  <tr><td>LKR 3,800,001 – 5,800,000</td><td>18%</td></tr>
  <tr><td>LKR 5,800,001 – 7,800,000</td><td>24%</td></tr>
  <tr><td>Above LKR 7,800,000</td><td>30%</td></tr>
  </table>
  <p class="red" style="font-size:13px">⚠️ IRD Filing Deadline: November 30, 2026. Late penalty: LKR 50,000 or 10% of tax payable.</p>
  <footer>PersonalFinApp v4 · For personal reference only. Consult a licensed tax advisor for IRD submissions.</footer>
  </body></html>`;

  const options = { html, fileName: `PFA_Tax_${today()}`, directory: 'Documents' };
  const file = await RNHTMLtoPDF.convert(options);
  if (file.filePath) {
    await Share.share({ url: `file://${file.filePath}`, title: 'Tax Report 2025/2026' });
  }
  return file.filePath;
}

export async function exportMonthlyPDF(user: any, summary: any) {
  const html = `<html><head><meta charset="utf-8"/>
  <style>body{font-family:Arial;padding:30px;color:#333} h1{color:#D4A843} table{width:100%;border-collapse:collapse} th{background:#060D1A;color:#D4A843;padding:8px 12px;text-align:left} td{padding:8px 12px;border-bottom:1px solid #ddd}</style>
  </head><body>
  <h1>PersonalFinApp — Monthly Summary</h1>
  <p>${user.first_name} ${user.last_name} · ${new Date().toLocaleDateString('en-LK', { month: 'long', year: 'numeric' })}</p>
  <table><tr><th>Category</th><th>Amount (LKR)</th></tr>
  ${(summary.byCat || []).map((c: any) => `<tr><td>${c.category}</td><td>${fmt(c.total)}</td></tr>`).join('')}
  <tr><td><b>TOTAL EXPENSES</b></td><td><b>${fmt(summary.totalExpense)}</b></td></tr>
  <tr><td>TOTAL INCOME</td><td>${fmt(summary.totalIncome)}</td></tr>
  </table>
  <footer style="margin-top:20px;color:#999;font-size:11px">PersonalFinApp v4 · Generated ${new Date().toLocaleDateString('en-LK')}</footer>
  </body></html>`;

  const file = await RNHTMLtoPDF.convert({ html, fileName: `PFA_Monthly_${today()}`, directory: 'Documents' });
  if (file.filePath) await Share.share({ url: `file://${file.filePath}`, title: 'Monthly Report' });
  return file.filePath;
}

// ── Excel Export
export async function exportTransactionsXLSX(transactions: any[], user: any) {
  const wb = XLSX.utils.book_new();
  const data = [
    [`PersonalFinApp — Transaction Report`],
    [`${user.first_name} ${user.last_name} · ${new Date().toLocaleDateString('en-LK')}`],
    [],
    ['Date', 'Category', 'Description', 'Amount (LKR)', 'Method', 'Type', 'Note'],
    ...transactions.map(t => [t.txn_date, t.category, t.description || '', t.amount, t.payment_method || 'Cash', t.type, t.note || '']),
    [],
    ['', '', 'TOTAL EXPENSES', transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 35 }, { wch: 15 }, { wch: 14 }, { wch: 10 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const path = `${RNFS.DocumentDirectoryPath}/PFA_Transactions_${today()}.xlsx`;
  await RNFS.writeFile(path, wbout, 'base64');
  await Share.share({ url: `file://${path}`, title: 'Transactions Export' });
  return path;
}

export async function exportLoanScheduleXLSX(debt: any, schedule: any[]) {
  const wb = XLSX.utils.book_new();
  const data = [
    [`${debt.name} — Loan Amortization Schedule`],
    [`Lender: ${debt.lender || '—'} · Rate: ${debt.interest_rate}% p.a. · EMI: LKR ${fmt(debt.emi)}`],
    [],
    ['Month', 'Opening Balance', 'EMI', 'Interest', 'Principal', 'Closing Balance'],
    ...schedule.map(r => [r.month, r.opening, r.emi, r.interest, r.principal, r.closing]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const path = `${RNFS.DocumentDirectoryPath}/PFA_Loan_${debt.name}_${today()}.xlsx`;
  await RNFS.writeFile(path, wbout, 'base64');
  await Share.share({ url: `file://${path}`, title: 'Loan Schedule' });
  return path;
}
