const express = require('express');
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validatorMiddleware');
const { budgetValidator } = require('../validators/entityValidators');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(validate(budgetValidator), createBudget);

router.route('/:id')
  .put(updateBudget)
  .delete(deleteBudget);

module.exports = router;
