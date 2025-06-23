const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');
const Delivery = require('../src/models/deliveryModel');
const Deliverer = require('../src/models/delivererModel');
const statisticsRoutes = require('../src/routes/statisticsRoutes');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/statistics', statisticsRoutes);

let mongoServer;
let adminToken;
let userToken;
let adminUser;
let regularUser;

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create test users
  adminUser = await User.create({
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
  });

  regularUser = await User.create({
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
  });

  // Generate JWT tokens
  adminToken = jwt.sign(
    { userId: adminUser._id, role: adminUser.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  userToken = jwt.sign(
    { userId: regularUser._id, role: regularUser.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Create test data before each test
  const deliverer = await Deliverer.create({
    name: 'Test Deliverer',
    email: 'deliverer@test.com',
    phone: '+1234567890',
    status: 'Available',
    vehicleType: 'Car',
    createdBy: adminUser._id,
  });

  // Create test deliveries with different statuses
  await Delivery.insertMany([
    {
      orderId: 'STAT001',
      status: 'Delivered',
      customer: 'Customer 1',
      priority: 'High',
      deliverer: deliverer._id,
      createdBy: adminUser._id,
      actualDeliveryDate: new Date(),
    },
    {
      orderId: 'STAT002',
      status: 'Pending',
      customer: 'Customer 2',
      priority: 'Medium',
      createdBy: regularUser._id,
    },
    {
      orderId: 'STAT003',
      status: 'In Transit',
      customer: 'Customer 3',
      priority: 'Low',
      deliverer: deliverer._id,
      createdBy: adminUser._id,
    },
    {
      orderId: 'STAT004',
      status: 'Cancelled',
      customer: 'Customer 4',
      priority: 'Urgent',
      createdBy: regularUser._id,
    },
  ]);
});

afterEach(async () => {
  // Clean up test data after each test
  await Delivery.deleteMany({});
  await Deliverer.deleteMany({});
});

describe('Statistics API Tests', () => {
  // Test GET /api/statistics/overall
  it('should fetch overall statistics with user token', async () => {
    const res = await request(app)
      .get('/api/statistics/overall')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalDeliveries', 4);
    expect(res.body).toHaveProperty('deliveryBreakdown');
    expect(res.body.deliveryBreakdown).toHaveProperty('delivered', 1);
    expect(res.body.deliveryBreakdown).toHaveProperty('pending', 1);
    expect(res.body.deliveryBreakdown).toHaveProperty('inTransit', 1);
    expect(res.body.deliveryBreakdown).toHaveProperty('cancelled', 1);
    expect(res.body).toHaveProperty('deliveryRate');
    expect(res.body).toHaveProperty('totalDeliverers', 1);
  });

  // Test GET /api/statistics/status
  it('should fetch deliveries by status', async () => {
    const res = await request(app)
      .get('/api/statistics/status')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(4); // 4 different statuses

    const deliveredStat = res.body.find(stat => stat.status === 'Delivered');
    expect(deliveredStat).toBeDefined();
    expect(deliveredStat.count).toBe(1);
    expect(deliveredStat.percentage).toBe('25.00');
  });

  // Test GET /api/statistics/priority
  it('should fetch priority-based statistics', async () => {
    const res = await request(app)
      .get('/api/statistics/priority')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();

    const highPriority = res.body.find(stat => stat.priority === 'High');
    expect(highPriority).toBeDefined();
    expect(highPriority.count).toBe(1);
    expect(highPriority.delivered).toBe(1);
    expect(highPriority.completionRate).toBe(100);
  });

  // Test GET /api/statistics/deliverers (Admin only)
  it('should fetch deliverer performance with admin token', async () => {
    const res = await request(app)
      .get('/api/statistics/deliverers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(1);

    const delivererStats = res.body[0];
    expect(delivererStats).toHaveProperty('delivererName', 'Test Deliverer');
    expect(delivererStats).toHaveProperty('totalDeliveries', 2);
    expect(delivererStats).toHaveProperty('delivered', 1);
    expect(delivererStats).toHaveProperty('inTransit', 1);
    expect(delivererStats).toHaveProperty('successRate', 50);
  });

  // Test GET /api/statistics/deliverers (User access denied)
  it('should deny access to deliverer performance for regular user', async () => {
    const res = await request(app)
      .get('/api/statistics/deliverers')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // Test GET /api/statistics/trends
  it('should fetch delivery trends', async () => {
    const res = await request(app)
      .get('/api/statistics/trends')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('period', 'Last 30 days');
    expect(res.body).toHaveProperty('trends');
    expect(Array.isArray(res.body.trends)).toBeTruthy();
    expect(res.body.trends).toHaveLength(30); // 30 days of data
  });

  // Test GET /api/statistics/date-range
  it('should fetch deliveries by date range', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(
        `/api/statistics/date-range?startDate=${today}&endDate=${today}&groupBy=day`
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('groupBy', 'day');
    expect(res.body).toHaveProperty('dateRange');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBeTruthy();
  });

  // Test authentication requirement
  it('should require authentication for statistics endpoints', async () => {
    const res = await request(app).get('/api/statistics/overall');

    expect(res.status).toBe(401);
  });

  // Test legacy statistics endpoint
  it('should work with legacy statistics endpoint', async () => {
    const res = await request(app)
      .get('/api/statistics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalByStatus');
    expect(res.body).toHaveProperty('deliveriesByDate');
    expect(Array.isArray(res.body.totalByStatus)).toBeTruthy();
    expect(Array.isArray(res.body.deliveriesByDate)).toBeTruthy();
  });
});
