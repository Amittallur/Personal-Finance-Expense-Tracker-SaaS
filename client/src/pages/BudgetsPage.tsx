import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Skeleton,
} from '@heroui/react';
import { Plus, Wallet, ChevronLeft, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { budgetApi, categoryApi } from '../api/endpoints';
import { Budget } from '../types';
import { BudgetProgress } from '../components/BudgetProgress';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatMonthYear, CURRENCY_SYMBOLS } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const budgetValidationSchema = Yup.object({
  categoryId: Yup.string().required('Category is required'),
  limit: Yup.number().typeError('Limit must be a number').positive('Limit must be greater than 0').required('Budget limit is required'),
  alertThreshold: Yup.number().min(10).max(100).required('Alert threshold is required'),
});

export const BudgetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₹';

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Fetch expense categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoryApi.getAll('expense'),
  });

  // Fetch budgets for selected month & year
  const { data, isLoading } = useQuery({
    queryKey: ['budgets', selectedMonth, selectedYear],
    queryFn: () => budgetApi.getAll(selectedMonth, selectedYear),
  });

  const createMutation = useMutation({
    mutationFn: budgetApi.create,
    onSuccess: () => {
      showSuccess('Budget created successfully');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to create budget');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { limit?: number; alertThreshold?: number } }) =>
      budgetApi.update(id, data),
    onSuccess: () => {
      showSuccess('Budget updated successfully');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to update budget');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetApi.delete(id),
    onSuccess: () => {
      showSuccess('Budget deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setBudgetToDelete(null);
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to delete budget');
    },
  });

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formik = useFormik({
    initialValues: {
      categoryId: '',
      limit: '',
      alertThreshold: 80,
    },
    validationSchema: budgetValidationSchema,
    onSubmit: (values) => {
      if (budgetToEdit) {
        updateMutation.mutate({
          id: budgetToEdit._id,
          data: {
            limit: parseFloat(values.limit.toString()),
            alertThreshold: values.alertThreshold,
          },
        });
      } else {
        createMutation.mutate({
          categoryId: values.categoryId,
          month: selectedMonth,
          year: selectedYear,
          limit: parseFloat(values.limit.toString()),
          alertThreshold: values.alertThreshold,
        });
      }
    },
  });

  const handleOpenCreate = () => {
    setBudgetToEdit(null);
    formik.resetForm({
      values: {
        categoryId: categories.length > 0 ? categories[0]._id : '',
        limit: '',
        alertThreshold: 80,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setBudgetToEdit(budget);
    formik.resetForm({
      values: {
        categoryId: typeof budget.categoryId === 'object' ? budget.categoryId._id : budget.categoryId,
        limit: budget.limit.toString(),
        alertThreshold: budget.alertThreshold || 80,
      },
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBudgetToEdit(null);
  };

  const { budgets = [], summary } = data || {};
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header with Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Budgets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set and track spending boundaries for {formatMonthYear(selectedMonth, selectedYear)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Picker controls */}
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-3 text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
              {formatMonthYear(selectedMonth, selectedYear)}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            color="primary"
            variant="solid"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleOpenCreate}
            className="font-medium shadow-sm"
          >
            Create Budget
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Budgeted"
          value={formatCurrency(summary?.totalBudgeted, currency)}
          subtitle={`${budgets.length} active categories`}
          icon={<Wallet className="w-4 h-4" />}
          iconColor="#2563EB"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(summary?.totalSpent, currency)}
          subtitle="Current monthly burn"
          icon={<Wallet className="w-4 h-4" />}
          iconColor="#DC2626"
        />
        <StatCard
          title="Remaining Budget"
          value={formatCurrency(summary?.remainingBudget, currency)}
          subtitle="Safe unspent limit"
          icon={<Wallet className="w-4 h-4" />}
          iconColor="#16A34A"
        />
        <StatCard
          title="Overall Utilization"
          value={`${summary?.overallPercentage || 0}%`}
          subtitle={
            (summary?.overallPercentage || 0) > 100
              ? 'Exceeded monthly budget'
              : (summary?.overallPercentage || 0) > 80
              ? 'Near overall limit'
              : 'Within healthy limit'
          }
          trend={{
            value: `${summary?.overallPercentage || 0}%`,
            isPositive: (summary?.overallPercentage || 0) <= 80,
          }}
          icon={<Calendar className="w-4 h-4" />}
          iconColor="#8B5CF6"
        />
      </div>

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          title={`No Budgets for ${formatMonthYear(selectedMonth, selectedYear)}`}
          description="Create spending limits for groceries, rent, dining, and shopping to maintain financial control."
          actionText="Create Monthly Budget"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <BudgetProgress
              key={b._id}
              budget={b}
              currency={currency}
              onEdit={handleOpenEdit}
              onDelete={(del) => setBudgetToDelete(del)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={(isOpen) => !isOpen && handleCloseModal()}
        size="sm"
        classNames={{
          base: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
          header: 'border-b border-slate-100 dark:border-slate-800 pb-3',
          footer: 'border-t border-slate-100 dark:border-slate-800 pt-3',
        }}
      >
        <ModalContent>
          {() => (
            <form onSubmit={formik.handleSubmit}>
              <ModalHeader className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {budgetToEdit ? 'Edit Budget' : 'Set Category Budget'}
              </ModalHeader>

              <ModalBody className="py-4 space-y-4">
                {/* Category Select (disabled on edit) */}
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Category
                  </label>
                  <Select
                    aria-label="Category"
                    isDisabled={Boolean(budgetToEdit)}
                    placeholder="Select category"
                    selectedKeys={formik.values.categoryId ? [formik.values.categoryId] : []}
                    onChange={(e) => formik.setFieldValue('categoryId', e.target.value)}
                    isInvalid={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
                    errorMessage={formik.touched.categoryId && formik.errors.categoryId}
                    variant="bordered"
                    size="md"
                    classNames={{
                      trigger: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  >
                    {categories.map((c) => (
                      <SelectItem key={c._id} textValue={c.name}>
                        <span className="text-xs font-medium">{c.name}</span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Monthly Limit */}
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Monthly Spending Limit
                  </label>
                  <Input
                    autoFocus
                    type="number"
                    id="limit"
                    name="limit"
                    placeholder="0.00"
                    startContent={<span className="text-sm font-semibold text-slate-500">{currencySymbol}</span>}
                    value={formik.values.limit}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.limit && Boolean(formik.errors.limit)}
                    errorMessage={formik.touched.limit && formik.errors.limit}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-base font-medium',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                </div>

                {/* Alert threshold percentage */}
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Warning Alert Threshold (%)
                  </label>
                  <Input
                    type="number"
                    id="alertThreshold"
                    name="alertThreshold"
                    endContent={<span className="text-xs text-slate-400">%</span>}
                    value={formik.values.alertThreshold.toString()}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-xs',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Trigger warning when spending exceeds this percentage (default: 80%)
                  </span>
                </div>
              </ModalBody>

              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="light"
                  size="sm"
                  isDisabled={isSubmitting}
                  onPress={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="font-medium"
                >
                  {budgetToEdit ? 'Save Changes' : 'Create Budget'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(budgetToDelete)}
        title="Delete Budget"
        message={`Are you sure you want to remove the budget for "${budgetToDelete?.categoryId?.name || 'this category'}"?`}
        confirmText="Delete Budget"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (budgetToDelete) {
            deleteMutation.mutate(budgetToDelete._id);
          }
        }}
        onCancel={() => setBudgetToDelete(null)}
      />
    </div>
  );
};
