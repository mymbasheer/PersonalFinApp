// mobile/src/utils/format.ts
// ─────────────────────────────────────────────────
// All formatting / display helpers in one place.
// Import from here; do NOT duplicate in other files.
// ─────────────────────────────────────────────────

/** Round and format as LKR locale string: 1234567 → "1,234,567" */
export const fmt = (n: number): string =>
    Math.round(n || 0).toLocaleString('en-LK');

/** Format with LKR prefix: 1234567 → "LKR 1,234,567" */
export const fmtLKR = (n: number): string =>
    `LKR ${fmt(n)}`;

/** Compact format: 1_500_000 → "1.50M", 12_500 → "12.5K" */
export const fmtK = (n: number): string => {
    const a = Math.abs(n || 0);
    if (a >= 1e6) return `${(a / 1e6).toFixed(2)}M`;
    if (a >= 1e3) return `${(a / 1e3).toFixed(1)}K`;
    return `${Math.round(n || 0)}`;
};

/** Today as ISO date string: "2025-03-04" */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** Current month as ISO month string: "2025-03" */
export const curMonth = (): string => new Date().toISOString().slice(0, 7);

/** Human-readable date: "04 Mar 2025" */
export const fmtDate = (d: string): string => {
    try {
        return new Date(d).toLocaleDateString('en-LK', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return d;
    }
};

/** Days until a future date (negative = overdue) */
export const daysUntil = (d: string): number =>
    Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);

/** Percentage string: 0.1234 → "12.3%" */
export const fmtPct = (n: number, decimals = 1): string =>
    `${(n * 100).toFixed(decimals)}%`;

/** Truncate a string with ellipsis */
export const truncate = (s: string, maxLen = 30): string =>
    s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
