const express = require('express');
const {
  getGoals,
  createGoal,
  updateGoal,
  addContribution,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validatorMiddleware');
const { goalValidator, contributionValidator } = require('../validators/entityValidators');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGoals)
  .post(validate(goalValidator), createGoal);

router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

router.post('/:id/contribute', validate(contributionValidator), addContribution);

module.exports = router;
