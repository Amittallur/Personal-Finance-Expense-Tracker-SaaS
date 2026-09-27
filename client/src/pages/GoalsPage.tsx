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
import { Plus, Target, CheckCircle2, Flag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { goalApi } from '../api/endpoints';
import { Goal } from '../types';
import { GoalCard } from '../components/GoalCard';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, CURRENCY_SYMBOLS } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GOAL_CATEGORIES = ['Gadgets', 'Security', 'Travel', 'Vehicle', 'Education', 'Home', 'Investment', 'General'];
const GOAL_COLORS = ['#2563EB', '#10B981', '#EC4899', '#3B82F6', '#F59E0B', '#8B5CF6', '#14B8A6'];

const goalValidationSchema = Yup.object({
  name: Yup.string().trim().required('Goal name is required').max(100),
  targetAmount: Yup.number().typeError('Must be a number').positive('Target must be greater than 0').required('Target amount is required'),
  savedAmount: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
  deadline: Yup.string().required('Deadline date is required'),
  category: Yup.string().required('Category is required'),
  color: Yup.string().required('Color is required'),
});

const contribValidationSchema = Yup.object({
  amount: Yup.number().typeError('Must be a number').positive('Contribution must be greater than 0').required('Amount is required'),
  notes: Yup.string().max(200, 'Notes too long'),
  date: Yup.string().required('Date is required'),
});

