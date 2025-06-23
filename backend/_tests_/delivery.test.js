const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');
const Delivery = require('../src/models/deliveryModel');
const deliveryRoutes = require('../src/routes/deliveryRoutes');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);

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

afterEach(async () => {
  // Clean up deliveries after each test
  await Delivery.deleteMany({});
});

describe('Delivery API Tests', () => {
  // Test POST /api/deliveries (Create a new delivery)
  it('should create a new delivery with user token', async () => {
    const deliveryData = {
      orderId: 'DEL123',
      status: 'Pending',
      customer: 'John Doe',
      priority: 'Medium',
      deliveryAddress: '123 Test Street',
    };

    const res = await request(app)
      .post('/api/deliveries')
      .set('Authorization', `Bearer ${userToken}`)
      .send(deliveryData);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Delivery created successfully');
    expect(res.body.delivery).toHaveProperty('orderId', 'DEL123');
    expect(res.body.delivery).toHaveProperty('customer', 'John Doe');
    expect(res.body.delivery).toHaveProperty('createdBy');
  });

  // Test POST /api/deliveries with invalid data
  it('should return 400 for invalid delivery creation', async () => {
    const res = await request(app)
      .post('/api/deliveries')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'Pending', // Missing orderId and customer
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  // Test POST /api/deliveries without authentication
  it('should return 401 without authentication', async () => {
    const res = await request(app).post('/api/deliveries').send({
      orderId: 'DEL124',
      status: 'Pending',
      customer: 'Jane Doe',
    });

    expect(res.status).toBe(401);
  });

  // Test GET /api/deliveries (Admin only)
  it('should fetch all deliveries with admin token', async () => {
    // Create test delivery first
    await Delivery.create({
      orderId: 'DEL125',
      status: 'Pending',
      customer: 'Test Customer',
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .get('/api/deliveries')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('docs');
    expect(Array.isArray(res.body.docs)).toBeTruthy();
  });

  // Test GET /api/deliveries (User access denied)
  it('should deny access to regular user for listing all deliveries', async () => {
    const res = await request(app)
      .get('/api/deliveries')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // Test GET /api/deliveries/:id
  it('should fetch single delivery by ID', async () => {
    const delivery = await Delivery.create({
      orderId: 'DEL126',
      status: 'Pending',
      customer: 'Single Test',
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .get(`/api/deliveries/${delivery._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orderId', 'DEL126');
  });

  // Test PUT /api/deliveries/:id (Update delivery - Admin only)
  it('should update a delivery with admin token', async () => {
    const delivery = await Delivery.create({
      orderId: 'DEL127',
      status: 'Pending',
      customer: 'Update Test',
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .put(`/api/deliveries/${delivery._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Delivered' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Delivery updated successfully');
    expect(res.body.delivery.status).toBe('Delivered');
  });

  // Test DELETE /api/deliveries/:id (Delete delivery - Admin only)
  it('should delete a delivery with admin token', async () => {
    const delivery = await Delivery.create({
      orderId: 'DEL128',
      status: 'Pending',
      customer: 'Delete Test',
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .delete(`/api/deliveries/${delivery._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Delivery deleted successfully');

    // Verify delivery is actually deleted
    const deletedDelivery = await Delivery.findById(delivery._id);
    expect(deletedDelivery).toBeNull();
  });
});
