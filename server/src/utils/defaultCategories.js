const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  // Expense Categories
  { name: 'Food', type: 'expense', icon: 'fastfood', color: '#F59E0B', isDefault: true },
  { name: 'Rent', type: 'expense', icon: 'home', color: '#EF4444', isDefault: true },
  { name: 'Transport', type: 'expense', icon: 'directions_car', color: '#3B82F6', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: 'shopping_bag', color: '#EC4899', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: 'movie', color: '#8B5CF6', isDefault: true },
  { name: 'Health', type: 'expense', icon: 'health_and_safety', color: '#10B981', isDefault: true },
  { name: 'Education', type: 'expense', icon: 'school', color: '#06B6D4', isDefault: true },
  { name: 'Bills', type: 'expense', icon: 'receipt', color: '#F97316', isDefault: true },
  { name: 'Travel', type: 'expense', icon: 'flight', color: '#14B8A6', isDefault: true },
  { name: 'Other', type: 'expense', icon: 'more_horiz', color: '#6B7280', isDefault: true },

  // Income Categories
  { name: 'Salary', type: 'income', icon: 'payments', color: '#10B981', isDefault: true },
  { name: 'Freelance', type: 'income', icon: 'work', color: '#3B82F6', isDefault: true },
  { name: 'Investment', type: 'income', icon: 'trending_up', color: '#8B5CF6', isDefault: true },
  { name: 'Business', type: 'income', icon: 'business', color: '#F59E0B', isDefault: true },
  { name: 'Other', type: 'income', icon: 'more_horiz', color: '#6B7280', isDefault: true },
];

const createDefaultCategories = async (userId) => {
  const categoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId,
  }));
  return Category.insertMany(categoriesToInsert);
};

module.exports = {
  DEFAULT_CATEGORIES,
  createDefaultCategories,
};
