export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface UserPreferences {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'AED';
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface Category {
  _id: string;
  userId: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
  transactionCount?: number;
  totalSpentOrEarned?: number;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: Category | string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export interface Budget {
  _id: string;
  userId: string;
  categoryId: Category | any;
  month: number;
  year: number;
  limit: number;
  alertThreshold: number;
  spent: number;
  percentage: number;
  remaining: number;
  status: 'normal' | 'near_limit' | 'exceeded';
}

export interface GoalContribution {
  _id?: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Goal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  category: string;
  color: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  contributions: GoalContribution[];
  percentage?: number;
  remainingAmount?: number;
  daysRemaining?: number;
  monthsRemaining?: number;
  requiredMonthlySaving?: number;
  monthlyVelocity?: number;
  isOnTrack?: boolean;
  isCompleted?: boolean;
}

export interface RecurringTransaction {
  _id: string;
  userId: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: Category | any;
  frequency: FrequencyType;
  isSubscription: boolean;
  paymentMethod: PaymentMethod;
  startDate: string;
  nextPaymentDate: string;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  normalizedMonthly?: number;
  normalizedYearly?: number;
}

export interface FinancialInsight {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  text: string;
  highlight: string;
  importance: 'low' | 'medium' | 'high';
}

export interface DashboardSummary {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  allTimeIncome: number;
  allTimeExpense: number;
}

export interface ExpenseCategoryBreakdown {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  expenseBreakdown: ExpenseCategoryBreakdown[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  upcomingPayments: RecurringTransaction[];
  insights: FinancialInsight[];
}

export interface SpendingOverviewItem {
  date: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface AnalyticsRankedCategory {
  rank: number;
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
    averageMonthlyExpense: number;
  };
  monthlyTrends: Array<{
    monthKey: string;
    monthName: string;
    income: number;
    expenses: number;
    savings: number;
  }>;
  categoryBreakdown: AnalyticsRankedCategory[];
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
