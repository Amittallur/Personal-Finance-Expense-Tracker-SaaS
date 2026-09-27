const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required for a budget'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit amount is required'],
      min: [1, 'Budget limit must be at least 1'],
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: 10,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
