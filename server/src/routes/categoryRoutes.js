const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validatorMiddleware');
const { categoryValidator } = require('../validators/entityValidators');

const router = express.Router();

router.use(protect); // All category routes protected

router.route('/')
  .get(getCategories)
  .post(validate(categoryValidator), createCategory);

router.route('/:id')
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
