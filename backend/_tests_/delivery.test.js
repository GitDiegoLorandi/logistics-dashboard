const request = require("supertest"); // Supertest for HTTP requests
const express = require("express");
const mongoose = require("mongoose");
const deliveryRoutes = require("../src/routes/deliveryRoutes"); // Import delivery routes

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
    expect(res.status).toBe(200); // Check for success status
    expect(Array.isArray(res.body)).toBeTruthy(); // Check if the response is an array
  });

  // Test POST /api/deliveries (Create a new delivery)
  it("should create a new delivery", async () => {
    const res = await request(app).post("/api/deliveries").send({
      orderId: "DEL123",
      status: "Pending",
      customer: "John Doe",
    });
    expect(res.status).toBe(201); // Check if the status is 201 (Created)
    expect(res.body).toHaveProperty("id"); // Ensure the response contains an ID
  });

  // Test POST /api/deliveries with invalid data
  it("should return 400 for invalid delivery creation", async () => {
    const res = await request(app).post("/api/deliveries").send({
      status: "Pending", // Missing orderId and customer
    });
    expect(res.status).toBe(400); // Expecting validation error
    expect(res.body).toHaveProperty("errors"); // Expect validation error messages
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
