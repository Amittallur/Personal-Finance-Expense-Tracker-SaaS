import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ExpenseCategoryBreakdown } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseDonutChartProps {
  data: ExpenseCategoryBreakdown[];
  currency?: string;
  totalExpense: number;
}

const DEFAULT_COLORS = [
  '#2563EB',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#3B82F6',
  '#14B8A6',
  '#F97316',
  '#64748B',
];

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  data,
  currency = 'INR',
  totalExpense,
}) => {
  if (!data || data.length === 0 || totalExpense === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        No expense data available for this period.
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-lg text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            {formatCurrency(entry.amount, currency)}{' '}
            <span className="text-slate-400 font-normal">({entry.percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={68}
              outerRadius={92}
              paddingAngle={2}
              dataKey="amount"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Spent
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-50 font-sans tracking-tight">
            {formatCurrency(totalExpense, currency)}
          </span>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-2 mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
        {chartData.slice(0, 5).map((item) => (
          <div
            key={item.id || item.name}
            className="flex items-center justify-between pt-2 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                }}
              >
                <CategoryIcon iconName={item.icon} size="small" />
              </div>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {item.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(item.amount, currency)}
              </span>
              <span className="text-slate-400 text-[11px] min-w-[28px] text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
