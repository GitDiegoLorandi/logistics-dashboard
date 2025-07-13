const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Delivery = require('../src/models/deliveryModel');

const router = express.Router();
let mongoServer;

// Test database connection setup
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Delivery.deleteMany({});
});

// Route to test the MongoDB connection
router.get('/test-db', async (req, res) => {
  try {
    // Insert a test document using the actual Delivery model
    const testDelivery = new Delivery({
      orderId: 'TEST123',
      status: 'In Transit',
      customer: 'John Doe',
      priority: 'Medium',
    });
    await testDelivery.save();

    // Retrieve test documents
    const deliveries = await Delivery.find();
    res.status(200).json({
      message: 'Database connection successful',
      count: deliveries.length,
      deliveries: deliveries,
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Additional test to verify model validation
router.get('/test-validation', async (req, res) => {
  try {
    // Try to create an invalid delivery (missing required fields)
    const invalidDelivery = new Delivery({
      status: 'Pending',
      // Missing orderId and customer (required fields)
    });

    await invalidDelivery.save();
    res.status(200).json({ message: 'This should not succeed' });
  } catch (error) {
    // Expected to fail due to validation
    res.status(400).json({
      message: 'Validation working correctly',
      errors: error.errors,
    });
  }
});

describe('Database Connection Tests', () => {
  it('should connect to database and create/retrieve deliveries', async () => {
    // Test creating a delivery
    const delivery = await Delivery.create({
      orderId: 'UNIT_TEST_001',
      status: 'Pending',
      customer: 'Unit Test Customer',
      priority: 'High',
    });

    expect(delivery).toBeDefined();
    expect(delivery.orderId).toBe('UNIT_TEST_001');
    expect(delivery.customer).toBe('Unit Test Customer');

    // Test retrieving deliveries
    const allDeliveries = await Delivery.find();
    expect(allDeliveries).toHaveLength(1);
    expect(allDeliveries[0].orderId).toBe('UNIT_TEST_001');
  });

  it('should enforce required field validation', async () => {
    let error;
    try {
      await Delivery.create({
        status: 'Pending',
        // Missing orderId and customer
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.orderId).toBeDefined();
    expect(error.errors.customer).toBeDefined();
  });

  it('should enforce enum validation for status', async () => {
    let error;
    try {
      await Delivery.create({
        orderId: 'TEST_ENUM',
        customer: 'Test Customer',
        status: 'InvalidStatus',
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });
});

module.exports = router;
