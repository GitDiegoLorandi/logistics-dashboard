const express = require("express");
const Delivery = require("../models/deliveryModel");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Apply authMiddleware and roleMiddleware to all routes
router.use(authMiddleware);  // Ensure that authentication is required for all routes

// Public route for testing DB (no role-based check)
router.get("/test-db", async (req, res) => {
  res.status(200).json({ message: "Test DB route is working" });
});

// Get all deliveries (Admin only)
router.get("/", roleMiddleware(["admin"]), async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deliveries" });
  }
});

// Create a delivery (User and Admin)
router.post("/", roleMiddleware(["user", "admin"]), async (req, res) => {
  try {
    const { orderId, status, customer } = req.body;
    const newDelivery = await Delivery.create({ orderId, status, customer });
    res.status(201).json(newDelivery);
  } catch (error) {
    res.status(500).json({ message: "Error creating delivery" });
  }
});

// Update a delivery by ID (Admin only)
router.put("/:id", roleMiddleware(["admin"]), async (req, res) => {
  try {
    if (!["Pending", "In Transit", "Delivered"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedDelivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.status(200).json(updatedDelivery);
  } catch (error) {
    res.status(500).json({ message: "Error updating delivery" });
  }
});

// Delete a delivery (Admin only)
router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
  try {
    await Delivery.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Delivery deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting delivery" });
  }
});

module.exports = router;
