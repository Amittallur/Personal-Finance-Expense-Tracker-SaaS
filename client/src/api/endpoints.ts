import api from './client';
import {
  User,
  Category,
  Transaction,
  Budget,
  Goal,
  RecurringTransaction,
  DashboardData,
  AnalyticsData,
  SpendingOverviewItem,
} from '../types';

// Auth API
export const authApi = {
  getMe: async () => {
    const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ success: boolean; data: { user: User } }>('/auth/login', credentials);
    return res.data.data.user;
  },
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await api.post<{ success: boolean; data: { user: User } }>('/auth/register', data);
    return res.data.data.user;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  updateProfile: async (data: { name?: string; preferences?: Partial<User['preferences']> }) => {
    const res = await api.put<{ success: boolean; data: { user: User } }>('/auth/profile', data);
    return res.data.data.user;
  },
  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    const res = await api.put<{ success: boolean; message: string }>('/auth/change-password', passwords);
    return res.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getDashboard: async () => {
    const res = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
    return res.data.data;
  },
  getSpendingOverview: async (period: '7d' | '30d' | '3m' | '6m' | '1y' = '30d') => {
    const res = await api.get<{ success: boolean; data: { period: string; chartData: SpendingOverviewItem[] } }>(
      `/dashboard/spending-overview?period=${period}`
    );
    return res.data.data.chartData;
  },
};

// Transactions API
export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'income' | 'expense';
  categoryId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const transactionApi = {
  getAll: async (params: GetTransactionsParams = {}) => {
    const res = await api.get<{
      success: boolean;
      data: {
        transactions: Transaction[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
        summary: { totalIncome: number; totalExpense: number; netBalance: number };
      };
    }>('/transactions', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Transaction }>(`/transactions/${id}`);
    return res.data.data;
  },
  create: async (data: Partial<Transaction> & { categoryId: string }) => {
    const res = await api.post<{ success: boolean; data: Transaction }>('/transactions', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<Transaction>) => {
    const res = await api.put<{ success: boolean; data: Transaction }>(`/transactions/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/transactions/${id}`);
    return res.data;
  },
  previewImport: async (formData: FormData) => {
    const res = await api.post<{
      success: boolean;
      data: {
        totalRows: number;
        validCount: number;
        invalidCount: number;
        validRecords: any[];
        invalidRecords: Array<{ rowNumber: number; data: any; errors: string[] }>;
      };
    }>('/transactions/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  confirmImport: async (records: any[]) => {
    const res = await api.post<{ success: boolean; data: { importedCount: number }; message: string }>(
      '/transactions/import/confirm',
      { records }
    );
    return res.data;
  },
};

// Categories API
export const categoryApi = {
  getAll: async (type?: 'income' | 'expense') => {
    const res = await api.get<{ success: boolean; data: Category[] }>('/categories', {
      params: type ? { type } : {},
    });
    return res.data.data;
  },
  create: async (data: { name: string; type: 'income' | 'expense'; icon?: string; color?: string }) => {
    const res = await api.post<{ success: boolean; data: Category }>('/categories', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<Category>) => {
    const res = await api.put<{ success: boolean; data: Category }>(`/categories/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string, reassignToCategoryId?: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/categories/${id}`, {
      params: reassignToCategoryId ? { reassignToCategoryId } : {},
    });
    return res.data;
  },
};

// Budgets API
export const budgetApi = {
  getAll: async (month?: number, year?: number) => {
    const res = await api.get<{
      success: boolean;
      data: {
        budgets: Budget[];
        month: number;
        year: number;
        summary: {
          totalBudgeted: number;
          totalSpent: number;
          overallPercentage: number;
          remainingBudget: number;
        };
      };
    }>('/budgets', { params: { month, year } });
    return res.data.data;
  },
  create: async (data: { categoryId: string; month: number; year: number; limit: number; alertThreshold?: number }) => {
    const res = await api.post<{ success: boolean; data: Budget }>('/budgets', data);
    return res.data.data;
  },
  update: async (id: string, data: { limit?: number; alertThreshold?: number }) => {
    const res = await api.put<{ success: boolean; data: Budget }>(`/budgets/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/budgets/${id}`);
    return res.data;
  },
};

// Goals API
export const goalApi = {
  getAll: async () => {
    const res = await api.get<{
      success: boolean;
      data: {
        goals: Goal[];
        summary: {
          totalGoals: number;
          completedGoals: number;
          totalTarget: number;
          totalSaved: number;
          overallPercentage: number;
        };
      };
    }>('/goals');
    return res.data.data;
  },
  create: async (data: { name: string; targetAmount: number; savedAmount?: number; deadline: string; category?: string; color?: string }) => {
    const res = await api.post<{ success: boolean; data: Goal }>('/goals', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<Goal>) => {
    const res = await api.put<{ success: boolean; data: Goal }>(`/goals/${id}`, data);
    return res.data.data;
  },
  contribute: async (id: string, data: { amount: number; notes?: string; date?: string }) => {
    const res = await api.post<{ success: boolean; data: Goal; message: string }>(`/goals/${id}/contribute`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/goals/${id}`);
    return res.data;
  },
};

// Recurring API
export const recurringApi = {
  getAll: async (params?: { isSubscription?: boolean; status?: string }) => {
    const res = await api.get<{
      success: boolean;
      data: {
        items: RecurringTransaction[];
        summary: {
          totalCount: number;
          activeCount: number;
          totalMonthlyCost: number;
          totalYearlyCost: number;
        };
      };
    }>('/recurring', { params });
    return res.data.data;
  },
  create: async (data: Partial<RecurringTransaction> & { categoryId: string }) => {
    const res = await api.post<{ success: boolean; data: RecurringTransaction }>('/recurring', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<RecurringTransaction>) => {
    const res = await api.put<{ success: boolean; data: RecurringTransaction }>(`/recurring/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/recurring/${id}`);
    return res.data;
  },
};

// Analytics API
export const analyticsApi = {
  getAnalytics: async (params: { startDate?: string; endDate?: string; period?: string } = {}) => {
    const res = await api.get<{ success: boolean; data: AnalyticsData }>('/analytics', { params });
    return res.data.data;
  },
};
