const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Recurring payment name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
      required: true,
    },
    isSubscription: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'],
      default: 'Credit Card',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    nextPaymentDate: {
      type: Date,
      required: [true, 'Next payment date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
    },
    autoAddTransaction: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

recurringTransactionSchema.index({ userId: 1, nextPaymentDate: 1 });
recurringTransactionSchema.index({ userId: 1, isSubscription: 1 });

module.exports = mongoose.model('RecurringTransaction', recurringTransactionSchema);
