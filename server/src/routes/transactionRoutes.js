const express = require('express');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const {
  upload,
  exportCSV,
  exportExcel,
  previewImportCSV,
  confirmImportCSV,
} = require('../controllers/exportImportController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validatorMiddleware');
const {
  createTransactionValidator,
  updateTransactionValidator,
} = require('../validators/transactionValidator');

const router = express.Router();

router.use(protect); // All transaction routes protected

// Export & Import routes
router.get('/export/csv', exportCSV);
router.get('/export/excel', exportExcel);
router.post('/import/preview', upload.single('file'), previewImportCSV);
router.post('/import/confirm', confirmImportCSV);

// Standard CRUD
router.route('/')
  .get(getTransactions)
  .post(validate(createTransactionValidator), createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .put(validate(updateTransactionValidator), updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
