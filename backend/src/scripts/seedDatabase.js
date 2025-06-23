require('dotenv').config();
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt'); // Password hashing is handled by User model pre-save hook
const User = require('../models/userModel');
const Deliverer = require('../models/delivererModel');
const Delivery = require('../models/deliveryModel');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Deliverer.deleteMany({});
    await Delivery.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@logistics.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('👤 Admin user created');

    // Create regular user
    const regularUser = await User.create({
      email: 'user@logistics.com',
      password: 'user123',
      role: 'user',
    });
    console.log('👤 Regular user created');

    // Create deliverers
    const deliverers = await Deliverer.insertMany([
      {
        name: 'John Smith',
        email: 'john.smith@logistics.com',
        phone: '+1-555-0101',
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@logistics.com',
        phone: '+1-555-0102',
      },
      {
        name: 'David Johnson',
        email: 'david.johnson@logistics.com',
        phone: '+1-555-0103',
      },
    ]);
    console.log('🚚 Deliverers created');

    // Create sample deliveries
    const deliveries = await Delivery.insertMany([
      {
        orderId: 'ORD-001',
        status: 'Delivered',
        customer: 'Acme Corp',
        priority: 'High',
        deliveryAddress: '123 Business St, New York, NY 10001',
        deliverer: deliverers[0]._id,
        createdBy: adminUser._id,
        actualDeliveryDate: new Date(),
        notes: 'Delivered to reception',
      },
      {
        orderId: 'ORD-002',
        status: 'In Transit',
        customer: 'Tech Solutions Inc',
        priority: 'Medium',
        deliveryAddress: '456 Tech Ave, San Francisco, CA 94105',
        deliverer: deliverers[1]._id,
        createdBy: regularUser._id,
        estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        orderId: 'ORD-003',
        status: 'Pending',
        customer: 'Global Enterprises',
        priority: 'Low',
        deliveryAddress: '789 Enterprise Blvd, Chicago, IL 60601',
        createdBy: adminUser._id,
        estimatedDeliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      {
        orderId: 'ORD-004',
        status: 'Delivered',
        customer: 'StartUp Hub',
        priority: 'Urgent',
        deliveryAddress: '321 Innovation Dr, Austin, TX 73301',
        deliverer: deliverers[2]._id,
        createdBy: regularUser._id,
        actualDeliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        notes: 'Express delivery completed',
      },
      {
        orderId: 'ORD-005',
        status: 'Cancelled',
        customer: 'Old Company',
        priority: 'Medium',
        deliveryAddress: '654 Legacy Rd, Miami, FL 33101',
        createdBy: adminUser._id,
        notes: 'Customer requested cancellation',
      },
    ]);
    console.log('📦 Sample deliveries created');

    // Update deliverers with their deliveries
    for (let i = 0; i < deliverers.length; i++) {
      const delivererDeliveries = deliveries.filter(
        d =>
          d.deliverer && d.deliverer.toString() === deliverers[i]._id.toString()
      );

      if (delivererDeliveries.length > 0) {
        deliverers[i].deliveries = delivererDeliveries.map(d => d._id);
        await deliverers[i].save();
      }
    }
    console.log('🔗 Updated deliverer assignments');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Deliverers: ${await Deliverer.countDocuments()}`);
    console.log(`   - Deliveries: ${await Delivery.countDocuments()}`);
    console.log('');
    console.log('🔐 Login credentials:');
    console.log('   Admin: admin@logistics.com / admin123');
    console.log('   User:  user@logistics.com / user123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
