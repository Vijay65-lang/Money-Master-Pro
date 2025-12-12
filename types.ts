
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum Category {
  FOOD = 'Food',
  TRAVEL = 'Travel',
  SHOPPING = 'Shopping',
  BILLS = 'Bills & EMI',
  ENTERTAINMENT = 'Movies/Fun',
  GROCERIES = 'Groceries',
  MEDICAL = 'Medical',
  SALARY = 'Salary',
  BUSINESS = 'Business',
  FREELANCE = 'Freelance',
  INVESTMENT_RETURN = 'Returns',
  OTHERS = 'Others',
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  date: string; // ISO string
  notes?: string;
}

export enum ViewState {
  AUTH = 'AUTH',
  HOME = 'HOME',
  EXPENSES = 'EXPENSES',
  INCOME = 'INCOME',
  INVESTMENTS = 'INVESTMENTS',
  TOOLS = 'TOOLS',
  AI_BRAIN = 'AI_BRAIN',
  PROFILE = 'PROFILE',
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY';
export type Theme = 'light' | 'dark';

export interface UserProfile {
  id: string; // Supabase UUID
  name: string;
  email: string; // Primary ID
  currency: CurrencyCode;
  theme: Theme;
  privacyMode: boolean; // Masks balances
  lastLogin: number; // For session timeout
  cloudConnected?: boolean;
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};
