const mongoose = require('mongoose');
require('dotenv').config();

const migrateDeliveries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB for migration');

    const Delivery = require('../models/deliveryModel');

    // Update existing deliveries to add missing fields
    const result = await Delivery.updateMany(
      { priority: { $exists: false } },
      {
        $set: {
          priority: 'Medium',
          status: { $ifNull: ['$status', 'Pending'] },
        },
      }
    );

    console.log(
      `Migration completed. Updated ${result.modifiedCount} deliveries.`
    );

    // Add indexes for better performance
    await Delivery.collection.createIndex({ status: 1, createdAt: -1 });
    await Delivery.collection.createIndex({ deliverer: 1, status: 1 });
    await Delivery.collection.createIndex({ createdAt: -1 });

    console.log('Indexes created successfully');

    await mongoose.disconnect();
    console.log('Migration script completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateDeliveries();
