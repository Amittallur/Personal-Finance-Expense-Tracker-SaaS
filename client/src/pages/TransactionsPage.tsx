import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Pagination,
  Skeleton,
} from '@heroui/react';
import {
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  UploadCloud,
  ChevronDown,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { transactionApi, categoryApi } from '../api/endpoints';
import { Transaction } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImportModal } from '../components/ImportModal';
import { ExportMenu } from '../components/ExportMenu';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || 'INR';

  const [searchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [type, setType] = useState<string>(searchParams.get('type') || 'all');
  const [categoryId, setCategoryId] = useState<string>(searchParams.get('categoryId') || 'all');
  const [paymentMethod, setPaymentMethod] = useState<string>(searchParams.get('paymentMethod') || 'all');
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const queryParams = {
    page,
    limit: 12,
    search: debouncedSearch.trim() || undefined,
    type: type !== 'all' ? (type as 'income' | 'expense') : undefined,
    categoryId: categoryId !== 'all' ? categoryId : undefined,
    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    sortBy: 'date',
    sortOrder: 'desc' as const,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: () => transactionApi.getAll(queryParams),
  });

  // Delete mutation with interactive Undo
  const deleteMutation = useMutation({
    mutationFn: (tx: Transaction) => transactionApi.delete(tx._id),
    onSuccess: (_, deletedTx) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setTransactionToDelete(null);

      // Show Undo option
      showSuccess(`Deleted transaction (${formatCurrency(deletedTx.amount, currency)})`, {
        label: 'Undo',
        onClick: async () => {
          try {
            const catId = typeof deletedTx.categoryId === 'object' ? (deletedTx.categoryId as any)._id : deletedTx.categoryId;
            await transactionApi.create({
              type: deletedTx.type,
              amount: deletedTx.amount,
              categoryId: catId,
              description: deletedTx.description,
              date: deletedTx.date,
              paymentMethod: deletedTx.paymentMethod,
              notes: deletedTx.notes,
            });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            showSuccess('Transaction restored');
          } catch (e: any) {
            showError('Could not restore transaction');
          }
        },
      });
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to delete transaction');
    },
  });

  const handleClearFilters = () => {
    setSearch('');
    setType('all');
    setCategoryId('all');
    setPaymentMethod('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    type !== 'all' ||
    categoryId !== 'all' ||
    paymentMethod !== 'all' ||
    startDate ||
    endDate ||
    minAmount ||
    maxAmount;

  const { transactions = [], pagination, summary } = data || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive ledger of all recorded income and expenses
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="bordered"
            size="sm"
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            startContent={<UploadCloud className="w-3.5 h-3.5 text-slate-400" />}
            onPress={() => setIsImportModalOpen(true)}
          >
            Import CSV
          </Button>

          <ExportMenu />

          <Button
            color="primary"
            variant="solid"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => {
              setTransactionToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="font-medium shadow-sm"
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="sm:col-span-2 md:col-span-4">
            <Input
              size="sm"
              placeholder="Search description or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search className="w-4 h-4 text-slate-400" />}
              endContent={
                search && (
                  <button type="button" onClick={() => setSearch('')}>
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                  </button>
                )
              }
              variant="bordered"
              classNames={{
                inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800 text-xs',
              }}
            />
          </div>

          {/* Type */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Category */}
          <div className="md:col-span-3">
            <select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by payment method"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* More Filters Toggle */}
          <div className="md:col-span-1">
            <Button
              variant={showAdvancedFilters ? 'flat' : 'bordered'}
              size="sm"
              color={showAdvancedFilters ? 'primary' : 'default'}
              className="w-full text-xs border-slate-200 dark:border-slate-800"
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Collapsible Range Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Min Amount</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="Any"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="light"
                size="sm"
                className="w-full text-xs"
                isDisabled={!hasActiveFilters}
                onPress={handleClearFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Row */}
      {summary && (
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Filtered Income
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-sans">
              +{formatCurrency(summary.totalIncome, currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Filtered Expenses
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">
              -{formatCurrency(summary.totalExpense, currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Net Result
            </div>
            <div
              className={`text-sm font-bold font-sans ${
                summary.netBalance >= 0
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(summary.netBalance, currency)}
            </div>
          </div>
        </div>
      )}

      {/* Main Table / Mobile Cards */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={hasActiveFilters ? 'No Matching Transactions' : 'No Transactions Yet'}
              description={
                hasActiveFilters
                  ? 'Try changing keywords or resetting your active filter constraints.'
                  : 'Start tracking your spending to understand where your money goes.'
              }
              actionText={hasActiveFilters ? 'Clear Filters' : 'Add First Transaction'}
              onAction={
                hasActiveFilters
                  ? handleClearFilters
                  : () => {
                      setTransactionToEdit(null);
                      setIsAddModalOpen(true);
                    }
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile Cards (Hidden on sm and above) */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
              {transactions.map((tx) => {
                const cat = typeof tx.categoryId === 'object' ? tx.categoryId : null;
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx._id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: `${cat?.color || '#2563EB'}15`,
                            color: cat?.color || '#2563EB',
                          }}
                        >
                          <CategoryIcon iconName={cat?.icon} size="small" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                            {cat?.name || 'General'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(tx.date)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-sm font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {tx.description || (isIncome ? 'Income Credit' : 'Expense Debit')}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        {tx.paymentMethod}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTransactionToEdit(tx);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                          aria-label="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionToDelete(tx)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 rounded"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {transactions.map((tx) => {
                    const cat = typeof tx.categoryId === 'object' ? tx.categoryId : null;
                    const isIncome = tx.type === 'income';

                    return (
                      <tr
                        key={tx._id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${cat?.color || '#2563EB'}15`,
                                color: cat?.color || '#2563EB',
                              }}
                            >
                              <CategoryIcon iconName={cat?.icon} size="small" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {cat?.name || 'General'}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="text-slate-800 dark:text-slate-200">
                            {tx.description || (isIncome ? 'Income Credit' : 'Expense Debit')}
                          </div>
                          {tx.notes && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {tx.notes}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                            {tx.paymentMethod}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap font-semibold">
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

                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setTransactionToEdit(tx);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTransactionToDelete(tx)}
                              className="p-1 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <Pagination
                  total={pagination.totalPages}
                  page={page}
                  onChange={(val) => setPage(val)}
                  size="sm"
                  color="primary"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        transactionToEdit={transactionToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(transactionToDelete)}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction for ${formatCurrency(
          transactionToDelete?.amount,
          currency
        )}?`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (transactionToDelete) {
            deleteMutation.mutate(transactionToDelete);
          }
        }}
        onCancel={() => setTransactionToDelete(null)}
      />

      {/* Import Modal */}
      <ImportModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
};
