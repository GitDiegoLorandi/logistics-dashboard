const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Example schema and model (if not already defined elsewhere)
const DeliverySchema = new mongoose.Schema({
  orderId: String,
  status: String,
  customer: String,
});
const Delivery = mongoose.model("Delivery", DeliverySchema);

// Route to test the MongoDB connection
router.get("/test-db", async (req, res) => {
  try {
    // Insert a test document
    const testDelivery = new Delivery({
      orderId: "TEST123",
      status: "In Transit",
      customer: "John Doe",
    });
    await testDelivery.save();

    // Retrieve the test document
    const deliveries = await Delivery.find();
    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error connecting to the database:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

module.exports = router;
