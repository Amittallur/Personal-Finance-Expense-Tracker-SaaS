import React, { useState } from 'react';
import { Skeleton, Chip } from '@heroui/react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Receipt,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/endpoints';
import { StatCard } from '../components/StatCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#64748B'];
const periods = ['30d', '3m', '6m', '1y'];

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.preferences?.currency || 'INR';

  const [period, setPeriod] = useState<string>('6m');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const queryParams = isCustom && customStart && customEnd
    ? { startDate: customStart, endDate: customEnd }
    : { period };

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', queryParams],
    queryFn: () => analyticsApi.getAnalytics(queryParams),
  });

  const { summary, monthlyTrends = [], categoryBreakdown = [], paymentMethods = [] } = data || {};

  const handlePeriodChange = (newPeriod: string) => {
    if (newPeriod === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setPeriod(newPeriod);
    }
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-lg text-xs space-y-1">
          <div className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </div>
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}:</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            In-depth spending trends, category proportions, and savings rate
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md uppercase transition-all ${
                  !isCustom && period === p
                    ? 'bg-white dark:bg-[#172033] text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePeriodChange('custom')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isCustom
                  ? 'bg-white dark:bg-[#172033] text-primary-600 dark:text-primary-400 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Custom
            </button>
          </div>

          {isCustom && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.totalIncome, currency)}
          subtitle="Selected range"
          icon={<TrendingUp className="w-4 h-4" />}
          iconColor="#16A34A"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpense, currency)}
          subtitle="Selected range"
          icon={<TrendingDown className="w-4 h-4" />}
          iconColor="#DC2626"
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency(summary?.netSavings, currency)}
          subtitle="Income - Expenses"
          icon={<PiggyBank className="w-4 h-4" />}
          iconColor="#2563EB"
        />
        <StatCard
          title="Savings Rate"
          value={`${summary?.savingsRate || 0}%`}
          subtitle="(Savings / Income) * 100"
          trend={{
            value: `${summary?.savingsRate || 0}%`,
            isPositive: (summary?.savingsRate || 0) >= 30,
          }}
          icon={<Percent className="w-4 h-4" />}
          iconColor="#8B5CF6"
        />
        <StatCard
          title="Monthly Burn Rate"
          value={formatCurrency(summary?.averageMonthlyExpense, currency)}
          subtitle="Average monthly expense"
          icon={<Receipt className="w-4 h-4" />}
          iconColor="#D97706"
        />
      </div>

      {/* Charts Section 1: Income vs Expenses & Spending Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Income vs Expenses (Bar Chart) */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Monthly Income vs Expenses
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side cashflow comparison across months
            </p>
          </div>

          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="h-80 rounded-xl" />
            ) : monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No transaction trends found in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis
                    dataKey="monthName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 16, fontSize: '0.75rem' }} />
                  <Bar dataKey="income" name="Income" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Spending Trends (Line Chart) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Savings Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trajectory of net monthly savings
            </p>
          </div>

          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="h-80 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis
                    dataKey="monthName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 16, fontSize: '0.75rem' }} />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    name="Net Savings"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Ranked Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Highest Spending Categories Ranked Table */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Highest Spending Categories
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked by total expense volume and proportion
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">% Share</th>
                  <th className="pb-2 text-right">Tx Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {categoryBreakdown.map((cat) => (
                  <tr key={cat.categoryId || cat.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={cat.rank === 1 ? 'danger' : cat.rank <= 3 ? 'warning' : 'default'}
                        classNames={{ base: 'h-5 px-1.5', content: 'text-[10px] font-bold' }}
                      >
                        #{cat.rank}
                      </Chip>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat.color}18`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon iconName={cat.icon} size="small" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(cat.amount, currency)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400 font-medium">
                      {cat.percentage}%
                    </td>
                    <td className="py-2.5 text-right text-slate-400">
                      {cat.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Payment Methods
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              UPI, Cards, Cash, and Bank Transfer distribution
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {paymentMethods.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {paymentMethods.map((pm, idx) => (
              <div key={pm.method} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span>{pm.method}: {pm.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
