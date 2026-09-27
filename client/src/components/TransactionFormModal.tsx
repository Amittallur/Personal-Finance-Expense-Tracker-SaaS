import React, { useEffect, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionApi, categoryApi } from '../api/endpoints';
import { Category, Transaction, TransactionType, PaymentMethod } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCY_SYMBOLS } from '../utils/formatters';

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  defaultType?: TransactionType;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
];

const validationSchema = Yup.object({
  type: Yup.string().oneOf(['income', 'expense']).required('Type is required'),
  amount: Yup.number()
    .typeError('Amount must be a number')
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
  categoryId: Yup.string().required('Category is required'),
  date: Yup.string().required('Date is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
  description: Yup.string().max(200, 'Description cannot exceed 200 characters'),
  notes: Yup.string().max(500, 'Notes cannot exceed 500 characters'),
});

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  open,
  onClose,
  transactionToEdit,
  defaultType = 'expense',
}) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const currencySymbol = CURRENCY_SYMBOLS[user?.preferences?.currency || 'INR'] || '₹';
  const amountInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: transactionApi.create,
    onSuccess: () => {
      showSuccess('Transaction recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['spending-overview'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to create transaction');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      transactionApi.update(id, data),
    onSuccess: () => {
      showSuccess('Transaction updated successfully');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
    onError: (err: any) => {
      showError(err.message || 'Failed to update transaction');
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const formik = useFormik({
    initialValues: {
      type: defaultType,
      amount: '',
      categoryId: '',
      description: '',
      date: todayStr,
      paymentMethod: 'UPI' as PaymentMethod,
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const payload = {
        type: values.type as TransactionType,
        amount: parseFloat(values.amount.toString()),
        categoryId: values.categoryId,
        description: values.description,
        date: values.date,
        paymentMethod: values.paymentMethod as PaymentMethod,
        notes: values.notes,
      };

      if (transactionToEdit) {
        updateMutation.mutate({ id: transactionToEdit._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  useEffect(() => {
    if (transactionToEdit) {
      const catId =
        typeof transactionToEdit.categoryId === 'object'
          ? (transactionToEdit.categoryId as Category)._id
          : transactionToEdit.categoryId;

      const dateStr = transactionToEdit.date
        ? new Date(transactionToEdit.date).toISOString().split('T')[0]
        : todayStr;

      formik.resetForm({
        values: {
          type: transactionToEdit.type,
          amount: transactionToEdit.amount.toString(),
          categoryId: catId || '',
          description: transactionToEdit.description || '',
          date: dateStr,
          paymentMethod: transactionToEdit.paymentMethod || 'UPI',
          notes: transactionToEdit.notes || '',
        },
      });
    } else {
      formik.resetForm({
        values: {
          type: defaultType,
          amount: '',
          categoryId: '',
          description: '',
          date: todayStr,
          paymentMethod: 'UPI',
          notes: '',
        },
      });
    }
  }, [transactionToEdit, open, defaultType]);

  const filteredCategories = categories.filter((c) => c.type === formik.values.type);

  // Sync category if type changes
  useEffect(() => {
    if (formik.values.categoryId && filteredCategories.length > 0) {
      const match = filteredCategories.find((c) => c._id === formik.values.categoryId);
      if (!match) {
        formik.setFieldValue('categoryId', filteredCategories[0]._id);
      }
    } else if (!formik.values.categoryId && filteredCategories.length > 0) {
      formik.setFieldValue('categoryId', filteredCategories[0]._id);
    }
  }, [formik.values.type, categories]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      size="md"
      placement="center"
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
              {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
            </ModalHeader>

            <ModalBody className="py-4 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('type', 'expense')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${formik.values.type === 'expense'
                      ? 'bg-white dark:bg-[#172033] text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('type', 'income')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${formik.values.type === 'income'
                      ? 'bg-white dark:bg-[#172033] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  Income
                </button>
              </div>

              {/* Amount Input with AutoFocus */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Amount
                </label>
                <Input
                  ref={amountInputRef}
                  autoFocus
                  type="number"
                  step="any"
                  id="amount"
                  name="amount"
                  placeholder="0.00"
                  startContent={
                    <span className="text-sm font-semibold text-slate-500">
                      {currencySymbol}
                    </span>
                  }
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

              {/* Category Select */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Category
                </label>
                <Select
                  id="categoryId"
                  name="categoryId"
                  aria-label="Category"
                  placeholder="Select a category"
                  selectedKeys={formik.values.categoryId ? [formik.values.categoryId] : []}
                  onChange={(e) => formik.setFieldValue('categoryId', e.target.value)}
                  isInvalid={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
                  errorMessage={formik.touched.categoryId && formik.errors.categoryId}
                  variant="bordered"
                  size="md"
                  isLoading={isLoadingCategories}
                  classNames={{
                    trigger: 'rounded-xl border-slate-200 dark:border-slate-800',
                  }}
                >
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat._id} textValue={cat.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: `${cat.color || '#2563EB'}20`,
                            color: cat.color || '#2563EB',
                          }}
                        >
                          <CategoryIcon iconName={cat.icon} size={13} />
                        </div>
                        <span className="text-xs font-medium">{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Description
                </label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g. Swiggy dinner, Uber ride, Client payout"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.description && Boolean(formik.errors.description)}
                  errorMessage={formik.touched.description && formik.errors.description}
                  variant="bordered"
                  size="md"
                  classNames={{
                    input: 'text-xs',
                    inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                  }}
                />
              </div>

              {/* Date and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formik.values.date}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.date && Boolean(formik.errors.date)}
                    errorMessage={formik.touched.date && formik.errors.date}
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
                    id="paymentMethod"
                    name="paymentMethod"
                    aria-label="Payment Method"
                    selectedKeys={[formik.values.paymentMethod]}
                    onChange={(e) => formik.setFieldValue('paymentMethod', e.target.value)}
                    isInvalid={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                    errorMessage={formik.touched.paymentMethod && formik.errors.paymentMethod}
                    variant="bordered"
                    size="md"
                    classNames={{
                      trigger: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} textValue={method}>
                        <span className="text-xs">{method}</span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Notes (Optional)
                </label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Extra context, reference number..."
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
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
                isDisabled={isSubmitting}
                onPress={onClose}
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
                {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
};
