require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5001;

let server;

const startServer = async () => {
  try {
    await connectDB();
    
    // Check if database is empty (e.g. fresh memory server), and auto-seed demo data
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Initializing demo seed data...');
      try {
        const { createDefaultCategories } = require('./utils/defaultCategories');
        const Category = require('./models/Category');
        const Transaction = require('./models/Transaction');
        const Budget = require('./models/Budget');
        const Goal = require('./models/Goal');
        const RecurringTransaction = require('./models/RecurringTransaction');

        const demoUser = await User.create({
          name: 'Amit Sharma',
          email: 'demo@example.com',
          password: 'Password123!',
          preferences: { currency: 'INR', theme: 'light', dateFormat: 'DD/MM/YYYY' },
        });

        const categories = await createDefaultCategories(demoUser._id);
        const catMap = {};
        categories.forEach((cat) => { catMap[cat.name] = cat._id; });

        const now = new Date();
        const currYear = now.getFullYear();
        const currMonth = now.getMonth();

        // Add demo transactions
        const transactions = [
          { userId: demoUser._id, type: 'income', amount: 65000, categoryId: catMap['Salary'], description: 'Monthly Corporate Salary Credit', date: new Date(currYear, currMonth, 1), paymentMethod: 'Bank Transfer' },
          { userId: demoUser._id, type: 'income', amount: 18000, categoryId: catMap['Freelance'], description: 'Client Website UI Design', date: new Date(currYear, currMonth, 12), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 15000, categoryId: catMap['Rent'], description: 'Indiranagar 2BHK Apartment Rent', date: new Date(currYear, currMonth, 2), paymentMethod: 'Bank Transfer' },
          { userId: demoUser._id, type: 'expense', amount: 4200, categoryId: catMap['Food'], description: 'Nature Basket Organic Groceries', date: new Date(currYear, currMonth, 4), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 1850, categoryId: catMap['Food'], description: 'Weekend Dinner at Toit', date: new Date(currYear, currMonth, 7), paymentMethod: 'Credit Card' },
          { userId: demoUser._id, type: 'expense', amount: 2450, categoryId: catMap['Food'], description: 'Swiggy & Zomato Orders', date: new Date(currYear, currMonth, 15), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 2200, categoryId: catMap['Transport'], description: 'Fuel Shell Petrol Station', date: new Date(currYear, currMonth, 5), paymentMethod: 'Credit Card' },
          { userId: demoUser._id, type: 'expense', amount: 1000, categoryId: catMap['Transport'], description: 'Metro Smart Card Recharge', date: new Date(currYear, currMonth, 9), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 2800, categoryId: catMap['Bills'], description: 'Bescom Electricity Bill', date: new Date(currYear, currMonth, 10), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 999, categoryId: catMap['Bills'], description: 'Airtel Xstream Fiber Broadband', date: new Date(currYear, currMonth, 11), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 719, categoryId: catMap['Bills'], description: 'Jio 5G Unlimited Recharge', date: new Date(currYear, currMonth, 12), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 3200, categoryId: catMap['Shopping'], description: 'Zara Autumn Casual Shirt & Trousers', date: new Date(currYear, currMonth, 8), paymentMethod: 'Credit Card' },
          { userId: demoUser._id, type: 'expense', amount: 1600, categoryId: catMap['Shopping'], description: 'Amazon Echo Smart Plug', date: new Date(currYear, currMonth, 14), paymentMethod: 'Debit Card' },
          { userId: demoUser._id, type: 'expense', amount: 1400, categoryId: catMap['Entertainment'], description: 'PVR Inox Movie Tickets (IMAX)', date: new Date(currYear, currMonth, 13), paymentMethod: 'UPI' },
          { userId: demoUser._id, type: 'expense', amount: 1250, categoryId: catMap['Health'], description: 'Apollo Pharmacy Supplements', date: new Date(currYear, currMonth, 6), paymentMethod: 'UPI' },
        ];

        // Previous month transactions
        for (let m = 1; m <= 2; m++) {
          transactions.push(
            { userId: demoUser._id, type: 'income', amount: 65000, categoryId: catMap['Salary'], description: 'Monthly Fixed Salary Credit', date: new Date(currYear, currMonth - m, 1), paymentMethod: 'Bank Transfer' },
            { userId: demoUser._id, type: 'expense', amount: 15000, categoryId: catMap['Rent'], description: 'Apartment Monthly Rent', date: new Date(currYear, currMonth - m, 2), paymentMethod: 'Bank Transfer' },
            { userId: demoUser._id, type: 'expense', amount: 7200, categoryId: catMap['Food'], description: 'Groceries and food ordering', date: new Date(currYear, currMonth - m, 6), paymentMethod: 'UPI' },
            { userId: demoUser._id, type: 'expense', amount: 3400, categoryId: catMap['Transport'], description: 'Cab and fuel expenses', date: new Date(currYear, currMonth - m, 10), paymentMethod: 'Credit Card' },
            { userId: demoUser._id, type: 'expense', amount: 4200, categoryId: catMap['Bills'], description: 'Utility bills & subscriptions', date: new Date(currYear, currMonth - m, 12), paymentMethod: 'UPI' }
          );
        }

        await Transaction.insertMany(transactions);

        // Budgets
        await Budget.insertMany([
          { userId: demoUser._id, categoryId: catMap['Food'], month: currMonth + 1, year: currYear, limit: 10000, alertThreshold: 80 },
          { userId: demoUser._id, categoryId: catMap['Shopping'], month: currMonth + 1, year: currYear, limit: 5000, alertThreshold: 80 },
          { userId: demoUser._id, categoryId: catMap['Entertainment'], month: currMonth + 1, year: currYear, limit: 3000, alertThreshold: 70 },
          { userId: demoUser._id, categoryId: catMap['Bills'], month: currMonth + 1, year: currYear, limit: 6000, alertThreshold: 85 },
          { userId: demoUser._id, categoryId: catMap['Transport'], month: currMonth + 1, year: currYear, limit: 4500, alertThreshold: 80 },
        ]);

        // Goals
        await Goal.create([
          {
            userId: demoUser._id,
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
            userId: demoUser._id,
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
        ]);

        // Recurring & subscriptions
        await RecurringTransaction.insertMany([
          {
            userId: demoUser._id,
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
          },
          {
            userId: demoUser._id,
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
          },
          {
            userId: demoUser._id,
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
          },
          {
            userId: demoUser._id,
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
          },
          {
            userId: demoUser._id,
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
          },
        ]);

        console.log('Auto-seed completed successfully with demo user: demo@example.com / Password123!');
      } catch (seedErr) {
        console.error('Auto-seed error:', seedErr);
      }
    }

    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
};

// Graceful shutdown handling
const shutdown = async () => {
  console.log('\nGracefully shutting down server...');
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
