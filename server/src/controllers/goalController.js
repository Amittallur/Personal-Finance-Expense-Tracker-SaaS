const Goal = require('../models/Goal');

// @desc    Get all savings goals with projected metrics
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const now = new Date();

    const enrichedGoals = goals.map((goal) => {
      const g = goal.toObject();
      const percentage = g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;
      const remainingAmount = Math.max(0, g.targetAmount - g.savedAmount);

      const deadlineDate = new Date(g.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4));
      const requiredMonthlySaving = remainingAmount > 0 ? remainingAmount / monthsRemaining : 0;

      // Calculate recent monthly contribution velocity
      let monthlyVelocity = 0;
      if (g.contributions && g.contributions.length > 0) {
        const sortedContributions = [...g.contributions].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstContrib = new Date(sortedContributions[0].date);
        const monthsSpan = Math.max(1, Math.ceil((now.getTime() - firstContrib.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
        const totalContributed = sortedContributions.reduce((sum, c) => sum + c.amount, 0);
        monthlyVelocity = totalContributed / monthsSpan;
      }

      const isCompleted = g.savedAmount >= g.targetAmount;
      const isOnTrack = isCompleted || (monthlyVelocity >= requiredMonthlySaving && requiredMonthlySaving > 0);

      return {
        ...g,
        percentage: Number(percentage.toFixed(1)),
        remainingAmount,
        daysRemaining,
        monthsRemaining,
        requiredMonthlySaving: Number(requiredMonthlySaving.toFixed(2)),
        monthlyVelocity: Number(monthlyVelocity.toFixed(2)),
        isOnTrack,
        isCompleted,
      };
    });

    // Summary totals
    const totalTarget = enrichedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = enrichedGoals.reduce((sum, g) => sum + g.savedAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        goals: enrichedGoals,
        summary: {
          totalGoals: enrichedGoals.length,
          completedGoals: enrichedGoals.filter((g) => g.isCompleted).length,
          totalTarget,
          totalSaved,
          overallPercentage: totalTarget > 0 ? Number(((totalSaved / totalTarget) * 100).toFixed(1)) : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, savedAmount = 0, deadline, category, color } = req.body;

    const initialContributions = [];
    const parsedSaved = parseFloat(savedAmount) || 0;
    if (parsedSaved > 0) {
      initialContributions.push({
        amount: parsedSaved,
        date: new Date(),
        notes: 'Initial deposit',
      });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      savedAmount: parsedSaved,
      deadline: new Date(deadline),
      category: category || 'General',
      color: color || '#10B981',
      status: parsedSaved >= parseFloat(targetAmount) ? 'completed' : 'in_progress',
      contributions: initialContributions,
    });

    res.status(201).json({
      success: true,
      data: goal,
      message: 'Savings goal created successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline, category, color, status } = req.body;

    let goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    if (name) goal.name = name.trim();
    if (targetAmount !== undefined) goal.targetAmount = parseFloat(targetAmount);
    if (deadline) goal.deadline = new Date(deadline);
    if (category) goal.category = category;
    if (color) goal.color = color;
    if (status) goal.status = status;

    if (goal.savedAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    res.status(200).json({
      success: true,
      data: goal,
      message: 'Goal updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a contribution to a goal
// @route   POST /api/goals/:id/contribute
// @access  Private
const addContribution = async (req, res, next) => {
  try {
    const { amount, notes, date } = req.body;
    const contribAmount = parseFloat(amount);

    if (isNaN(contribAmount) || contribAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contribution amount' });
    }

    let goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.savedAmount += contribAmount;
    goal.contributions.push({
      amount: contribAmount,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
    });

    if (goal.savedAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    res.status(200).json({
      success: true,
      data: goal,
      message: `Added ${contribAmount} to "${goal.name}"!`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  addContribution,
  deleteGoal,
};
