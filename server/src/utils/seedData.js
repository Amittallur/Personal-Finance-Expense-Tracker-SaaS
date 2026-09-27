require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const RecurringTransaction = require('../models/RecurringTransaction');
const { createDefaultCategories } = require('./defaultCategories');

const seed = async () => {
  try {
    await connectDB();
    console.log('Clearing existing seed data...');

    // Clear models
    await Promise.all([
      User.deleteMany({ email: 'demo@example.com' }),
    ]);

    // Create demo user
    console.log('Creating demo user: demo@example.com / Password123!');
    const user = await User.create({
      name: 'Amit Sharma',
      email: 'demo@example.com',
      password: 'Password123!',
      preferences: {
        currency: 'INR',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY',
      },
    });

    // Remove any leftover data for this user
    await Promise.all([
      Category.deleteMany({ userId: user._id }),
      Transaction.deleteMany({ userId: user._id }),
      Budget.deleteMany({ userId: user._id }),
      Goal.deleteMany({ userId: user._id }),
      RecurringTransaction.deleteMany({ userId: user._id }),
    ]);

    // Create default categories
    console.log('Seeding categories...');
    const categories = await createDefaultCategories(user._id);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.name] = cat._id;
    });

    // Generate Dates for Current and Previous months
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth(); // 0-indexed

    console.log('Seeding transactions across multiple months...');
    const transactions = [];

    // Monthly incomes for past 3 months
    for (let m = 2; m >= 0; m--) {
      const salaryDate = new Date(currYear, currMonth - m, 1, 10, 0, 0);
      transactions.push({
        userId: user._id,
        type: 'income',
        amount: 65000,
        categoryId: catMap['Salary'],
        description: 'Monthly Corporate Salary Credit',
        date: salaryDate,
        paymentMethod: 'Bank Transfer',
        notes: 'Monthly fixed salary after deductions',
      });

      if (m <= 1) {
        const freelanceDate = new Date(currYear, currMonth - m, 12, 14, 30, 0);
        transactions.push({
          userId: user._id,
          type: 'income',
          amount: 18000,
          categoryId: catMap['Freelance'],
          description: 'Client Website Design Milestone',
          date: freelanceDate,
          paymentMethod: 'UPI',
          notes: 'Contract UI/UX project',
        });
      }

      const invDate = new Date(currYear, currMonth - m, 20, 11, 0, 0);
      transactions.push({
        userId: user._id,
        type: 'income',
        amount: 4500,
        categoryId: catMap['Investment'],
        description: 'Mutual Fund Dividend & Stock Yield',
        date: invDate,
        paymentMethod: 'Bank Transfer',
        notes: 'Quarterly payout',
      });
    }

    // Current Month Expenses
    const currentMonthExpenses = [
      { cat: 'Rent', amount: 15000, desc: 'Apartment Monthly Rent', day: 2, method: 'Bank Transfer' },
      { cat: 'Food', amount: 4200, desc: 'Nature Basket Monthly Groceries', day: 4, method: 'UPI' },
      { cat: 'Food', amount: 1850, desc: 'Weekend Dinner at Toit Brewpub', day: 7, method: 'Credit Card' },
      { cat: 'Food', amount: 2450, desc: 'Swiggy & Zomato Orders', day: 15, method: 'UPI' },
      { cat: 'Transport', amount: 2200, desc: 'Fuel Shell Petrol Station', day: 5, method: 'Credit Card' },
      { cat: 'Transport', amount: 1000, desc: 'Metro Smart Card Recharge', day: 9, method: 'UPI' },
      { cat: 'Bills', amount: 2800, desc: 'Bescom Electricity Bill', day: 10, method: 'UPI' },
      { cat: 'Bills', amount: 999, desc: 'Airtel Xstream Fiber Broadband', day: 11, method: 'UPI' },
      { cat: 'Bills', amount: 719, desc: 'Jio 5G Unlimited Recharge', day: 12, method: 'UPI' },
      { cat: 'Shopping', amount: 3200, desc: 'Zara Autumn Casual Shirt & Trousers', day: 8, method: 'Credit Card' },
      { cat: 'Shopping', amount: 1600, desc: 'Amazon Echo Smart Plug & Cable', day: 14, method: 'Debit Card' },
      { cat: 'Entertainment', amount: 1400, desc: 'PVR Inox Movie Tickets (IMAX)', day: 13, method: 'UPI' },
      { cat: 'Entertainment', amount: 700, desc: 'Board Games Cafe Night', day: 18, method: 'Cash' },
      { cat: 'Health', amount: 1250, desc: 'Apollo Pharmacy Vitamins & Supplements', day: 6, method: 'UPI' },
    ];

    currentMonthExpenses.forEach((item) => {
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: item.amount,
        categoryId: catMap[item.cat],
        description: item.desc,
        date: new Date(currYear, currMonth, Math.min(item.day, now.getDate()), 13, 0, 0),
        paymentMethod: item.method,
      });
    });

    // Previous Month Expenses (for realistic trends & comparisons)
    const prevMonthExpenses = [
      { cat: 'Rent', amount: 15000, desc: 'Apartment Monthly Rent', day: 2, method: 'Bank Transfer' },
      { cat: 'Food', amount: 7200, desc: 'Groceries and food ordering', day: 6, method: 'UPI' },
      { cat: 'Transport', amount: 3400, desc: 'Cab and fuel expenses', day: 10, method: 'Credit Card' },
      { cat: 'Bills', amount: 4200, desc: 'Utility bills & subscriptions', day: 12, method: 'UPI' },
      { cat: 'Shopping', amount: 5100, desc: 'Electronics and festive clothing', day: 15, method: 'Credit Card' },
      { cat: 'Entertainment', amount: 2600, desc: 'Concert passes & dining', day: 20, method: 'UPI' },
      { cat: 'Health', amount: 2100, desc: 'Doctor checkup & medicines', day: 16, method: 'Credit Card' },
      { cat: 'Travel', amount: 6500, desc: 'Coorg Weekend Roadtrip Homestay', day: 24, method: 'UPI' },
    ];

    prevMonthExpenses.forEach((item) => {
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: item.amount,
        categoryId: catMap[item.cat],
        description: item.desc,
        date: new Date(currYear, currMonth - 1, item.day, 12, 0, 0),
        paymentMethod: item.method,
      });
    });

    // 2 Months ago expenses
    const twoMonthsAgoExpenses = [
      { cat: 'Rent', amount: 15000, desc: 'Apartment Monthly Rent', day: 2, method: 'Bank Transfer' },
      { cat: 'Food', amount: 6800, desc: 'Groceries & provisions', day: 8, method: 'UPI' },
      { cat: 'Transport', amount: 3100, desc: 'Fuel and metro', day: 12, method: 'Credit Card' },
      { cat: 'Bills', amount: 4100, desc: 'Power, water, internet', day: 14, method: 'UPI' },
      { cat: 'Shopping', amount: 4200, desc: 'Household essentials', day: 18, method: 'Credit Card' },
    ];

    twoMonthsAgoExpenses.forEach((item) => {
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: item.amount,
        categoryId: catMap[item.cat],
        description: item.desc,
        date: new Date(currYear, currMonth - 2, item.day, 11, 0, 0),
        paymentMethod: item.method,
      });
    });

    await Transaction.insertMany(transactions);
    console.log(`Seeded ${transactions.length} realistic transactions.`);

    // Seed Current Month Budgets
    console.log('Seeding monthly budgets...');
    await Budget.insertMany([
      {
        userId: user._id,
        categoryId: catMap['Food'],
        month: currMonth + 1,
        year: currYear,
        limit: 10000,
        alertThreshold: 80,
      },
      {
        userId: user._id,
        categoryId: catMap['Shopping'],
        month: currMonth + 1,
        year: currYear,
        limit: 5000,
        alertThreshold: 80,
      },
      {
        userId: user._id,
        categoryId: catMap['Entertainment'],
        month: currMonth + 1,
        year: currYear,
        limit: 3000,
        alertThreshold: 70,
      },
      {
        userId: user._id,
        categoryId: catMap['Bills'],
        month: currMonth + 1,
        year: currYear,
        limit: 6000,
        alertThreshold: 85,
      },
      {
        userId: user._id,
        categoryId: catMap['Transport'],
        month: currMonth + 1,
        year: currYear,
        limit: 4500,
        alertThreshold: 80,
      },
    ]);

    // Seed Savings Goals
    console.log('Seeding savings goals with contribution history...');
    await Goal.create([
      {
        userId: user._id,
        name: 'New MacBook Pro M3 Max',
        targetAmount: 180000,
        savedAmount: 95000,
        deadline: new Date(currYear + 1, 2, 31),
        category: 'Gadgets',
        color: '#6366F1',
        status: 'in_progress',
        contributions: [
          { amount: 35000, date: new Date(currYear, currMonth - 2, 5), notes: 'Initial savings allocation' },
          { amount: 30000, date: new Date(currYear, currMonth - 1, 6), notes: 'Freelance payment bonus' },
          { amount: 30000, date: new Date(currYear, currMonth, 5), notes: 'Monthly budget surplus' },
        ],
      },
      {
        userId: user._id,
        name: 'Emergency Fund (6 Months Safety Net)',
        targetAmount: 250000,
        savedAmount: 180000,
        deadline: new Date(currYear + 1, 5, 30),
        category: 'Security',
        color: '#10B981',
        status: 'in_progress',
        contributions: [
          { amount: 100000, date: new Date(currYear, currMonth - 3, 1), notes: 'Annual bonus deposit' },
          { amount: 40000, date: new Date(currYear, currMonth - 2, 10), notes: 'FD maturity transfer' },
          { amount: 40000, date: new Date(currYear, currMonth - 1, 15), notes: 'Systematic monthly savings' },
        ],
      },
      {
        userId: user._id,
        name: 'Japan Autumn Cherry Blossom Trip',
        targetAmount: 150000,
        savedAmount: 55000,
        deadline: new Date(currYear + 1, 9, 15),
        category: 'Travel',
        color: '#EC4899',
        status: 'in_progress',
        contributions: [
          { amount: 30000, date: new Date(currYear, currMonth - 2, 25), notes: 'Early flight booking fund' },
          { amount: 25000, date: new Date(currYear, currMonth - 1, 28), notes: 'Travel savings' },
        ],
      },
    ]);

    // Seed Recurring Payments & Subscriptions
    console.log('Seeding recurring payments and subscriptions...');
    await RecurringTransaction.insertMany([
      {
        userId: user._id,
        name: 'Netflix 4K Ultra HD',
        type: 'expense',
        amount: 649,
        categoryId: catMap['Entertainment'],
        frequency: 'monthly',
        isSubscription: true,
        paymentMethod: 'Credit Card',
        startDate: new Date(currYear, currMonth - 4, 28),
        nextPaymentDate: new Date(currYear, currMonth, 28),
        status: 'active',
        notes: 'Standard family plan',
      },
      {
        userId: user._id,
        name: 'Spotify Premium Family',
        type: 'expense',
        amount: 179,
        categoryId: catMap['Entertainment'],
        frequency: 'monthly',
        isSubscription: true,
        paymentMethod: 'UPI',
        startDate: new Date(currYear, currMonth - 5, 14),
        nextPaymentDate: new Date(currYear, currMonth, 14),
        status: 'active',
        notes: 'Music streaming subscription',
      },
      {
        userId: user._id,
        name: 'AWS Cloud Infrastructure',
        type: 'expense',
        amount: 2400,
        categoryId: catMap['Bills'],
        frequency: 'monthly',
        isSubscription: true,
        paymentMethod: 'Credit Card',
        startDate: new Date(currYear, currMonth - 6, 1),
        nextPaymentDate: new Date(currYear, currMonth, 1),
        status: 'active',
        notes: 'EC2 and RDS dev instances',
      },
      {
        userId: user._id,
        name: 'Airtel Xstream Fiber 200Mbps',
        type: 'expense',
        amount: 999,
        categoryId: catMap['Bills'],
        frequency: 'monthly',
        isSubscription: true,
        paymentMethod: 'UPI',
        startDate: new Date(currYear, currMonth - 3, 2),
        nextPaymentDate: new Date(currYear, currMonth, 2),
        status: 'active',
        notes: 'Home work fiber line',
      },
      {
        userId: user._id,
        name: 'Cult.fit Elite Gym Membership',
        type: 'expense',
        amount: 1750,
        categoryId: catMap['Health'],
        frequency: 'monthly',
        isSubscription: true,
        paymentMethod: 'Credit Card',
        startDate: new Date(currYear, currMonth - 2, 10),
        nextPaymentDate: new Date(currYear, currMonth, 10),
        status: 'active',
        notes: 'Gym & workout pass',
      },
      {
        userId: user._id,
        name: 'Apartment Monthly Rent',
        type: 'expense',
        amount: 15000,
        categoryId: catMap['Rent'],
        frequency: 'monthly',
        isSubscription: false,
        paymentMethod: 'Bank Transfer',
        startDate: new Date(currYear, currMonth - 6, 1),
        nextPaymentDate: new Date(currYear, currMonth, 1),
        status: 'active',
        notes: 'Indiranagar 2BHK rental',
      },
    ]);

    console.log('Seeding complete successfully!');
    console.log('Demo Credentials:');
    console.log('  Email: demo@example.com');
    console.log('  Password: Password123!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await disconnectDB();
  }
};

seed();