export const GoalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const currency = user?.preferences?.currency || 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '₹';

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalApi.getAll,
  });

  const { goals = [], summary } = data || {};

  // Mutations
  const createMutation = useMutation({
    mutationFn: goalApi.create,
    onSuccess: () => {
      showSuccess('Savings goal created successfully');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsGoalModalOpen(false);
    },
    onError: (err: any) => showError(err.message || 'Failed to create goal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) => goalApi.update(id, data),
    onSuccess: () => {
      showSuccess('Goal updated successfully');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsGoalModalOpen(false);
      setActiveGoal(null);
    },
    onError: (err: any) => showError(err.message || 'Failed to update goal'),
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; notes?: string; date?: string } }) =>
      goalApi.contribute(id, data),
    onSuccess: (res: any) => {
      showSuccess(res.message || 'Contribution added successfully');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsContribModalOpen(false);
      setActiveGoal(null);
    },
    onError: (err: any) => showError(err.message || 'Failed to add contribution'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalApi.delete(id),
    onSuccess: () => {
      showSuccess('Goal deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalToDelete(null);
    },
    onError: (err: any) => showError(err.message || 'Failed to delete goal'),
  });

  // Goal Formik
  const goalFormik = useFormik({
    initialValues: {
      name: '',
      targetAmount: '',
      savedAmount: '0',
      deadline: '',
      category: 'General',
      color: '#2563EB',
    },
    validationSchema: goalValidationSchema,
    onSubmit: (values) => {
      const payload = {
        name: values.name,
        targetAmount: parseFloat(values.targetAmount.toString()),
        savedAmount: parseFloat(values.savedAmount.toString()) || 0,
        deadline: values.deadline,
        category: values.category,
        color: values.color,
      };

      if (activeGoal) {
        updateMutation.mutate({ id: activeGoal._id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  // Contribution Formik
  const contribFormik = useFormik({
    initialValues: {
      amount: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    },
    validationSchema: contribValidationSchema,
    onSubmit: (values) => {
      if (!activeGoal) return;
      contributeMutation.mutate({
        id: activeGoal._id,
        data: {
          amount: parseFloat(values.amount.toString()),
          notes: values.notes,
          date: values.date,
        },
      });
    },
  });

  const handleOpenCreate = () => {
    setActiveGoal(null);
    goalFormik.resetForm({
      values: {
        name: '',
        targetAmount: '',
        savedAmount: '0',
        deadline: '',
        category: 'General',
        color: '#2563EB',
      },
    });
    setIsGoalModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setActiveGoal(goal);
    goalFormik.resetForm({
      values: {
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        savedAmount: goal.savedAmount.toString(),
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
        category: goal.category || 'General',
        color: goal.color || '#2563EB',
      },
    });
    setIsGoalModalOpen(true);
  };

  const handleOpenContribute = (goal: Goal) => {
    setActiveGoal(goal);
    contribFormik.resetForm({
      values: {
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      },
    });
    setIsContribModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Savings Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Plan, fund, and forecast your major purchases and financial milestones
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
          Create Goal
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Target"
          value={formatCurrency(summary?.totalTarget, currency)}
          subtitle={`${summary?.totalGoals || 0} active milestones`}
          icon={<Flag className="w-4 h-4" />}
          iconColor="#2563EB"
        />
        <StatCard
          title="Total Saved"
          value={formatCurrency(summary?.totalSaved, currency)}
          subtitle="Accumulated savings"
          icon={<Target className="w-4 h-4" />}
          iconColor="#16A34A"
        />
        <StatCard
          title="Overall Progress"
          value={`${summary?.overallPercentage || 0}%`}
          subtitle="Total portfolio funding"
          trend={{
            value: `${summary?.overallPercentage || 0}%`,
            isPositive: (summary?.overallPercentage || 0) >= 50,
          }}
          icon={<Target className="w-4 h-4" />}
          iconColor="#0EA5E9"
        />
        <StatCard
          title="Completed Goals"
          value={`${summary?.completedGoals || 0}`}
          subtitle="Targets achieved"
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="#8B5CF6"
        />
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="No Savings Goals Yet"
          description="Create your first financial target—such as a New Laptop, Emergency Fund, or Vacation."
          actionText="Create First Goal"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <GoalCard
              key={g._id}
              goal={g}
              currency={currency}
              onContribute={handleOpenContribute}
              onEdit={handleOpenEdit}
              onDelete={(del) => setGoalToDelete(del)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onOpenChange={(isOpen) => !isOpen && setIsGoalModalOpen(false)}
        size="sm"
        classNames={{
          base: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
          header: 'border-b border-slate-100 dark:border-slate-800 pb-3',
          footer: 'border-t border-slate-100 dark:border-slate-800 pt-3',
        }}
      >
        <ModalContent>
          {() => (
            <form onSubmit={goalFormik.handleSubmit}>
              <ModalHeader className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {activeGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </ModalHeader>

              <ModalBody className="py-4 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Goal Name
                  </label>
                  <Input
                    autoFocus
                    id="name"
                    name="name"
                    placeholder="e.g. MacBook Pro, Emergency Fund"
                    value={goalFormik.values.name}
                    onChange={goalFormik.handleChange}
                    onBlur={goalFormik.handleBlur}
                    isInvalid={goalFormik.touched.name && Boolean(goalFormik.errors.name)}
                    errorMessage={goalFormik.touched.name && goalFormik.errors.name}
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
                    Target Amount
                  </label>
                  <Input
                    type="number"
                    id="targetAmount"
                    name="targetAmount"
                    placeholder="0.00"
                    startContent={<span className="text-sm font-semibold text-slate-500">{currencySymbol}</span>}
                    value={goalFormik.values.targetAmount}
                    onChange={goalFormik.handleChange}
                    onBlur={goalFormik.handleBlur}
                    isInvalid={goalFormik.touched.targetAmount && Boolean(goalFormik.errors.targetAmount)}
                    errorMessage={goalFormik.touched.targetAmount && goalFormik.errors.targetAmount}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-base font-medium',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                </div>

                {!activeGoal && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Initial Deposit (Optional)
                    </label>
                    <Input
                      type="number"
                      id="savedAmount"
                      name="savedAmount"
                      placeholder="0.00"
                      startContent={<span className="text-sm font-semibold text-slate-500">{currencySymbol}</span>}
                      value={goalFormik.values.savedAmount}
                      onChange={goalFormik.handleChange}
                      onBlur={goalFormik.handleBlur}
                      variant="bordered"
                      size="md"
                      classNames={{
                        input: 'text-xs',
                        inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Target Deadline
                  </label>
                  <Input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={goalFormik.values.deadline}
                    onChange={goalFormik.handleChange}
                    onBlur={goalFormik.handleBlur}
                    isInvalid={goalFormik.touched.deadline && Boolean(goalFormik.errors.deadline)}
                    errorMessage={goalFormik.touched.deadline && goalFormik.errors.deadline}
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
                    Category
                  </label>
                  <Select
                    aria-label="Category"
                    selectedKeys={[goalFormik.values.category]}
                    onChange={(e) => goalFormik.setFieldValue('category', e.target.value)}
                    variant="bordered"
                    size="md"
                    classNames={{
                      trigger: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} textValue={cat}>
                        <span className="text-xs">{cat}</span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>

              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="light"
                  size="sm"
                  onPress={() => setIsGoalModalOpen(false)}
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
                  {activeGoal ? 'Save Changes' : 'Create Goal'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal
        isOpen={isContribModalOpen}
        onOpenChange={(isOpen) => !isOpen && setIsContribModalOpen(false)}
        size="sm"
        classNames={{
          base: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
          header: 'border-b border-slate-100 dark:border-slate-800 pb-3',
          footer: 'border-t border-slate-100 dark:border-slate-800 pt-3',
        }}
      >
        <ModalContent>
          {() => (
            <form onSubmit={contribFormik.handleSubmit}>
              <ModalHeader className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Deposit to "{activeGoal?.name}"
              </ModalHeader>

              <ModalBody className="py-4 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Deposit Amount
                  </label>
                  <Input
                    autoFocus
                    type="number"
                    id="contribAmount"
                    name="amount"
                    placeholder="0.00"
                    startContent={<span className="text-sm font-semibold text-slate-500">{currencySymbol}</span>}
                    value={contribFormik.values.amount}
                    onChange={contribFormik.handleChange}
                    onBlur={contribFormik.handleBlur}
                    isInvalid={contribFormik.touched.amount && Boolean(contribFormik.errors.amount)}
                    errorMessage={contribFormik.touched.amount && contribFormik.errors.amount}
                    variant="bordered"
                    size="md"
                    classNames={{
                      input: 'text-base font-medium',
                      inputWrapper: 'rounded-xl border-slate-200 dark:border-slate-800',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    id="contribDate"
                    name="date"
                    value={contribFormik.values.date}
                    onChange={contribFormik.handleChange}
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
                    Notes (Optional)
                  </label>
                  <Input
                    id="contribNotes"
                    name="notes"
                    placeholder="e.g. Freelance bonus, savings transfer"
                    value={contribFormik.values.notes}
                    onChange={contribFormik.handleChange}
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
                  onPress={() => setIsContribModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  size="sm"
                  isLoading={contributeMutation.isPending}
                  className="font-medium"
                >
                  Deposit Funds
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Goal Confirmation */}
      <ConfirmDialog
        open={Boolean(goalToDelete)}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete the goal "${goalToDelete?.name}"? All saved progress and contributions will be removed.`}
        confirmText="Delete Goal"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (goalToDelete) {
            deleteMutation.mutate(goalToDelete._id);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
