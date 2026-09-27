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
  Chip,
  Skeleton,
} from '@heroui/react';
import {
  Plus,
  Tv,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { recurringApi, categoryApi } from '../api/endpoints';
import { RecurringTransaction, FrequencyType } from '../types';
import { StatCard } from '../components/StatCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate, CURRENCY_SYMBOLS } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const subSchema = Yup.object({
  name: Yup.string().trim().required('Service name is required').max(100),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  categoryId: Yup.string().required('Category is required'),
  frequency: Yup.string().required('Billing cycle is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  nextPaymentDate: Yup.string().required('Next renewal date is required'),
});

export const SubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₹';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState<RecurringTransaction | null>(null);
  const [subToDelete, setSubToDelete] = useState<RecurringTransaction | null>(null);

  // Fetch subscriptions
  const { data, isLoading } = useQuery({
    queryKey: ['recurring', { isSubscription: true }],
    queryFn: () => recurringApi.getAll({ isSubscription: true }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => categoryApi.getAll('expense'),
  });

  const { items: subscriptions = [], summary } = data || {};

  // Mutations
  const createMutation = useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => {
      showSuccess('Subscription added successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => showError(err.message || 'Failed to create subscription'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransaction> }) =>
      recurringApi.update(id, data),
    onSuccess: () => {
      showSuccess('Subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => showError(err.message || 'Failed to update subscription'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onSuccess: () => {
      showSuccess('Subscription removed successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSubToDelete(null);
    },
    onError: (err: any) => showError(err.message || 'Failed to delete subscription'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      amount: '',
      categoryId: '',
      frequency: 'monthly' as FrequencyType,
      paymentMethod: 'Credit Card',
      nextPaymentDate: '',
      notes: '',
    },
    validationSchema: subSchema,
    onSubmit: (values) => {
      const payload = {
        name: values.name,
        amount: parseFloat(values.amount.toString()),
        categoryId: values.categoryId,
        frequency: values.frequency,
        paymentMethod: values.paymentMethod as any,
        nextPaymentDate: values.nextPaymentDate,
        notes: values.notes,
        isSubscription: true,
        type: 'expense' as const,
      };

      if (subToEdit) {
        updateMutation.mutate({ id: subToEdit._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  const handleOpenCreate = () => {
    setSubToEdit(null);
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    formik.resetForm({
      values: {
        name: '',
        amount: '',
        categoryId: categories.length > 0 ? categories[0]._id : '',
        frequency: 'monthly',
        paymentMethod: 'Credit Card',
        nextPaymentDate: nextMonthDate.toISOString().split('T')[0],
        notes: '',
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: RecurringTransaction) => {
    setSubToEdit(sub);
    formik.resetForm({
      values: {
        name: sub.name,
        amount: sub.amount.toString(),
        categoryId: typeof sub.categoryId === 'object' ? sub.categoryId._id : sub.categoryId,
        frequency: sub.frequency,
        paymentMethod: sub.paymentMethod || 'Credit Card',
        nextPaymentDate: sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toISOString().split('T')[0] : '',
        notes: sub.notes || '',
      },
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (sub: RecurringTransaction) => {
    const nextStatus = sub.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({ id: sub._id, data: { status: nextStatus } });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor SaaS, streaming, cloud services, and recurring memberships
          </p>
        </div>

        <Button
          color="primary"
          variant="solid"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleOpenCreate}
          className="font-medium shadow-sm"
        >
          Add Subscription
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Subscription Burn"
          value={formatCurrency(summary?.totalMonthlyCost, currency)}
          subtitle="Normalized to 30 days"
          icon={<Tv className="w-4 h-4" />}
          iconColor="#2563EB"
        />
        <StatCard
          title="Yearly Subscription Cost"
          value={formatCurrency(summary?.totalYearlyCost, currency)}
          subtitle="Projected 12-month total"
          icon={<DollarSign className="w-4 h-4" />}
          iconColor="#DC2626"
        />
        <StatCard
          title="Active Subscriptions"
          value={`${summary?.activeCount || 0}`}
          subtitle={`Out of ${summary?.totalCount || 0} configured`}
          icon={<CreditCard className="w-4 h-4" />}
          iconColor="#16A34A"
        />
      </div>

      {/* Subscriptions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          title="No Subscriptions Tracked"
          description="Track recurring digital services like Netflix, Spotify, AWS, or Gym to control recurring monthly fees."
          actionText="Add First Subscription"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const cat = sub.categoryId || { name: 'Subscriptions', color: '#2563EB', icon: 'subscriptions' };
            const isActive = sub.status === 'active';

            return (
              <div
                key={sub._id}
                className={`p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat.color || '#2563EB'}18`,
                          color: cat.color || '#2563EB',
                        }}
                      >
                        <CategoryIcon iconName={cat.icon || 'subscriptions'} size="small" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {sub.name}
                        </h4>
                        <span className="text-xs text-slate-400">{cat.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubToDelete(sub)}
                        className="p-1 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-50 font-sans">
                      {formatCurrency(sub.amount, currency)}
                    </span>
                    <span className="text-xs text-slate-400">/{sub.frequency}</span>
                  </div>

                  {/* Normalized Costs */}
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs flex justify-between text-slate-500 dark:text-slate-400 my-3">
                    <span>
                      Monthly: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(sub.normalizedMonthly, currency)}</strong>
                    </span>
                    <span>
                      Yearly: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(sub.normalizedYearly, currency)}</strong>
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Renews {formatDate(sub.nextPaymentDate)}</span>
                  </div>

                  <Chip
                    size="sm"
                    variant="flat"
                    color={isActive ? 'success' : 'default'}
                    className="cursor-pointer"
                    onClick={() => handleToggleStatus(sub)}
                    classNames={{ base: 'h-5 px-1.5', content: 'text-[11px] font-semibold' }}
                  >
                    {isActive ? 'Active' : 'Paused'}
                  </Chip>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Subscription Modal */}
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
                {subToEdit ? 'Edit Subscription' : 'Add Subscription'}
              </ModalHeader>

              <ModalBody className="py-4 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Subscription / Service Name
                  </label>
                  <Input
                    autoFocus
                    id="name"
                    name="name"
                    placeholder="e.g. Netflix, Spotify, AWS, Gym"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.name && Boolean(formik.errors.name)}
                    errorMessage={formik.touched.name && formik.errors.name}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-xs',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Subscription Fee
                  </label>
                  <Input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="0.00"
                    startContent={<span className="text-sm font-semibold text-slate-500">{currencySymbol}</span>}
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.amount && Boolean(formik.errors.amount)}
                    errorMessage={formik.touched.amount && formik.errors.amount}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-base font-medium',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Billing Cycle
                    </label>
                    <Select
                      aria-label="Billing Frequency"
                      selectedKeys={[formik.values.frequency]}
                      onChange={(e) => formik.setFieldValue('frequency', e.target.value)}
                      variant="bordered"
                      size="md"
                      classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                    >
                      <SelectItem key="monthly" textValue="Monthly"><span className="text-xs">Monthly</span></SelectItem>
                      <SelectItem key="yearly" textValue="Yearly"><span className="text-xs">Yearly</span></SelectItem>
                      <SelectItem key="quarterly" textValue="Quarterly"><span className="text-xs">Quarterly</span></SelectItem>
                      <SelectItem key="weekly" textValue="Weekly"><span className="text-xs">Weekly</span></SelectItem>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Category
                    </label>
                    <Select
                      aria-label="Category"
                      selectedKeys={formik.values.categoryId ? [formik.values.categoryId] : []}
                      onChange={(e) => formik.setFieldValue('categoryId', e.target.value)}
                      variant="bordered"
                      size="md"
                      classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                    >
                      {categories.map((c) => (
                        <SelectItem key={c._id} textValue={c.name}>
                          <span className="text-xs">{c.name}</span>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Next Renewal Date
                  </label>
                  <Input
                    type="date"
                    id="nextPaymentDate"
                    name="nextPaymentDate"
                    value={formik.values.nextPaymentDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.nextPaymentDate && Boolean(formik.errors.nextPaymentDate)}
                    errorMessage={formik.touched.nextPaymentDate && formik.errors.nextPaymentDate}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-xs',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Payment Method
                  </label>
                  <Select
                    aria-label="Payment Method"
                    selectedKeys={[formik.values.paymentMethod]}
                    onChange={(e) => formik.setFieldValue('paymentMethod', e.target.value)}
                    variant="bordered"
                    size="md"
                    classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                  >
                    {['Credit Card', 'UPI', 'Debit Card', 'Bank Transfer', 'Other'].map((pm) => (
                      <SelectItem key={pm} textValue={pm}>
                        <span className="text-xs">{pm}</span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>

              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="light"
                  size="sm"
                  onPress={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="sm"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  className="font-medium"
                >
                  {subToEdit ? 'Save Changes' : 'Track Subscription'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(subToDelete)}
        title="Delete Subscription"
        message={`Are you sure you want to delete "${subToDelete?.name}"?`}
        confirmText="Delete Subscription"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (subToDelete) {
            deleteMutation.mutate(subToDelete._id);
          }
        }}
        onCancel={() => setSubToDelete(null)}
      />
    </div>
  );
};
