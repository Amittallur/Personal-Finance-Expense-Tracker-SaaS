const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 60 }),
  body('preferences.currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'AED']),
  body('preferences.theme').optional().isIn(['light', 'dark', 'system']),
  body('preferences.dateFormat').optional().isIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
};
