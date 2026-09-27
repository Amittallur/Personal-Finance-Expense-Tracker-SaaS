const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get transactions with search, filters, sorting, and pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type,
      categoryId,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { userId: req.user._id };

    // Search query
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ description: regex }, { notes: regex }];
    }

    // Type filter
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    // Category filter
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total, summaryAgg] = await Promise.all([
      Transaction.find(query)
        .populate('categoryId', 'name icon color type')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    summaryAgg.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
        summary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('categoryId', 'name icon color type');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, categoryId, description, date, paymentMethod, notes } = req.body;

    // Verify category belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found or unauthorized' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: parseFloat(amount),
      categoryId,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      notes: notes || '',
    });

    const populated = await Transaction.findById(transaction._id).populate('categoryId', 'name icon color type');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Transaction recorded successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const { type, amount, categoryId, description, date, paymentMethod, notes } = req.body;

    let transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user._id,
      });
      if (!category) {
        return res.status(400).json({ success: false, message: 'Category not found or unauthorized' });
      }
      transaction.categoryId = categoryId;
    }

    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    const populated = await Transaction.findById(transaction._id).populate('categoryId', 'name icon color type');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Transaction updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
