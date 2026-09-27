const { body, param, query } = require('express-validator');

const createTransactionValidator = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a number greater than 0'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('paymentMethod')
    .isIn(['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'])
    .withMessage('Valid payment method is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const updateTransactionValidator = [
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a number greater than 0'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'])
    .withMessage('Valid payment method is required'),
];

module.exports = {
  createTransactionValidator,
  updateTransactionValidator,
};
