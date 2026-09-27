import React, { useState } from 'react';
import { Button, Skeleton, Chip } from '@heroui/react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import { StatCard } from '../components/StatCard';
import { BalanceCard } from '../components/BalanceCard';
import { CashflowChart } from '../components/CashflowChart';
import { ExpenseDonutChart } from '../components/ExpenseDonutChart';
import { BudgetProgress } from '../components/BudgetProgress';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useShortcuts } from '../context/ShortcutContext';
import { EmptyState } from '../components/EmptyState';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAddModal } = useShortcuts();
  const currency = user?.preferences?.currency || 'INR';

  const [overviewPeriod, setOverviewPeriod] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('30d');

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getDashboard,
  });

  // Fetch spending overview chart data
  const {
    data: chartData = [],
    isLoading: isChartLoading,
  } = useQuery({
    queryKey: ['spending-overview', overviewPeriod],
    queryFn: () => dashboardApi.getSpendingOverview(overviewPeriod),
  });

  if (isDashboardLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <Skeleton className="h-44 rounded-xl" />
          </div>
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-sm">
        Failed to load financial overview. Please ensure the backend server is running.
      </div>
    );
  }

  const {
    summary,
    expenseBreakdown = [],
    recentTransactions = [],
    budgets = [],
    upcomingPayments = [],
    insights = [],
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here's your financial overview.
          </p>
        </div>

        <Button
          color="primary"
          variant="solid"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          onPress={openAddModal}
          className="font-medium shadow-sm self-start sm:self-auto"
        >
          Add Transaction
        </Button>
      </div>

      {/* Top Section: Primary Balance Card & Compact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Primary Strong Balance Card */}
        <div className="md:col-span-5">
          <BalanceCard
            balance={summary?.balance ?? 82450}
            currency={currency}
            changePercentage={12.4}
          />
        </div>

        {/* 3 Compact KPI Cards */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            title="Income"
            value={formatCurrency(summary?.income, currency)}
            subtitle="This month"
            icon={<TrendingUp className="w-4 h-4" />}
            iconColor="#16A34A"
          />
          <StatCard
            title="Expenses"
            value={formatCurrency(summary?.expenses, currency)}
            subtitle="This month"
            icon={<TrendingDown className="w-4 h-4" />}
            iconColor="#DC2626"
          />
          <StatCard
            title="Savings"
            value={formatCurrency(summary?.savings, currency)}
            subtitle={`${summary?.savingsRate || 0}% rate`}
            trend={{
              value: `${summary?.savingsRate || 0}%`,
              isPositive: (summary?.savingsRate || 0) >= 30,
            }}
            icon={<PiggyBank className="w-4 h-4" />}
            iconColor="#2563EB"
          />
        </div>
      </div>

      {/* Financial Insights Section */}
      {insights.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Financial Insights
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {insights.slice(0, 3).map((insight) => {
              const isPositive = insight.type === 'success';
              const isWarning = insight.type === 'warning' || insight.type === 'error';

              return (
                <div
                  key={insight.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {isPositive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-primary-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {insight.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {insight.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Section: Spending Area Chart & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <CashflowChart
            data={chartData}
            period={overviewPeriod}
            onPeriodChange={setOverviewPeriod}
            isLoading={isChartLoading}
            currency={currency}
          />
        </div>

        <div className="lg:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Category Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Spending distribution this month
            </p>
          </div>
          <div className="flex-1 flex items-center">
            <ExpenseDonutChart
              data={expenseBreakdown}
              currency={currency}
              totalExpense={summary?.expenses || 0}
            />
          </div>
        </div>
      </div>

      {/* Section: Budgets & Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Budgets */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Monthly Budgets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time limits and remaining balances
              </p>
            </div>
            <Button
              size="sm"
              variant="light"
              className="text-xs font-medium text-primary-600 dark:text-primary-400"
              endContent={<ArrowRight className="w-3.5 h-3.5" />}
              onPress={() => navigate('/budgets')}
            >
              Manage
            </Button>
          </div>

          {budgets.length === 0 ? (
            <EmptyState
              title="No Budgets Defined"
              description="Set monthly spending limits for key categories to keep your budget on track."
              actionText="Create Budget"
              onAction={() => navigate('/budgets')}
            />
          ) : (
            <div className="space-y-3">
              {budgets.slice(0, 4).map((b) => (
                <BudgetProgress key={b._id} budget={b} currency={currency} compact />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Payments */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Upcoming Payments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subscriptions & recurring commitments
              </p>
            </div>
            <Button
              size="sm"
              variant="light"
              className="text-xs font-medium text-primary-600 dark:text-primary-400"
              endContent={<ArrowRight className="w-3.5 h-3.5" />}
              onPress={() => navigate('/recurring')}
            >
              View All
            </Button>
          </div>

          {upcomingPayments.length === 0 ? (
            <EmptyState
              title="No Upcoming Payments"
              description="Add recurring subscriptions or EMIs to track upcoming renewal dates."
              actionText="Add Recurring"
              onAction={() => navigate('/recurring')}
            />
          ) : (
            <div className="space-y-2.5">
              {upcomingPayments.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.categoryId?.color || '#2563EB'}15`,
                        color: item.categoryId?.color || '#2563EB',
                      }}
                    >
                      <CategoryIcon iconName={item.categoryId?.icon} size="small" />
                    </div>
                    <div className="min-w-0 truncate">
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h5>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Due {formatDate(item.nextPaymentDate)}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section: Recent Transactions */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest financial activity
            </p>
          </div>
          <Button
            size="sm"
            variant="light"
            className="text-xs font-medium text-primary-600 dark:text-primary-400"
            endContent={<ArrowRight className="w-3.5 h-3.5" />}
            onPress={() => navigate('/transactions')}
          >
            View All
          </Button>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No Transactions Yet"
            description="Start tracking your spending to understand where your money goes."
            actionText="Add your first transaction"
            onAction={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="pb-2.5 font-medium">Category</th>
                  <th className="pb-2.5 font-medium">Description</th>
                  <th className="pb-2.5 font-medium">Date</th>
                  <th className="pb-2.5 font-medium">Method</th>
                  <th className="pb-2.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {recentTransactions.map((tx) => {
                  const cat = typeof tx.categoryId === 'object' ? tx.categoryId : null;
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx._id}
                      onClick={() => navigate('/transactions')}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${cat?.color || '#2563EB'}15`,
                              color: cat?.color || '#2563EB',
                            }}
                          >
                            <CategoryIcon iconName={cat?.icon} size="small" />
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {cat?.name || 'General'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                        {tx.description || (isIncome ? 'Income Credit' : 'Expense Debit')}
                      </td>

                      <td className="py-3 pr-3 text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      <td className="py-3 pr-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                          {tx.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 text-right whitespace-nowrap font-semibold">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
