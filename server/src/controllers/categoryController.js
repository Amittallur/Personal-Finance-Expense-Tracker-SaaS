const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// @desc    Get all categories for the authenticated user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { userId: req.user._id };
    if (type && (type === 'income' || type === 'expense')) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ type: 1, name: 1 });

    // Aggregate transaction counts for each category
    const transactionCounts = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$categoryId', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    const countMap = {};
    transactionCounts.forEach((item) => {
      countMap[item._id.toString()] = {
        count: item.count,
        totalAmount: item.totalAmount,
      };
    });

    const categoriesWithStats = categories.map((cat) => {
      const stats = countMap[cat._id.toString()] || { count: 0, totalAmount: 0 };
      return {
        ...cat.toObject(),
        transactionCount: stats.count,
        totalSpentOrEarned: stats.totalAmount,
      };
    });

    res.status(200).json({
      success: true,
      data: categoriesWithStats,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    const existing = await Category.findOne({
      userId: req.user._id,
      name: new RegExp(`^${name.trim()}$`, 'i'),
      type,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${name}" already exists for ${type}.`,
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: name.trim(),
      type,
      icon: icon || 'category',
      color: color || (type === 'income' ? '#10B981' : '#6366F1'),
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, color, type } = req.body;

    let category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (type) category.type = type;

    await category.save();

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const { reassignToCategoryId } = req.query;

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const transactionCount = await Transaction.countDocuments({
      userId: req.user._id,
      categoryId: category._id,
    });

    if (transactionCount > 0) {
      if (!reassignToCategoryId) {
        return res.status(400).json({
          success: false,
          hasTransactions: true,
          transactionCount,
          message: `This category is used by ${transactionCount} transaction(s). Please reassign them before deleting.`,
        });
      }

      // Verify target reassign category
      const targetCategory = await Category.findOne({
        _id: reassignToCategoryId,
        userId: req.user._id,
      });

      if (!targetCategory) {
        return res.status(400).json({
          success: false,
          message: 'The target reassignment category does not exist.',
        });
      }

      await Transaction.updateMany(
        { userId: req.user._id, categoryId: category._id },
        { categoryId: targetCategory._id }
      );
    }

    // Also delete any budgets linked to this category
    await Budget.deleteMany({
      userId: req.user._id,
      categoryId: category._id,
    });

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
