const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

/**
 * Generate deterministic financial insights based on real user transaction history.
 * No fake AI placeholders.
 */
const generateInsights = async (userId) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Current month date range
  const startCurrentMonth = new Date(currentYear, currentMonth, 1);
  const endCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  // Previous month date range
  const startPrevMonth = new Date(currentYear, currentMonth - 1, 1);
  const endPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // Parallel data fetching
  const [
    currentMonthAgg,
    prevMonthAgg,
    categoryCurrentAgg,
    categoryPrevAgg,
    currentBudgets,
  ] = await Promise.all([
    // Current month totals
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startCurrentMonth, $lte: endCurrentMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    // Prev month totals
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startPrevMonth, $lte: endPrevMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    // Current month category spending
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: startCurrentMonth, $lte: endCurrentMonth } } },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]),
    // Prev month category spending
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: startPrevMonth, $lte: endPrevMonth } } },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
        },
      },
    ]),
    // Current active budgets
    Budget.find({
      userId,
      month: currentMonth + 1,
      year: currentYear,
    }).populate('categoryId', 'name'),
  ]);

  const insights = [];

  // Parse current and prev income/expenses
  let currIncome = 0;
  let currExpense = 0;
  currentMonthAgg.forEach((item) => {
    if (item._id === 'income') currIncome = item.total;
    if (item._id === 'expense') currExpense = item.total;
  });

  let prevIncome = 0;
  let prevExpense = 0;
  prevMonthAgg.forEach((item) => {
    if (item._id === 'income') prevIncome = item.total;
    if (item._id === 'expense') prevExpense = item.total;
  });

  const currSavings = currIncome - currExpense;
  const prevSavings = prevIncome - prevExpense;

  // 1. Highest spending category insight
  if (categoryCurrentAgg.length > 0) {
    const highestCatId = categoryCurrentAgg[0]._id;
    const highestAmount = categoryCurrentAgg[0].total;
    const catDoc = await Category.findById(highestCatId);
    const catName = catDoc ? catDoc.name : 'Unknown';

    insights.push({
      id: 'highest_category',
      type: 'info',
      title: 'Top Spending Category',
      text: `Your highest spending category this month is ${catName} at ₹${highestAmount.toLocaleString('en-IN')}.`,
      highlight: catName,
      importance: 'medium',
    });

    // 2. Proportion of expenses
    if (currExpense > 0) {
      const share = Math.round((highestAmount / currExpense) * 100);
      if (share >= 25) {
        insights.push({
          id: 'category_share',
          type: 'warning',
          title: 'High Category Concentration',
          text: `${catName} accounts for ${share}% of your total expenses this month.`,
          highlight: `${share}%`,
          importance: 'high',
        });
      }
    }

    // 3. Category month-over-month comparison
    const prevMap = {};
    categoryPrevAgg.forEach((item) => {
      prevMap[item._id.toString()] = item.total;
    });

    for (const catItem of categoryCurrentAgg.slice(0, 3)) {
      const pAmt = prevMap[catItem._id.toString()] || 0;
      if (pAmt > 0) {
        const pctDiff = Math.round(((catItem.total - pAmt) / pAmt) * 100);
        const thisCat = await Category.findById(catItem._id);
        const cName = thisCat ? thisCat.name : 'Category';

        if (pctDiff > 10) {
          insights.push({
            id: `mom_increase_${catItem._id}`,
            type: 'warning',
            title: `${cName} Spending Increased`,
            text: `You spent ${pctDiff}% more on ${cName} this month compared to last month.`,
            highlight: `+${pctDiff}%`,
            importance: 'medium',
          });
          break; // Show one category highlight
        } else if (pctDiff < -10) {
          insights.push({
            id: `mom_decrease_${catItem._id}`,
            type: 'success',
            title: `${cName} Spending Decreased`,
            text: `Great job! You reduced ${cName} expenses by ${Math.abs(pctDiff)}% compared to last month.`,
            highlight: `-${Math.abs(pctDiff)}%`,
            importance: 'medium',
          });
          break;
        }
      }
    }
  }

  // 4. Savings comparison month-over-month
  if (prevIncome > 0 && currIncome > 0) {
    const savingsDiff = currSavings - prevSavings;
    if (savingsDiff > 0) {
      insights.push({
        id: 'savings_improved',
        type: 'success',
        title: 'Savings Boost',
        text: `You saved ₹${savingsDiff.toLocaleString('en-IN')} more this month than last month!`,
        highlight: `+₹${savingsDiff.toLocaleString('en-IN')}`,
        importance: 'high',
      });
    } else if (savingsDiff < 0) {
      insights.push({
        id: 'savings_dropped',
        type: 'warning',
        title: 'Lower Net Savings',
        text: `Your savings are ₹${Math.abs(savingsDiff).toLocaleString('en-IN')} lower than last month.`,
        highlight: `-₹${Math.abs(savingsDiff).toLocaleString('en-IN')}`,
        importance: 'medium',
      });
    }
  }

  // 5. Savings rate milestone
  if (currIncome > 0) {
    const savingsRate = Number(((currSavings / currIncome) * 100).toFixed(1));
    if (savingsRate >= 30) {
      insights.push({
        id: 'strong_savings_rate',
        type: 'success',
        title: 'Healthy Savings Rate',
        text: `Your savings rate is ${savingsRate}%, which exceeds the healthy 30% financial rule!`,
        highlight: `${savingsRate}%`,
        importance: 'high',
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        id: 'low_savings_rate',
        type: 'warning',
        title: 'Low Savings Rate',
        text: `Your current savings rate is ${savingsRate}%. Try optimizing non-essential categories.`,
        highlight: `${savingsRate}%`,
        importance: 'medium',
      });
    }
  }

  // 6. Budget alerts
  const currentSpendingMap = {};
  categoryCurrentAgg.forEach((item) => {
    currentSpendingMap[item._id.toString()] = item.total;
  });

  for (const b of currentBudgets) {
    const spent = currentSpendingMap[b.categoryId?._id ? b.categoryId._id.toString() : ''] || 0;
    const pct = (spent / b.limit) * 100;
    const catName = b.categoryId?.name || 'Category';

    if (pct >= 100) {
      insights.push({
        id: `budget_exceeded_${b._id}`,
        type: 'error',
        title: 'Budget Exceeded',
        text: `You have exceeded your ${catName} budget by ₹${(spent - b.limit).toLocaleString('en-IN')} (${Math.round(pct)}% used).`,
        highlight: 'Exceeded',
        importance: 'high',
      });
    } else if (pct >= (b.alertThreshold || 80)) {
      insights.push({
        id: `budget_near_${b._id}`,
        type: 'warning',
        title: 'Approaching Budget Limit',
        text: `You are at ${Math.round(pct)}% of your ${catName} budget (₹${Math.max(0, b.limit - spent).toLocaleString('en-IN')} remaining).`,
        highlight: `${Math.round(pct)}%`,
        importance: 'high',
      });
    }
  }

  // Fallback if brand new account with minimal transactions
  if (insights.length === 0) {
    insights.push({
      id: 'welcome_insight',
      type: 'info',
      title: 'Welcome to your Financial Cockpit',
      text: 'Add your recent income and expenses to unlock real-time spending insights and trends.',
      highlight: 'Get Started',
      importance: 'low',
    });
  }

  return insights;
};

module.exports = { generateInsights };
