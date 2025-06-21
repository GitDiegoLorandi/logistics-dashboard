require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/userModel');

const testAuth = async () => {
  try {
    console.log('🔄 Testing authentication system...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Test user creation
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Clean up any existing test user
    await User.deleteOne({ email: testEmail });
    console.log('🧹 Cleaned up existing test user');
    
    // Create new user
    console.log('👤 Creating test user...');
    const newUser = await User.create({
      email: testEmail,
      password: testPassword,
      role: 'user'
    });
    
    console.log('✅ User created successfully:');
    console.log('   ID:', newUser._id);
    console.log('   Email:', newUser.email);
    console.log('   Role:', newUser.role);
    console.log('   Password hashed:', newUser.password.startsWith('$2b$'));
    
    // Test password comparison
    console.log('🔐 Testing password comparison...');
    const isPasswordValid = await newUser.comparePassword(testPassword);
    console.log('   Password valid:', isPasswordValid);
    
    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log('🧹 Test user cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testAuth(); 