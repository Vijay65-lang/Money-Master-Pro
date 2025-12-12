
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum Category {
  // INCOME
  SALARY = 'Salary',
  FREELANCE = 'Freelance',
  BUSINESS = 'Business',
  INVESTMENTS = 'Investments',
  RENTAL = 'Rental Income',
  DIVIDENDS = 'Dividends',
  INTEREST = 'Interest',
  REFUNDS = 'Refunds',
  GIFTS = 'Gifts',
  BONUS = 'Bonus',
  GRANTS = 'Grants',
  
  // EXPENSE
  FOOD = 'Food & Dining',
  GROCERIES = 'Groceries',
  TRAVEL = 'Travel',
  SHOPPING = 'Shopping',
  HOUSING = 'Housing & Rent',
  BILLS = 'Bills & Utilities',
  MEDICAL = 'Healthcare',
  ENTERTAINMENT = 'Entertainment',
  EDUCATION = 'Education',
  PERSONAL = 'Personal Care',
  INSURANCE = 'Insurance',
  DEBT = 'Debt & EMI',
  TAXES = 'Taxes',
  CHARITY = 'Charity',
  
  // BOTH
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
  RESET_PASSWORD = 'RESET_PASSWORD',
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
