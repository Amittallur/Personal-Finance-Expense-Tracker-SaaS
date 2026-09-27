const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1'],
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Target deadline is required'],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    color: {
      type: String,
      default: '#10B981',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
    },
    contributions: [contributionSchema],
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
