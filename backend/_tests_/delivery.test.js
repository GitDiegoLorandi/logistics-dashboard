const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const deliveryRoutes = require("../src/routes/deliveryRoutes");

const app = express();
app.use(express.json());
app.use("/api/deliveries", deliveryRoutes);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Delivery API Tests", () => {

  // Test GET /api/deliveries (Fetch all deliveries)
  it("should fetch all deliveries", async () => {
    const res = await request(app).get("/api/deliveries");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  // Test POST /api/deliveries (Create a new delivery)
  it("should create a new delivery", async () => {
    const res = await request(app).post("/api/deliveries").send({
      orderId: "DEL123",
      status: "Pending",
      customer: "John Doe",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  // Test POST /api/deliveries with invalid data
  it("should return 400 for invalid delivery creation", async () => {
    const res = await request(app).post("/api/deliveries").send({
      status: "Pending", // Missing orderId and customer
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  // Test PUT /api/deliveries/:id (Update delivery)
  it("should update a delivery", async () => {
    const newDelivery = await request(app).post("/api/deliveries").send({
      orderId: "DEL124",
      status: "Pending",
      customer: "Alice",
    });

    const updatedDelivery = await request(app)
      .put(`/api/deliveries/${newDelivery.body.id}`)
      .send({ status: "Delivered" });

    expect(updatedDelivery.status).toBe(200);
    expect(updatedDelivery.body.status).toBe("Delivered");
  });

  // Test DELETE /api/deliveries/:id (Delete delivery)
  it("should delete a delivery", async () => {
    const newDelivery = await request(app).post("/api/deliveries").send({
      orderId: "DEL125",
      status: "Pending",
      customer: "Bob",
    });

    const deleteResponse = await request(app).delete(`/api/deliveries/${newDelivery.body.id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe("Delivery deleted");
  });
});
