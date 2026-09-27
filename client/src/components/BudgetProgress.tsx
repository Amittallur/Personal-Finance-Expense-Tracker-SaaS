import React from 'react';
import { Progress, Chip, Button, Tooltip } from '@heroui/react';
import { Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Budget } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetProgressProps {
  budget: Budget;
  currency?: string;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  compact?: boolean;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  budget,
  currency = 'INR',
  onEdit,
  onDelete,
  compact = false,
}) => {
  const category = budget.categoryId || { name: 'Category', icon: 'category', color: '#2563EB' };

  let progressColor: 'success' | 'warning' | 'danger' = 'success';
  let statusBadge = (
    <Chip
      size="sm"
      variant="flat"
      color="success"
      startContent={<CheckCircle className="w-3 h-3" />}
      classNames={{ base: 'h-5 px-1.5 gap-1', content: 'text-[11px] font-semibold' }}
    >
      Normal
    </Chip>
  );

  if (budget.status === 'exceeded') {
    progressColor = 'danger';
    statusBadge = (
      <Chip
        size="sm"
        variant="flat"
        color="danger"
        startContent={<AlertCircle className="w-3 h-3" />}
        classNames={{ base: 'h-5 px-1.5 gap-1', content: 'text-[11px] font-semibold' }}
      >
        Exceeded
      </Chip>
    );
  } else if (budget.status === 'near_limit') {
    progressColor = 'warning';
    statusBadge = (
      <Chip
        size="sm"
        variant="flat"
        color="warning"
        startContent={<AlertTriangle className="w-3 h-3" />}
        classNames={{ base: 'h-5 px-1.5 gap-1', content: 'text-[11px] font-semibold' }}
      >
        Near Limit
      </Chip>
    );
  }

  const cappedPercentage = Math.min(100, budget.percentage);

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm transition-all duration-150 ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${category.color || '#2563EB'}18`,
              color: category.color || '#2563EB',
            }}
          >
            <CategoryIcon iconName={category.icon} size="small" />
          </div>
          <div className="min-w-0 truncate">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {category.name}
            </h4>
            {!compact && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Limit: {formatCurrency(budget.limit, currency)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {statusBadge}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-0.5">
              {onEdit && (
                <Tooltip content="Edit Budget" closeDelay={0}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="w-7 h-7 min-w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onPress={() => onEdit(budget)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip content="Delete Budget" closeDelay={0}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="w-7 h-7 min-w-7 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                    onPress={() => onDelete(budget)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amounts and % */}
      <div className="flex items-baseline justify-between text-xs sm:text-sm mb-1.5">
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(budget.spent, currency)}{' '}
          <span className="font-normal text-slate-400 text-xs">
            / {formatCurrency(budget.limit, currency)}
          </span>
        </div>
        <div
          className={`font-semibold text-xs ${
            budget.status === 'exceeded'
              ? 'text-rose-600 dark:text-rose-400'
              : budget.status === 'near_limit'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {budget.percentage}% used
        </div>
      </div>

      {/* Progress Bar */}
      <Progress
        aria-label={`${category.name} budget progress`}
        value={cappedPercentage}
        color={progressColor}
        size="sm"
        className="w-full"
        classNames={{
          track: 'bg-slate-100 dark:bg-slate-800',
        }}
      />

      {/* Remaining Footer */}
      {!compact && (
        <div className="flex items-center justify-between mt-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {budget.remaining > 0
              ? `${formatCurrency(budget.remaining, currency)} remaining`
              : `${formatCurrency(budget.spent - budget.limit, currency)} over budget`}
          </span>
          <span className="text-[11px] text-slate-400">
            Alert at {budget.alertThreshold}%
          </span>
        </div>
      )}
    </div>
  );
};
