import React from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon: React.ReactNode;
  iconColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = '#2563EB',
  onClick,
}) => {
  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      className={`border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-xl transition-all duration-150 ${
        onClick ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer' : ''
      }`}
    >
      <CardBody className="p-4 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${iconColor}15`,
              color: iconColor,
            }}
          >
            {icon}
          </div>
        </div>

        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            {value}
          </div>
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 pt-1 flex-wrap">
            {trend && (
              <Chip
                size="sm"
                variant="flat"
                color={trend.isPositive ? 'success' : 'danger'}
                startContent={
                  trend.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 shrink-0" />
                  )
                }
                classNames={{
                  base: 'h-5 px-1.5 gap-0.5',
                  content: 'text-[11px] font-semibold tracking-tight',
                }}
              >
                {trend.value}
              </Chip>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {trend?.label || subtitle}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
