import React from 'react';
import { Button, Spinner } from '@heroui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SpendingOverviewItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CashflowChartProps {
  data: SpendingOverviewItem[];
  period: '7d' | '30d' | '3m' | '6m' | '1y';
  onPeriodChange: (newPeriod: '7d' | '30d' | '3m' | '6m' | '1y') => void;
  isLoading?: boolean;
  currency?: string;
}

const periods: Array<'7d' | '30d' | '3m' | '6m' | '1y'> = ['7d', '30d', '3m', '6m', '1y'];

export const CashflowChart: React.FC<CashflowChartProps> = ({
  data,
  period,
  onPeriodChange,
  isLoading = false,
  currency = 'INR',
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-lg text-xs space-y-1">
          <div className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {entry.name}:
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = data && data.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <div className="w-full">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Cash Flow & Spending
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Income, expenses, and net savings over time
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 self-start sm:self-auto">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all uppercase ${
                period === p
                  ? 'bg-white dark:bg-[#172033] text-primary-600 dark:text-primary-400 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" color="primary" />
          </div>
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Not enough data yet
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Add a few more transactions to see your spending trends over time.
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickFormatter={(val) => {
                  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                  return `₹${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: '0.75rem' }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#16A34A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#DC2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
              <Area
                type="monotone"
                dataKey="savings"
                name="Net Savings"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#savingsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
