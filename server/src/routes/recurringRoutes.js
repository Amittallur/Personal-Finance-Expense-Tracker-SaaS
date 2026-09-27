const express = require('express');
const {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validatorMiddleware');
const { recurringValidator } = require('../validators/entityValidators');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecurring)
  .post(validate(recurringValidator), createRecurring);

router.route('/:id')
  .put(updateRecurring)
  .delete(deleteRecurring);

module.exports = router;
