const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const RecurringTransaction = require('../models/RecurringTransaction');
const Category = require('../models/Category');
const { generateInsights } = require('../services/insightsService');

// @desc    Get complete main dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const startCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const [
      allTimeTotals,
      currentMonthTotals,
      recentTransactions,
      budgets,
      upcomingRecurring,
      categoryExpenses,
      insights,
    ] = await Promise.all([
      // All time totals
      Transaction.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),

      // Current month totals
      Transaction.aggregate([
        { $match: { userId, date: { $gte: startCurrentMonth, $lte: endCurrentMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),

      // Latest 10 transactions
      Transaction.find({ userId })
        .populate('categoryId', 'name icon color type')
        .sort({ date: -1 })
        .limit(10),

      // Current monthly budgets
      Budget.find({
        userId,
        month: currentMonth + 1,
        year: currentYear,
      }).populate('categoryId', 'name icon color type'),

      // Upcoming recurring payments
      RecurringTransaction.find({
        userId,
        status: 'active',
        nextPaymentDate: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
      })
        .populate('categoryId', 'name icon color')
        .sort({ nextPaymentDate: 1 })
        .limit(5),

      // Current month category breakdown
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: startCurrentMonth, $lte: endCurrentMonth } } },
        {
          $group: {
            _id: '$categoryId',
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { amount: -1 } },
      ]),

      // Deterministic insights
      generateInsights(userId),
    ]);

    // Format all-time summary
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeTotals.forEach((item) => {
      if (item._id === 'income') allTimeIncome = item.total;
      if (item._id === 'expense') allTimeExpense = item.total;
    });

    // Format current month summary
    let monthIncome = 0;
    let monthExpense = 0;
    currentMonthTotals.forEach((item) => {
      if (item._id === 'income') monthIncome = item.total;
      if (item._id === 'expense') monthExpense = item.total;
    });

    const monthSavings = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? Number(((monthSavings / monthIncome) * 100).toFixed(1)) : 0;
    const balance = allTimeIncome - allTimeExpense;

    // Enrich Category Breakdown
    const catIds = categoryExpenses.map((c) => c._id);
    const categoryDocs = await Category.find({ _id: { $in: catIds } });
    const categoryMap = {};
    categoryDocs.forEach((c) => {
      categoryMap[c._id.toString()] = c;
    });

    const expenseBreakdown = categoryExpenses.map((item) => {
      const cat = categoryMap[item._id.toString()] || { name: 'Other', color: '#6B7280', icon: 'category' };
      const pct = monthExpense > 0 ? Number(((item.amount / monthExpense) * 100).toFixed(1)) : 0;
      return {
        id: item._id,
        name: cat.name,
        color: cat.color || '#6366F1',
        icon: cat.icon || 'category',
        amount: item.amount,
        percentage: pct,
      };
    });

    // Compute spending for each budget
    const expenseByCatMap = {};
    categoryExpenses.forEach((item) => {
      expenseByCatMap[item._id.toString()] = item.amount;
    });

    const enrichedBudgets = budgets.map((b) => {
      const cId = b.categoryId?._id ? b.categoryId._id.toString() : b.categoryId.toString();
      const spent = expenseByCatMap[cId] || 0;
      const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      const remaining = Math.max(0, b.limit - spent);

      let status = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= (b.alertThreshold || 80)) status = 'near_limit';

      return {
        ...b.toObject(),
        spent,
        percentage: Number(percentage.toFixed(1)),
        remaining,
        status,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          balance,
          income: monthIncome,
          expenses: monthExpense,
          savings: monthSavings,
          savingsRate,
          allTimeIncome,
          allTimeExpense,
        },
        expenseBreakdown,
        recentTransactions,
        budgets: enrichedBudgets,
        upcomingPayments: upcomingRecurring,
        insights,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get spending overview chart series for variable periods (7 days, 30 days, 3 months, 6 months, 1 year)
// @route   GET /api/dashboard/spending-overview
// @access  Private
const getSpendingOverview = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query; // '7d' | '30d' | '3m' | '6m' | '1y'
    const userId = req.user._id;

    const now = new Date();
    let startDate = new Date();
    let groupByFormat = '%Y-%m-%d';
    let isMonthly = false;

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m';
        isMonthly = true;
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m';
        isMonthly = true;
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m';
        isMonthly = true;
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    const seriesData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            dateStr: { $dateToString: { format: groupByFormat, date: '$date' } },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Build chronological keys
    const timeline = [];
    const dateMap = {};

    if (!isMonthly) {
      const cur = new Date(startDate);
      while (cur <= now) {
        const key = cur.toISOString().split('T')[0];
        const label = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap[key] = { date: key, label, income: 0, expenses: 0, savings: 0 };
        timeline.push(key);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const cur = new Date(startDate);
      while (cur <= now) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
        const label = cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!dateMap[key]) {
          dateMap[key] = { date: key, label, income: 0, expenses: 0, savings: 0 };
          timeline.push(key);
        }
        cur.setMonth(cur.getMonth() + 1);
      }
    }

    // Populate actuals
    seriesData.forEach((item) => {
      const key = item._id.dateStr;
      if (dateMap[key]) {
        if (item._id.type === 'income') {
          dateMap[key].income = item.total;
        } else if (item._id.type === 'expense') {
          dateMap[key].expenses = item.total;
        }
      }
    });

    const result = timeline.map((key) => {
      const entry = dateMap[key];
      entry.savings = entry.income - entry.expenses;
      return entry;
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        chartData: result,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardData,
  getSpendingOverview,
};
