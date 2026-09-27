import React from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

export const ExportMenu: React.FC = () => {
  const handleAction = (key: React.Key) => {
    if (key === 'csv') {
      window.open('/api/transactions/export/csv', '_blank');
    } else if (key === 'excel') {
      window.open('/api/transactions/export/excel', '_blank');
    }
  };

  return (
    <Dropdown
      classNames={{
        content: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1',
      }}
    >
      <DropdownTrigger>
        <Button
          variant="bordered"
          size="sm"
          className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          startContent={<Download className="w-3.5 h-3.5 text-slate-400" />}
          endContent={<ChevronDown className="w-3 h-3 text-slate-400" />}
        >
          Export
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Export formats"
        onAction={handleAction}
        className="text-xs"
      >
        <DropdownItem
          key="csv"
          startContent={<FileText className="w-4 h-4 text-blue-500" />}
          description="Comma-separated values (.csv)"
          className="rounded-lg py-2"
        >
          Export as CSV
        </DropdownItem>
        <DropdownItem
          key="excel"
          startContent={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
          description="Microsoft Excel Workbook (.xlsx)"
          className="rounded-lg py-2"
        >
          Export as Excel
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
