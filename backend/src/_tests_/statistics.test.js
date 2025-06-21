const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/userModel");
const Delivery = require("../models/deliveryModel");
const Deliverer = require("../models/delivererModel");
const jwt = require("jsonwebtoken");

describe("Statistics Routes", () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testDeliverer;

  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      email: "user@test.com",
      password: "password123",
      role: "user"
    });
    
    testAdmin = await User.create({
      email: "admin@test.com",
      password: "password123",
      role: "admin"
    });

    // Create test deliverer
    testDeliverer = await Deliverer.create({
      name: "Test Deliverer",
      email: "deliverer@test.com",
      phone: "1234567890"
    });

    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role }, 
      process.env.JWT_SECRET
    );
    
    adminToken = jwt.sign(
      { userId: testAdmin._id, role: testAdmin.role }, 
      process.env.JWT_SECRET
    );

    // Create test deliveries
    const deliveries = [
      {
        orderId: "ORD-001",
        status: "Delivered",
        customer: "Customer 1",
        priority: "High",
        deliverer: testDeliverer._id,
        createdBy: testUser._id
      },
      {
        orderId: "ORD-002",
        status: "Pending",
        customer: "Customer 2",
        priority: "Medium",
        createdBy: testUser._id
      },
      {
        orderId: "ORD-003",
        status: "In Transit",
        customer: "Customer 3",
        priority: "Low",
        deliverer: testDeliverer._id,
        createdBy: testAdmin._id
      }
    ];

    await Delivery.insertMany(deliveries);
  });

  describe("GET /api/statistics/overall", () => {
    it("should return overall statistics for authenticated user", async () => {
      const response = await request(app)
        .get("/api/statistics/overall")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("totalDeliveries", 3);
      expect(response.body).toHaveProperty("deliveryBreakdown");
      expect(response.body.deliveryBreakdown).toHaveProperty("delivered", 1);
      expect(response.body.deliveryBreakdown).toHaveProperty("pending", 1);
      expect(response.body.deliveryBreakdown).toHaveProperty("inTransit", 1);
      expect(response.body).toHaveProperty("deliveryRate");
    });

    it("should return 401 for unauthenticated request", async () => {
      await request(app)
        .get("/api/statistics/overall")
        .expect(401);
    });
  });

  describe("GET /api/statistics/status", () => {
    it("should return status-based statistics", async () => {
      const response = await request(app)
        .get("/api/statistics/status")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const statusItem = response.body[0];
      expect(statusItem).toHaveProperty("status");
      expect(statusItem).toHaveProperty("count");
      expect(statusItem).toHaveProperty("percentage");
    });
  });

  describe("GET /api/statistics/date-range", () => {
    it("should return date range statistics with default grouping", async () => {
      const response = await request(app)
        .get("/api/statistics/date-range")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("groupBy", "day");
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should validate date format", async () => {
      await request(app)
        .get("/api/statistics/date-range?startDate=invalid-date")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });

    it("should validate groupBy parameter", async () => {
      await request(app)
        .get("/api/statistics/date-range?groupBy=invalid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("GET /api/statistics/deliverers", () => {
    it("should return deliverer performance for admin", async () => {
      const response = await request(app)
        .get("/api/statistics/deliverers")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const delivererStat = response.body[0];
        expect(delivererStat).toHaveProperty("delivererName");
        expect(delivererStat).toHaveProperty("totalDeliveries");
        expect(delivererStat).toHaveProperty("successRate");
      }
    });

    it("should deny access to regular users", async () => {
      await request(app)
        .get("/api/statistics/deliverers")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe("GET /api/statistics/trends", () => {
    it("should return delivery trends for last 30 days", async () => {
      const response = await request(app)
        .get("/api/statistics/trends")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("period", "Last 30 days");
      expect(response.body).toHaveProperty("trends");
      expect(Array.isArray(response.body.trends)).toBe(true);
      expect(response.body.trends).toHaveLength(30); // Should have 30 days of data
    });
  });

  describe("GET /api/statistics/priority", () => {
    it("should return priority-based statistics", async () => {
      const response = await request(app)
        .get("/api/statistics/priority")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const priorityStat = response.body[0];
        expect(priorityStat).toHaveProperty("priority");
        expect(priorityStat).toHaveProperty("count");
        expect(priorityStat).toHaveProperty("completionRate");
      }
    });
  });

  describe("GET /api/statistics/ (legacy endpoint)", () => {
    it("should return legacy statistics format", async () => {
      const response = await request(app)
        .get("/api/statistics/")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("totalByStatus");
      expect(response.body).toHaveProperty("deliveriesByDate");
      expect(Array.isArray(response.body.totalByStatus)).toBe(true);
      expect(Array.isArray(response.body.deliveriesByDate)).toBe(true);
    });
  });
}); 