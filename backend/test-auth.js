require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('./src/config');
const User = require('./src/models/userModel');

async function testAuth() {
  console.log('Testing authentication flow...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Check if test user exists
    const testEmail = 'admin@example.com';
    console.log(`Checking if user ${testEmail} exists...`);
    
    let user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('Test user not found, creating...');
      user = new User({
        email: testEmail,
        password: 'password123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true
      });
      
      await user.save();
      console.log('Test user created');
    } else {
      console.log('Test user found:', user.email);
    }
    
    // Generate a token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    
    console.log('Token generated successfully');
    console.log('Token:', token);
    
    // Verify the token
    console.log('Verifying token...');
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log('Token verified successfully');
    console.log('Decoded token:', decoded);
    
    // Test token expiration
    console.log('JWT expiration setting:', config.JWT_EXPIRES_IN);
    console.log('Token expiration date:', new Date(decoded.exp * 1000).toISOString());
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed successfully');
    
    console.log('\nAuthentication test completed successfully');
    console.log('\nTo test in the frontend:');
    console.log('1. Open browser console');
    console.log('2. Run: localStorage.setItem("authToken", "' + token + '")');
    console.log('3. Run: localStorage.setItem("user", JSON.stringify(' + JSON.stringify({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }) + '))');
    console.log('4. Refresh the page');
    
  } catch (error) {
    console.error('Authentication test failed:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testAuth();
