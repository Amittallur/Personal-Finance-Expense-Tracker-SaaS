const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get all budgets for a specific month and year with computed spending
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    }).populate('categoryId', 'name icon color type');

    // Calculate start and end of this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Aggregate expenses for this month grouped by category
    const spendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spendingMap = {};
    spendingAgg.forEach((item) => {
      spendingMap[item._id.toString()] = item.totalSpent;
    });

    let totalBudgeted = 0;
    let totalSpent = 0;

    const enrichedBudgets = budgets.map((b) => {
      const catId = b.categoryId?._id ? b.categoryId._id.toString() : b.categoryId.toString();
      const spent = spendingMap[catId] || 0;
      const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      const remaining = Math.max(0, b.limit - spent);

      let status = 'normal';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= (b.alertThreshold || 80)) {
        status = 'near_limit';
      }

      totalBudgeted += b.limit;
      totalSpent += spent;

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
        budgets: enrichedBudgets,
        month,
        year,
        summary: {
          totalBudgeted,
          totalSpent,
          overallPercentage: totalBudgeted > 0 ? Number(((totalSpent / totalBudgeted) * 100).toFixed(1)) : 0,
          remainingBudget: Math.max(0, totalBudgeted - totalSpent),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
  try {
    const { categoryId, month, year, limit, alertThreshold } = req.body;

    // Check category exists and belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found or unauthorized' });
    }

    // Check duplicate budget
    const existing = await Budget.findOne({
      userId: req.user._id,
      categoryId,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category and month already exists. Please update the existing budget.',
      });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      categoryId,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      limit: parseFloat(limit),
      alertThreshold: alertThreshold ? parseInt(alertThreshold, 10) : 80,
    });

    const populated = await Budget.findById(budget._id).populate('categoryId', 'name icon color type');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Budget created successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  try {
    const { limit, alertThreshold } = req.body;

    let budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (limit !== undefined) budget.limit = parseFloat(limit);
    if (alertThreshold !== undefined) budget.alertThreshold = parseInt(alertThreshold, 10);

    await budget.save();

    const populated = await Budget.findById(budget._id).populate('categoryId', 'name icon color type');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Budget updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
