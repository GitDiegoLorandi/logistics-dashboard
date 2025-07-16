require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./src/config');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  try {
    // Get the connection string
    let connectionString = config.MONGODB_URI;
    console.log(`Connection string: ${connectionString.substring(0, 20)}...`);
    
    // If the connection string doesn't include a database name, add it
    if (!connectionString.includes('mongodb.net/logistics-dashboard')) {
      connectionString = connectionString.replace('mongodb.net', 'mongodb.net/logistics-dashboard');
      console.log('Added database name to connection string');
    }
    
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Try to list collections
    console.log('Listing collections:');
    const collections = await conn.connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

testConnection();
