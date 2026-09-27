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
import { Plus, Edit2, Trash2, AlertTriangle, Layers } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { categoryApi } from '../api/endpoints';
import { Category, TransactionType } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AVAILABLE_ICONS = [
  { label: 'Food / Dining', value: 'fastfood' },
  { label: 'Housing / Rent', value: 'home' },
  { label: 'Transport / Car', value: 'directions_car' },
  { label: 'Shopping', value: 'shopping_bag' },
  { label: 'Entertainment / Movies', value: 'movie' },
  { label: 'Health / Medicine', value: 'health_and_safety' },
  { label: 'Education / Books', value: 'school' },
  { label: 'Bills / Utilities', value: 'receipt' },
  { label: 'Travel / Flights', value: 'flight' },
  { label: 'Salary / Income', value: 'payments' },
  { label: 'Freelance / Work', value: 'work' },
  { label: 'Investment / Stocks', value: 'trending_up' },
  { label: 'Business', value: 'business' },
  { label: 'Subscriptions / SaaS', value: 'subscriptions' },
  { label: 'Fitness / Gym', value: 'fitness' },
  { label: 'Other', value: 'more_horiz' },
];

const PRESET_COLORS = [
  '#2563EB',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#64748B',
];

const categorySchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(50),
  type: Yup.string().oneOf(['expense', 'income']).required('Type is required'),
  icon: Yup.string().required('Icon is required'),
  color: Yup.string().required('Color is required'),
});

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || 'INR';

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // Deletion & Reassignment state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  // Mutations
  const createMutation = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      showSuccess('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (err: any) => showError(err.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoryApi.update(id, data),
    onSuccess: () => {
      showSuccess('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (err: any) => showError(err.message || 'Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      categoryApi.delete(id, reassignTo),
    onSuccess: () => {
      showSuccess('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setCategoryToDelete(null);
      setReassignTargetId('');
    },
    onError: (err: any) => showError(err.message || 'Failed to delete category'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      type: 'expense' as TransactionType,
      icon: 'fastfood',
      color: '#2563EB',
    },
    validationSchema: categorySchema,
    onSubmit: (values) => {
      if (categoryToEdit) {
        updateMutation.mutate({
          id: categoryToEdit._id,
          data: {
            name: values.name,
            type: values.type,
            icon: values.icon,
            color: values.color,
          },
        });
      } else {
        createMutation.mutate({
          name: values.name,
          type: values.type,
          icon: values.icon,
          color: values.color,
        });
      }
    },
  });

  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    formik.resetForm({
      values: {
        name: '',
        type: activeTab,
        icon: activeTab === 'expense' ? 'fastfood' : 'payments',
        color: activeTab === 'expense' ? '#F59E0B' : '#10B981',
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setCategoryToEdit(cat);
    formik.resetForm({
      values: {
        name: cat.name,
        type: cat.type,
        icon: cat.icon || 'category',
        color: cat.color || '#2563EB',
      },
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryToEdit(null);
  };

  const handleDeleteClick = (cat: Category) => {
    setCategoryToDelete(cat);
    const potentialTargets = categories.filter((c) => c._id !== cat._id && c.type === cat.type);
    if (potentialTargets.length > 0) {
      setReassignTargetId(potentialTargets[0]._id);
    }
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    const hasTx = (categoryToDelete.transactionCount || 0) > 0;
    deleteMutation.mutate({
      id: categoryToDelete._id,
      reassignTo: hasTx ? reassignTargetId : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Customize income and expense classifications, icons, and colors
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
          New Category
        </Button>
      </div>

      {/* Type Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'expense'
              ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Expense Categories ({categories.filter((c) => c.type === 'expense').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'income'
              ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Income Categories ({categories.filter((c) => c.type === 'income').length})
        </button>
      </div>

      {/* Category Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} Categories`}
          description={`Create custom ${activeTab} categories to organize your financial transactions.`}
          actionText="Add Category"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}18`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon iconName={cat.icon} size="medium" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {cat.transactionCount || 0} transactions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(cat)}
                      className="p-1 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <span className="text-slate-400">Total Volume:</span>
                <span className={`font-semibold ${cat.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {formatCurrency(cat.totalSpentOrEarned || 0, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Category Modal */}
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
                {categoryToEdit ? 'Edit Category' : 'Create Category'}
              </ModalHeader>

              <ModalBody className="py-4 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Category Name
                  </label>
                  <Input
                    autoFocus
                    id="name"
                    name="name"
                    placeholder="e.g. Groceries, Investment, Software"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Type
                    </label>
                    <Select
                      aria-label="Category Type"
                      selectedKeys={[formik.values.type]}
                      onChange={(e) => formik.setFieldValue('type', e.target.value)}
                      variant="bordered"
                      size="md"
                      classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                    >
                      <SelectItem key="expense" textValue="Expense"><span className="text-xs">Expense</span></SelectItem>
                      <SelectItem key="income" textValue="Income"><span className="text-xs">Income</span></SelectItem>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Icon
                    </label>
                    <Select
                      aria-label="Icon"
                      selectedKeys={[formik.values.icon]}
                      onChange={(e) => formik.setFieldValue('icon', e.target.value)}
                      variant="bordered"
                      size="md"
                      classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                    >
                      {AVAILABLE_ICONS.map((ico) => (
                        <SelectItem key={ico.value} textValue={ico.label}>
                          <div className="flex items-center gap-1.5 text-xs">
                            <CategoryIcon iconName={ico.value} size="small" />
                            <span>{ico.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Preset Colors */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => formik.setFieldValue('color', col)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formik.values.color === col
                            ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: col }}
                        aria-label={`Select color ${col}`}
                      />
                    ))}
                  </div>
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
                  {categoryToEdit ? 'Save Changes' : 'Create Category'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete / Reassign Safety Modal */}
      <Modal
        isOpen={Boolean(categoryToDelete)}
        onOpenChange={(isOpen) => !isOpen && setCategoryToDelete(null)}
        size="sm"
        classNames={{
          base: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
          header: 'border-b border-slate-100 dark:border-slate-800 pb-3',
          footer: 'border-t border-slate-100 dark:border-slate-800 pt-3',
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Delete Category "{categoryToDelete?.name}"
              </ModalHeader>
              <ModalBody className="py-4 space-y-3">
                {(categoryToDelete?.transactionCount || 0) > 0 ? (
                  <>
                    <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        This category has <strong>{categoryToDelete?.transactionCount} existing transaction(s)</strong>.
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      To preserve financial integrity, please choose a replacement category to migrate these transactions to:
                    </p>
                    <Select
                      aria-label="Reassign Transactions"
                      selectedKeys={reassignTargetId ? [reassignTargetId] : []}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      variant="bordered"
                      size="sm"
                      classNames={{ trigger: 'rounded-xl border-slate-200 dark:border-slate-800' }}
                    >
                      {categories
                        .filter((c) => c._id !== categoryToDelete?._id && c.type === categoryToDelete?.type)
                        .map((target) => (
                          <SelectItem key={target._id} textValue={target.name}>
                            <span className="text-xs">{target.name}</span>
                          </SelectItem>
                        ))}
                    </Select>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to delete this category? There are no transactions linked to it.
                  </p>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="light"
                  size="sm"
                  onPress={() => setCategoryToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  isLoading={deleteMutation.isPending}
                  isDisabled={(categoryToDelete?.transactionCount || 0) > 0 && !reassignTargetId}
                  onPress={handleConfirmDelete}
                >
                  Confirm & Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
