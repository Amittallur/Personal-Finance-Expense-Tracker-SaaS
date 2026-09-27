const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;

  try {
    if (primaryUri) {
      console.log(`Connecting to primary MongoDB at: ${primaryUri}...`);
      await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('MongoDB connected successfully to primary database.');
      return;
    }
  } catch (err) {
    console.warn('Could not connect to external/local MongoDB instance:', err.message);
    console.log('Falling back to embedded MongoDB Memory Server for seamless local execution...');
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'expense_tracker',
      },
    });
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log(`Embedded MongoDB Memory Server connected successfully at: ${memUri}`);
  } catch (memErr) {
    console.error('Failed to initialize embedded MongoDB instance:', memErr.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('MongoDB disconnected.');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
