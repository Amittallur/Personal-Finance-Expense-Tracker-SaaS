import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm rounded-2xl">
      <CardBody className="py-12 px-6 flex flex-col items-center text-center justify-center">
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4 ring-8 ring-primary-500/5">
            {icon}
          </div>
        )}
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
        {actionText && onAction && (
          <Button
            color="primary"
            variant="solid"
            size="sm"
            startContent={actionIcon}
            onPress={onAction}
            className="font-medium px-4 shadow-sm"
          >
            {actionText}
          </Button>
        )}
      </CardBody>
    </Card>
  );
};
