// mobile/src/types/index.ts
// ─────────────────────────────────────────────────
// Central type definitions for PersonalFinApp
// ─────────────────────────────────────────────────

// ── User ─────────────────────────────────────────
export interface User {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    nic?: string;
    dob?: string;
    gender?: string;
    district?: string;
    occupation?: string;
    employer?: string;
    monthly_gross?: number;
    income_type?: string;
    other_income?: number;
    bio_cred?: string;
    push_token?: string;
    [key: string]: unknown;
}

// ── Transaction ──────────────────────────────────
export type TxnType = 'expense' | 'income';

export interface Transaction {
    id: number;
    user_id: number;
    type: TxnType;
    category: string;
    description: string;
    amount: number;
    payment_method: string;
    txn_date: string;
    note?: string;
    created_at: string;
}

export interface TxnSummary {
    month: string;
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    byCategory: Record<string, number>;
}

// ── Income ───────────────────────────────────────
export interface Income {
    id: number;
    user_id: number;
    source: string;
    amount: number;
    frequency: 'monthly' | 'annual' | 'one-off';
    received_date: string;
    note?: string;
    created_at: string;
}

// ── Goal ─────────────────────────────────────────
export interface Goal {
    id: number;
    user_id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    color?: string;
    icon?: string;
    created_at: string;
}

// ── Debt ─────────────────────────────────────────
export type DebtType = 'personal' | 'mortgage' | 'vehicle' | 'credit_card' | 'student' | 'other';

export interface Debt {
    id: number;
    user_id: number;
    name: string;
    type: DebtType;
    principal: number;
    outstanding: number;
    interest_rate: number;
    monthly_payment: number;
    start_date: string;
    end_date?: string;
    lender?: string;
    created_at: string;
}

export interface DebtScheduleItem {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
}

// ── Asset / Net Worth ────────────────────────────
export type AssetType =
    | 'property' | 'vehicle' | 'savings' | 'investment'
    | 'gold' | 'crypto' | 'business' | 'other';

export interface Asset {
    id: number;
    user_id: number;
    name: string;
    type: AssetType;
    value: number;
    purchased_at?: string;
    note?: string;
    created_at: string;
}

export interface NetWorthSummary {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assets: Asset[];
    debts: Debt[];
}

// ── Insurance ────────────────────────────────────
export type InsuranceType =
    | 'life' | 'health' | 'vehicle' | 'property' | 'travel' | 'other';

export interface Insurance {
    id: number;
    user_id: number;
    provider: string;
    type: InsuranceType;
    policy_number?: string;
    coverage: number;
    premium: number;
    premium_frequency: 'monthly' | 'quarterly' | 'annual';
    start_date: string;
    end_date?: string;
    note?: string;
    created_at: string;
}

// ── Reminder ─────────────────────────────────────
export type ReminderType = 'bill' | 'emi' | 'insurance' | 'tax' | 'custom';

export interface Reminder {
    id: number;
    user_id: number;
    title: string;
    type: ReminderType;
    amount?: number;
    due_date: string;
    recurring: boolean;
    recurrence?: 'daily' | 'weekly' | 'monthly' | 'annual';
    enabled: boolean;
    note?: string;
    created_at: string;
}

// ── Budget ───────────────────────────────────────
export type BudgetRecord = Record<string, number>;

// ── Market / Live Data ───────────────────────────
export interface FxRate {
    base: string;
    rates: Record<string, number>;
    date: string;
}

export interface GoldPrice {
    xauUsd: number;
    lkrPerGram: Record<string, number>;
    updatedAt: string;
}

// ── API Shapes ───────────────────────────────────
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

// ── Navigation ───────────────────────────────────
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: undefined;
    NetWorth: undefined;
    Tax: undefined;
    Goals: undefined;
    Debts: undefined;
    Insurance: undefined;
    Reports: undefined;
    Reminders: undefined;
    Settings: undefined;
};

export type TabParamList = {
    Dashboard: undefined;
    Expenses: undefined;
    Income: undefined;
    'LK Tools': undefined;
    Advisor: undefined;
};

// ── Local DB ─────────────────────────────────────
export interface PendingSync {
    id: string;
    entity: string;
    method: 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    payload: string;
    created_at: string;
}

// ── Tax ──────────────────────────────────────────
export interface TaxBreakdown {
    monthlyGross: number;
    annualGross: number;
    annualAPIT: number;
    monthlyAPIT: number;
    epfEmployee: number;
    epfEmployer: number;
    etfEmployer: number;
    netMonthly: number;
    netAnnual: number;
    effectiveRate: number;
    taxBracket: number;
    slabs: TaxSlab[];
}

export interface TaxSlab {
    from: number;
    to: number;
    rate: number;
}
