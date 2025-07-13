const mongoose = require('mongoose');
const Delivery = require('../models/deliveryModel');
const Deliverer = require('../models/delivererModel');
const User = require('../models/userModel');
require('dotenv').config();

const sampleDeliveries = [
  {
    orderId: 'ORD-001',
    customer: 'John Smith',
    deliveryAddress: '123 Main St, New York, NY 10001',
    status: 'Pending',
    priority: 'High',
    estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    notes: 'Customer prefers morning delivery',
  },
  {
    orderId: 'ORD-002',
    customer: 'Sarah Johnson',
    deliveryAddress: '456 Oak Ave, Los Angeles, CA 90210',
    status: 'In Transit',
    priority: 'Medium',
    estimatedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    notes: 'Fragile items - handle with care',
  },
  {
    orderId: 'ORD-003',
    customer: 'Michael Brown',
    deliveryAddress: '789 Pine Rd, Chicago, IL 60601',
    status: 'Delivered',
    priority: 'Low',
    estimatedDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    actualDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    notes: 'Left at front door as requested',
  },
  {
    orderId: 'ORD-004',
    customer: 'Emily Davis',
    deliveryAddress: '321 Elm St, Miami, FL 33101',
    status: 'Pending',
    priority: 'Urgent',
    estimatedDeliveryDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000), // 12 hours from now
    notes: 'Rush order - customer called to confirm',
  },
  {
    orderId: 'ORD-005',
    customer: 'Robert Wilson',
    deliveryAddress: '654 Maple Dr, Seattle, WA 98101',
    status: 'In Transit',
    priority: 'Medium',
    estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    notes: 'Call customer before delivery',
  },
  {
    orderId: 'ORD-006',
    customer: 'Lisa Anderson',
    deliveryAddress: '987 Birch Ln, Austin, TX 78701',
    status: 'Cancelled',
    priority: 'Low',
    estimatedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    notes: 'Customer requested cancellation',
  },
  {
    orderId: 'ORD-007',
    customer: 'David Martinez',
    deliveryAddress: '147 Cedar St, Denver, CO 80201',
    status: 'Delivered',
    priority: 'High',
    estimatedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    actualDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    notes: 'Successfully delivered to reception',
  },
  {
    orderId: 'ORD-008',
    customer: 'Jessica Taylor',
    deliveryAddress: '258 Spruce Ave, Boston, MA 02101',
    status: 'Pending',
    priority: 'Medium',
    estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    notes: 'Apartment buzzer code: 1234',
  },
  {
    orderId: 'ORD-009',
    customer: 'Christopher Lee',
    deliveryAddress: '369 Fir Blvd, Portland, OR 97201',
    status: 'In Transit',
    priority: 'High',
    estimatedDeliveryDate: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000), // 1.5 days from now
    notes: 'Signature required for delivery',
  },
  {
    orderId: 'ORD-010',
    customer: 'Amanda White',
    deliveryAddress: '741 Ash Ct, Phoenix, AZ 85001',
    status: 'Pending',
    priority: 'Low',
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    notes: 'Weekend delivery preferred',
  },
];

const seedDeliveries = async () => {
  try {
    console.log('🌱 Starting delivery seeding process...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create an admin user for createdBy field
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      console.log(
        '❌ Admin user not found. Please create an admin user first.'
      );
      process.exit(1);
    }

    // Find available deliverers
    const deliverers = await Deliverer.find();
    console.log(`📦 Found ${deliverers.length} deliverers in database`);

    // Clear existing deliveries
    await Delivery.deleteMany({});
    console.log('🗑️ Cleared existing deliveries');

    // Create new deliveries
    const deliveriesWithCreator = sampleDeliveries.map((delivery, index) => ({
      ...delivery,
      createdBy: adminUser._id,
      // Randomly assign deliverers to some deliveries
      deliverer:
        deliverers.length > 0 && Math.random() > 0.3
          ? deliverers[index % deliverers.length]._id
          : undefined,
    }));

    const createdDeliveries = await Delivery.insertMany(deliveriesWithCreator);
    console.log(`✅ Created ${createdDeliveries.length} sample deliveries`);

    // Update deliverer assignments
    if (deliverers.length > 0) {
      for (const deliverer of deliverers) {
        const assignedDeliveries = createdDeliveries
          .filter(
            delivery =>
              delivery.deliverer?.toString() === deliverer._id.toString()
          )
          .map(delivery => delivery._id);

        if (assignedDeliveries.length > 0) {
          await Deliverer.findByIdAndUpdate(deliverer._id, {
            $push: { deliveries: { $each: assignedDeliveries } },
          });
          console.log(
            `👤 Assigned ${assignedDeliveries.length} deliveries to ${deliverer.name}`
          );
        }
      }
    }

    console.log('🎉 Delivery seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Total deliveries: ${createdDeliveries.length}`);
    console.log(
      `   • Pending: ${createdDeliveries.filter(d => d.status === 'Pending').length}`
    );
    console.log(
      `   • In Transit: ${createdDeliveries.filter(d => d.status === 'In Transit').length}`
    );
    console.log(
      `   • Delivered: ${createdDeliveries.filter(d => d.status === 'Delivered').length}`
    );
    console.log(
      `   • Cancelled: ${createdDeliveries.filter(d => d.status === 'Cancelled').length}`
    );
  } catch (error) {
    console.error('❌ Error seeding deliveries:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding script
if (require.main === module) {
  seedDeliveries();
}

module.exports = seedDeliveries;
