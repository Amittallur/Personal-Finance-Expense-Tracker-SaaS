const RecurringTransaction = require('../models/RecurringTransaction');
const Category = require('../models/Category');

// Helper to calculate normalized monthly and yearly cost
const calculateNormalizedCost = (amount, frequency) => {
  switch (frequency) {
    case 'daily':
      return { monthly: amount * 30.4, yearly: amount * 365 };
    case 'weekly':
      return { monthly: (amount * 52) / 12, yearly: amount * 52 };
    case 'monthly':
      return { monthly: amount, yearly: amount * 12 };
    case 'quarterly':
      return { monthly: amount / 3, yearly: amount * 4 };
    case 'yearly':
      return { monthly: amount / 12, yearly: amount };
    default:
      return { monthly: amount, yearly: amount * 12 };
  }
};

// @desc    Get all recurring payments
// @route   GET /api/recurring
// @access  Private
const getRecurring = async (req, res, next) => {
  try {
    const { isSubscription, status } = req.query;
    const filter = { userId: req.user._id };

    if (isSubscription !== undefined) {
      filter.isSubscription = isSubscription === 'true';
    }
    if (status) {
      filter.status = status;
    }

    const items = await RecurringTransaction.find(filter)
      .populate('categoryId', 'name icon color type')
      .sort({ nextPaymentDate: 1 });

    let totalMonthlyCost = 0;
    let totalYearlyCost = 0;

    const enrichedItems = items.map((item) => {
      const obj = item.toObject();
      const { monthly, yearly } = calculateNormalizedCost(obj.amount, obj.frequency);

      if (obj.status === 'active' && obj.type === 'expense') {
        totalMonthlyCost += monthly;
        totalYearlyCost += yearly;
      }

      return {
        ...obj,
        normalizedMonthly: Number(monthly.toFixed(2)),
        normalizedYearly: Number(yearly.toFixed(2)),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: enrichedItems,
        summary: {
          totalCount: enrichedItems.length,
          activeCount: enrichedItems.filter((i) => i.status === 'active').length,
          totalMonthlyCost: Number(totalMonthlyCost.toFixed(2)),
          totalYearlyCost: Number(totalYearlyCost.toFixed(2)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create recurring payment or subscription
// @route   POST /api/recurring
// @access  Private
const createRecurring = async (req, res, next) => {
  try {
    const {
      name,
      type = 'expense',
      amount,
      categoryId,
      frequency = 'monthly',
      isSubscription = false,
      paymentMethod = 'Credit Card',
      startDate,
      nextPaymentDate,
      notes,
    } = req.body;

    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found or unauthorized' });
    }

    const item = await RecurringTransaction.create({
      userId: req.user._id,
      name: name.trim(),
      type,
      amount: parseFloat(amount),
      categoryId,
      frequency,
      isSubscription: Boolean(isSubscription),
      paymentMethod,
      startDate: startDate ? new Date(startDate) : new Date(),
      nextPaymentDate: new Date(nextPaymentDate),
      notes: notes || '',
      status: 'active',
    });

    const populated = await RecurringTransaction.findById(item._id).populate('categoryId', 'name icon color type');

    res.status(201).json({
      success: true,
      data: populated,
      message: `${isSubscription ? 'Subscription' : 'Recurring payment'} created successfully`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update recurring payment
// @route   PUT /api/recurring/:id
// @access  Private
const updateRecurring = async (req, res, next) => {
  try {
    const {
      name,
      amount,
      categoryId,
      frequency,
      isSubscription,
      paymentMethod,
      nextPaymentDate,
      status,
      notes,
    } = req.body;

    let item = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user._id,
      });
      if (!category) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
      item.categoryId = categoryId;
    }

    if (name) item.name = name.trim();
    if (amount !== undefined) item.amount = parseFloat(amount);
    if (frequency) item.frequency = frequency;
    if (isSubscription !== undefined) item.isSubscription = Boolean(isSubscription);
    if (paymentMethod) item.paymentMethod = paymentMethod;
    if (nextPaymentDate) item.nextPaymentDate = new Date(nextPaymentDate);
    if (status) item.status = status;
    if (notes !== undefined) item.notes = notes;

    await item.save();

    const populated = await RecurringTransaction.findById(item._id).populate('categoryId', 'name icon color type');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Recurring payment updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete recurring payment
// @route   DELETE /api/recurring/:id
// @access  Private
const deleteRecurring = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring transaction deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
};
