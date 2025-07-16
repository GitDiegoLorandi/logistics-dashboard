const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get the connection string from environment variables
    let connectionString = process.env.MONGO_URI;
    
    // If the connection string doesn't include a database name, add it
    if (!connectionString.includes('mongodb.net/logistics-dashboard')) {
      connectionString = connectionString.replace('mongodb.net', 'mongodb.net/logistics-dashboard');
    }
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Log connection state
    mongoose.connection.on('connected', () => {
      console.log('📡 MongoDB connection established');
    });

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
