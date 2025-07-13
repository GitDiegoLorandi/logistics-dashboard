const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');
const Delivery = require('../src/models/deliveryModel');
const Deliverer = require('../src/models/delivererModel');
const deliveryRoutes = require('../src/routes/deliveryRoutes');
const delivererRoutes = require('../src/routes/delivererRoutes');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/deliverers', delivererRoutes);

let mongoServer;
let adminToken;
let adminUser;
let testDelivery;
let testDeliverer;

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create admin user
  adminUser = await User.create({
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
  });

  // Generate admin JWT token
  adminToken = jwt.sign(
    { userId: adminUser._id, role: adminUser.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean up and create fresh test data
  await Delivery.deleteMany({});
  await Deliverer.deleteMany({});

  // Create test delivery
  testDelivery = await Delivery.create({
    orderId: 'TEST-ASSIGN-001',
    status: 'Pending',
    customer: 'Assignment Test Customer',
    priority: 'High',
    deliveryAddress: '123 Test Street',
    createdBy: adminUser._id,
  });

  // Create test deliverer
  testDeliverer = await Deliverer.create({
    name: 'Test Deliverer',
    email: 'deliverer@test.com',
    phone: '+1234567890',
    status: 'Available',
    vehicleType: 'Van',
    isActive: true,
    createdBy: adminUser._id,
  });
});

describe('Deliverer Assignment Logic Tests', () => {
  describe('POST /api/deliveries/:id/assign', () => {
    it('should successfully assign an available deliverer to a pending delivery', async () => {
      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Deliverer assigned successfully');

      // Check delivery status changed
      expect(res.body.delivery.status).toBe('In Transit');
      expect(res.body.delivery.deliverer._id).toBe(
        testDeliverer._id.toString()
      );

      // Check status changes are tracked
      expect(res.body.statusChanges).toBeDefined();
      expect(res.body.statusChanges.delivery.from).toBe('Pending');
      expect(res.body.statusChanges.delivery.to).toBe('In Transit');
      expect(res.body.statusChanges.deliverer.from).toBe('Available');
      expect(res.body.statusChanges.deliverer.to).toBe('Busy');

      // Verify deliverer status changed in database
      const updatedDeliverer = await Deliverer.findById(testDeliverer._id);
      expect(updatedDeliverer.status).toBe('Busy');
      expect(updatedDeliverer.deliveries).toContainEqual(testDelivery._id);
    });

    it('should reject assignment to busy deliverer', async () => {
      // First make deliverer busy
      await Deliverer.findByIdAndUpdate(testDeliverer._id, { status: 'Busy' });

      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('currently busy');
    });

    it('should reject assignment to already assigned delivery', async () => {
      // First assign the delivery
      await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });

      // Try to assign again
      const secondDeliverer = await Deliverer.create({
        name: 'Second Deliverer',
        email: 'deliverer2@test.com',
        status: 'Available',
        vehicleType: 'Car',
        isActive: true,
        createdBy: adminUser._id,
      });

      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: secondDeliverer._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already assigned');
    });

    it('should handle non-existent deliverer', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: fakeId });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Deliverer not found');
    });

    it('should handle non-existent delivery', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/deliveries/${fakeId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Delivery not found');
    });
  });

  describe('PUT /api/deliveries/:id/unassign', () => {
    beforeEach(async () => {
      // Assign deliverer before each unassign test
      await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });
    });

    it('should successfully unassign deliverer from delivery', async () => {
      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/unassign`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Deliverer unassigned successfully');

      // Check delivery status reverted
      expect(res.body.delivery.status).toBe('Pending');
      expect(res.body.delivery.deliverer).toBeUndefined();

      // Check status changes are tracked
      expect(res.body.statusChanges).toBeDefined();
      expect(res.body.statusChanges.delivery.from).toBe('In Transit');
      expect(res.body.statusChanges.delivery.to).toBe('Pending');
      expect(res.body.statusChanges.deliverer.from).toBe('Busy');
      expect(res.body.statusChanges.deliverer.to).toBe('Available');

      // Verify deliverer status changed back in database
      const updatedDeliverer = await Deliverer.findById(testDeliverer._id);
      expect(updatedDeliverer.status).toBe('Available');
      expect(updatedDeliverer.deliveries).not.toContainEqual(testDelivery._id);
    });

    it('should keep deliverer busy if they have other active deliveries', async () => {
      // Create and assign another delivery to the same deliverer
      const secondDelivery = await Delivery.create({
        orderId: 'TEST-ASSIGN-002',
        status: 'Pending',
        customer: 'Second Customer',
        createdBy: adminUser._id,
      });

      await request(app)
        .put(`/api/deliveries/${secondDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });

      // Now unassign the first delivery
      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/unassign`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Deliverer should still be busy because of second delivery
      const updatedDeliverer = await Deliverer.findById(testDeliverer._id);
      expect(updatedDeliverer.status).toBe('Busy');
      expect(updatedDeliverer.deliveries).toContainEqual(secondDelivery._id);
      expect(updatedDeliverer.deliveries).not.toContainEqual(testDelivery._id);
    });

    it('should reject unassigning from non-assigned delivery', async () => {
      // First unassign
      await request(app)
        .put(`/api/deliveries/${testDelivery._id}/unassign`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to unassign again
      const res = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/unassign`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not assigned to any deliverer');
    });
  });

  describe('Integration: Complete Assignment Workflow', () => {
    it('should handle complete assign -> deliver -> unassign workflow', async () => {
      // 1. Assign deliverer
      const assignRes = await request(app)
        .put(`/api/deliveries/${testDelivery._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ delivererId: testDeliverer._id });

      expect(assignRes.status).toBe(200);
      expect(assignRes.body.delivery.status).toBe('In Transit');

      // 2. Mark as delivered
      const deliverRes = await request(app)
        .put(`/api/deliveries/${testDelivery._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Delivered' });

      expect(deliverRes.status).toBe(200);
      expect(deliverRes.body.delivery.status).toBe('Delivered');
      expect(deliverRes.body.delivery.actualDeliveryDate).toBeDefined();

      // 3. Verify deliverer is still busy (has completed delivery)
      const deliverer = await Deliverer.findById(testDeliverer._id);
      expect(deliverer.status).toBe('Busy');
      expect(deliverer.deliveries).toContainEqual(testDelivery._id);

      // 4. Check if deliverer becomes available when no active deliveries
      const activeCount = await Delivery.countDocuments({
        deliverer: testDeliverer._id,
        status: { $in: ['Pending', 'In Transit'] },
      });
      expect(activeCount).toBe(0); // No active deliveries (Delivered status)
    });
  });
});
