require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('🔄 Testing MongoDB connection...');
  console.log(
    '📍 Connection URI:',
    process.env.MONGO_URI?.replace(/:[^:@]*@/, ':****@')
  );

  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('🔌 Ready State:', conn.connection.readyState);

    // Test creating a document
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now },
    });
    const TestModel = mongoose.model('ConnectionTest', testSchema);

    console.log('🧪 Testing document creation...');
    const doc = new TestModel({ name: 'Connection Test' });
    await doc.save();
    console.log('✅ Test document created successfully!');
    console.log('📄 Document ID:', doc._id);

    // Clean up test document
    await TestModel.deleteMany({});
    console.log('🧹 Test document cleaned up!');

    // Test collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      '📁 Available collections:',
      collections.map(c => c.name)
    );

    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully!');
    console.log('🎉 Connection test completed successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('🔍 Error details:', error.message);

    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication issue - check username/password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network issue - check internet connection');
    } else if (error.message.includes('timeout')) {
      console.error('⏱️  Timeout issue - check network access');
    }

    process.exit(1);
  }
};

testConnection();
