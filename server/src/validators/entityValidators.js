const { body, param } = require('express-validator');

// Category validators
const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 50 }),
  body('type').isIn(['income', 'expense']).withMessage('Category type must be income or expense'),
  body('icon').optional().trim(),
  body('color').optional().trim(),
];

// Budget validators
const budgetValidator = [
  body('categoryId').isMongoId().withMessage('Valid category ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
  body('limit').isFloat({ min: 1 }).withMessage('Budget limit must be at least 1'),
  body('alertThreshold').optional().isInt({ min: 10, max: 100 }),
];

// Goal validators
const goalValidator = [
  body('name').trim().notEmpty().withMessage('Goal name is required').isLength({ max: 100 }),
  body('targetAmount').isFloat({ min: 1 }).withMessage('Target amount must be at least 1'),
  body('savedAmount').optional().isFloat({ min: 0 }).withMessage('Saved amount cannot be negative'),
  body('deadline').isISO8601().withMessage('Valid deadline date is required'),
  body('category').optional().trim(),
  body('color').optional().trim(),
];

const contributionValidator = [
  param('id').isMongoId().withMessage('Invalid goal ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Contribution amount must be greater than 0'),
  body('notes').optional().trim().isLength({ max: 200 }),
  body('date').optional().isISO8601(),
];

// Recurring validators
const recurringValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('type').optional().isIn(['expense', 'income']),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('categoryId').isMongoId().withMessage('Valid category ID is required'),
  body('frequency')
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Frequency must be daily, weekly, monthly, quarterly, or yearly'),
  body('isSubscription').optional().isBoolean(),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other']),
  body('startDate').optional().isISO8601(),
  body('nextPaymentDate').isISO8601().withMessage('Valid next payment date is required'),
  body('status').optional().isIn(['active', 'paused', 'cancelled']),
];

module.exports = {
  categoryValidator,
  budgetValidator,
  goalValidator,
  contributionValidator,
  recurringValidator,
};
