import React from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface BalanceCardProps {
  balance: number;
  currency?: string;
  changePercentage?: number;
  sparklineData?: Array<{ value: number }>;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = 'INR',
  changePercentage = 12.4,
  sparklineData,
}) => {
  const isPositive = changePercentage >= 0;

  const defaultSparkline = [
    { value: balance * 0.88 },
    { value: balance * 0.91 },
    { value: balance * 0.89 },
    { value: balance * 0.94 },
    { value: balance * 0.92 },
    { value: balance * 0.97 },
    { value: balance },
  ];

  const data = sparklineData && sparklineData.length > 0 ? sparklineData : defaultSparkline;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl overflow-hidden">
      <CardBody className="p-5 sm:p-6 flex flex-col justify-between h-full">
        <div>
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Balance
          </span>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1 mb-2 font-sans">
            {formatCurrency(balance, currency)}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              size="sm"
              variant="flat"
              color={isPositive ? 'success' : 'danger'}
              startContent={
                isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                )
              }
              classNames={{
                base: 'h-5 px-1.5 gap-0.5',
                content: 'text-xs font-semibold tracking-tight',
              }}
            >
              {isPositive ? '+' : ''}
              {changePercentage}%
            </Chip>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              compared with last month
            </span>
          </div>
        </div>

        {/* Minimal Sparkline Chart */}
        <div className="h-12 w-full mt-4 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceSparkline" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? '#16A34A' : '#2563EB'}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? '#16A34A' : '#2563EB'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#16A34A' : '#2563EB'}
                strokeWidth={2}
                fill="url(#balanceSparkline)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};
