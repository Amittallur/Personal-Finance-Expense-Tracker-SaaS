import React, { useState } from 'react';
import { Card, CardBody, Progress, Button, Chip, Tooltip } from '@heroui/react';
import { Plus, Edit2, Trash2, Calendar, TrendingUp, History, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Goal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface GoalCardProps {
  goal: Goal;
  currency?: string;
  onContribute: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  currency = 'INR',
  onContribute,
  onEdit,
  onDelete,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const percentage = goal.percentage || (goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0);
  const cappedPercentage = Math.min(100, percentage);
  const remaining = goal.remainingAmount ?? Math.max(0, goal.targetAmount - goal.savedAmount);
  const isCompleted = goal.isCompleted || goal.savedAmount >= goal.targetAmount;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl overflow-hidden flex flex-col justify-between">
      <CardBody className="p-5 flex flex-col justify-between h-full">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: goal.color || '#2563EB' }}
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {goal.category || 'General'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {goal.name}
              </h3>
            </div>

            <div className="flex items-center gap-0.5">
              <Tooltip content="Edit Goal" closeDelay={0}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="w-7 h-7 min-w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onPress={() => onEdit(goal)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
              <Tooltip content="Delete Goal" closeDelay={0}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="w-7 h-7 min-w-7 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                  onPress={() => onDelete(goal)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Amounts & Progress */}
          <div className="my-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400 font-sans">
                {formatCurrency(goal.savedAmount, currency)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Target: {formatCurrency(goal.targetAmount, currency)}
              </span>
            </div>

            <Progress
              aria-label={`${goal.name} goal progress`}
              value={cappedPercentage}
              color={isCompleted ? 'success' : 'primary'}
              size="md"
              className="w-full"
              classNames={{
                track: 'bg-slate-100 dark:bg-slate-800',
              }}
            />

            <div className="flex items-center justify-between text-xs mt-1.5 text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {percentage.toFixed(0)}% achieved
              </span>
              <span>
                {isCompleted ? 'Target achieved!' : `${formatCurrency(remaining, currency)} remaining`}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 my-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Target: <strong>{formatDate(goal.deadline)}</strong></span>
            </div>

            {!isCompleted && goal.requiredMonthlySaving !== undefined && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Needed: <strong>{formatCurrency(goal.requiredMonthlySaving, currency)}/mo</strong>
                </span>
              </div>
            )}

            <div className="pt-1">
              {isCompleted ? (
                <Chip
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<CheckCircle className="w-3 h-3" />}
                  classNames={{ base: 'h-5 px-1.5 gap-1', content: 'text-[11px] font-semibold' }}
                >
                  Completed
                </Chip>
              ) : goal.isOnTrack ? (
                <Chip
                  size="sm"
                  color="success"
                  variant="flat"
                  classNames={{ base: 'h-5 px-1.5', content: 'text-[11px] font-medium' }}
                >
                  On Track
                </Chip>
              ) : (
                <Chip
                  size="sm"
                  color="warning"
                  variant="flat"
                  classNames={{ base: 'h-5 px-1.5', content: 'text-[11px] font-medium' }}
                >
                  Behind Schedule
                </Chip>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              variant="solid"
              size="sm"
              className="flex-1 font-medium"
              startContent={<Plus className="w-3.5 h-3.5" />}
              onPress={() => onContribute(goal)}
              isDisabled={isCompleted}
            >
              Add money
            </Button>
            {goal.contributions && goal.contributions.length > 0 && (
              <Button
                variant="flat"
                size="sm"
                className="text-xs px-2.5 text-slate-600 dark:text-slate-300"
                startContent={<History className="w-3 h-3" />}
                endContent={showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                onPress={() => setShowHistory(!showHistory)}
              >
                Logs
              </Button>
            )}
          </div>

          {/* Collapsible History */}
          {showHistory && goal.contributions && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs max-h-36 overflow-y-auto space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Recent Contributions
              </div>
              {goal.contributions.map((c, idx) => (
                <div key={c._id || idx} className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(c.amount, currency)}
                    </span>
                    {c.notes && (
                      <span className="text-[11px] text-slate-400 block">{c.notes}</span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px]">{formatDate(c.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
