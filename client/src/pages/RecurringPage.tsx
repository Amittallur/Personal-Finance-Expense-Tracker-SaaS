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
import { Plus, Repeat, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { recurringApi, categoryApi } from '../api/endpoints';
import { RecurringTransaction, FrequencyType } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate, CURRENCY_SYMBOLS } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const recurringSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(100),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  categoryId: Yup.string().required('Category is required'),
  frequency: Yup.string().required('Frequency is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  nextPaymentDate: Yup.string().required('Next payment date is required'),
});

export const RecurringPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₹';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<RecurringTransaction | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RecurringTransaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => recurringApi.getAll(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const { items = [] } = data || {};

  const createMutation = useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => {
      showSuccess('Recurring payment added successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => showError(err.message || 'Failed to create recurring payment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransaction> }) =>
      recurringApi.update(id, data),
    onSuccess: () => {
      showSuccess('Recurring payment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      handleCloseModal();
    },
    onError: (err: any) => showError(err.message || 'Failed to update recurring payment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onSuccess: () => {
      showSuccess('Recurring payment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setItemToDelete(null);
    },
    onError: (err: any) => showError(err.message || 'Failed to delete recurring payment'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      type: 'expense',
      amount: '',
      categoryId: '',
      frequency: 'monthly' as FrequencyType,
      paymentMethod: 'Bank Transfer',
      nextPaymentDate: '',
      notes: '',
    },
    validationSchema: recurringSchema,
    onSubmit: (values) => {
      const payload = {
        name: values.name,
        type: values.type as any,
        amount: parseFloat(values.amount.toString()),
        categoryId: values.categoryId,
        frequency: values.frequency,
        paymentMethod: values.paymentMethod as any,
        nextPaymentDate: values.nextPaymentDate,
        notes: values.notes,
      };

      if (itemToEdit) {
        updateMutation.mutate({ id: itemToEdit._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  const handleOpenCreate = () => {
    setItemToEdit(null);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    formik.resetForm({
      values: {
        name: '',
        type: 'expense',
        amount: '',
        categoryId: categories.length > 0 ? categories[0]._id : '',
        frequency: 'monthly',
        paymentMethod: 'Bank Transfer',
        nextPaymentDate: nextMonth.toISOString().split('T')[0],
        notes: '',
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringTransaction) => {
    setItemToEdit(item);
    formik.resetForm({
      values: {
        name: item.name,
        type: item.type,
        amount: item.amount.toString(),
        categoryId: typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId,
        frequency: item.frequency,
        paymentMethod: item.paymentMethod,
        nextPaymentDate: item.nextPaymentDate ? new Date(item.nextPaymentDate).toISOString().split('T')[0] : '',
        notes: item.notes || '',
      },
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (item: RecurringTransaction) => {
    const nextStatus = item.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({ id: item._id, data: { status: nextStatus } });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Recurring Payments & Bills
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage scheduled payments including rent, EMIs, utilities, and investments
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
          Add Recurring Payment
        </Button>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Recurring Payments Configured"
              description="Keep track of recurring commitments like Rent, Car EMI, or Health Insurance."
              actionText="Add Recurring Payment"
              onAction={handleOpenCreate}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Frequency</th>
                  <th className="px-5 py-3">Next Payment</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {items.map((item) => {
                  const cat = item.categoryId || { name: 'General', color: '#2563EB', icon: 'category' };
                  const isActive = item.status === 'active';

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                        isActive ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${cat.color || '#2563EB'}15`,
                              color: cat.color || '#2563EB',
                            }}
                          >
                            <CategoryIcon iconName={cat.icon} size="small" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                          {item.frequency}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(item.nextPaymentDate)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {item.paymentMethod}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatCurrency(item.amount, currency)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={isActive ? 'success' : 'default'}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(item)}
                          classNames={{ base: 'h-5 px-1.5', content: 'text-[11px] font-semibold' }}
                        >
                          {isActive ? 'Active' : 'Paused'}
                        </Chip>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            aria-label="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
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
        )}
      </div>

      {/* Create / Edit Recurring Modal */}
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
                {itemToEdit ? 'Edit Recurring Payment' : 'New Recurring Payment'}
              </ModalHeader>

              <ModalBody className="py-4 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Payment Name
                  </label>
                  <Input
                    autoFocus
                    id="name"
                    name="name"
                    placeholder="e.g. Indiranagar Rent, Car Loan EMI"
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
                    Amount
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
                      Frequency
                    </label>
                    <Select
                      aria-label="Frequency"
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
                    Next Payment Date
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
                    {['Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Other'].map((pm) => (
                      <SelectItem key={pm} textValue={pm}>
                        <span className="text-xs">{pm}</span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Notes (Optional)
                  </label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Account number, loan reference, or billing info"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-xs',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
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
                  {itemToEdit ? 'Save Changes' : 'Create Recurring Payment'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(itemToDelete)}
        title="Delete Recurring Payment"
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmText="Delete Payment"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete._id);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
