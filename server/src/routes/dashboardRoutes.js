const express = require('express');
const {
  getDashboardData,
  getSpendingOverview,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getDashboardData);
router.get('/spending-overview', getSpendingOverview);

module.exports = router;
