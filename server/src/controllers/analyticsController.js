const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get detailed financial analytics with customizable date range
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, period = '6m' } = req.query;
    const userId = req.user._id;

    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case '30d':
          start.setDate(now.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          break;
        case '3m':
          start.setMonth(now.getMonth() - 3);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case '6m':
          start.setMonth(now.getMonth() - 6);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case '1y':
          start.setFullYear(now.getFullYear() - 1);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start.setMonth(now.getMonth() - 6);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
      }
    }

    const matchQuery = {
      userId,
      date: { $gte: start, $lte: end },
    };

    const [
      overallTotals,
      monthlyTrends,
      categoryExpenses,
      paymentMethodStats,
      allUserCategories,
    ] = await Promise.all([
      // Overall totals in range
      Transaction.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Monthly spending and income trends
      Transaction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              yearMonth: { $dateToString: { format: '%Y-%m', date: '$date' } },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.yearMonth': 1 } },
      ]),

      // Category breakdown for expenses
      Transaction.aggregate([
        { $match: { ...matchQuery, type: 'expense' } },
        {
          $group: {
            _id: '$categoryId',
            amount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),

      // Payment method breakdown
      Transaction.aggregate([
        { $match: { ...matchQuery, type: 'expense' } },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Categories map
      Category.find({ userId }),
    ]);

    // Parse overall summary
    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    overallTotals.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
      transactionCount += item.count;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

    // Monthly trends chart data
    const monthlyMap = {};
    monthlyTrends.forEach((item) => {
      const ym = item._id.yearMonth;
      if (!monthlyMap[ym]) {
        const [y, m] = ym.split('-');
        const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        monthlyMap[ym] = {
          monthKey: ym,
          monthName: dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income: 0,
          expenses: 0,
          savings: 0,
        };
      }
      if (item._id.type === 'income') monthlyMap[ym].income = item.total;
      if (item._id.type === 'expense') monthlyMap[ym].expenses = item.total;
    });

    const monthlyTrendsData = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((entry) => ({
        ...entry,
        savings: entry.income - entry.expenses,
      }));

    // Category breakdown & ranking
    const categoryDocMap = {};
    allUserCategories.forEach((c) => {
      categoryDocMap[c._id.toString()] = c;
    });

    const rankedCategories = categoryExpenses.map((cat, index) => {
      const doc = categoryDocMap[cat._id.toString()] || { name: 'Uncategorized', color: '#6B7280', icon: 'category' };
      const pct = totalExpense > 0 ? Number(((cat.amount / totalExpense) * 100).toFixed(1)) : 0;
      return {
        rank: index + 1,
        categoryId: cat._id,
        name: doc.name,
        color: doc.color || '#6366F1',
        icon: doc.icon || 'category',
        amount: cat.amount,
        percentage: pct,
        count: cat.transactionCount,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netSavings,
          savingsRate,
          transactionCount,
          averageMonthlyExpense: monthlyTrendsData.length > 0 ? Math.round(totalExpense / monthlyTrendsData.length) : totalExpense,
        },
        monthlyTrends: monthlyTrendsData,
        categoryBreakdown: rankedCategories,
        paymentMethods: paymentMethodStats.map((p) => ({
          method: p._id || 'Other',
          amount: p.total,
          count: p.count,
          percentage: totalExpense > 0 ? Number(((p.total / totalExpense) * 100).toFixed(1)) : 0,
        })),
        dateRange: {
          start,
          end,
          period,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics,
};
