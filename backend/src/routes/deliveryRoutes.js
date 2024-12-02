const express = require("express");
const { body, validationResult } = require("express-validator");
const Delivery = require("../models/deliveryModel");
const Deliverer = require("../models/delivererModel");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Create Delivery
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["user", "admin"]),
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("status").isIn(["Pending", "In Transit", "Delivered"]).withMessage("Invalid status"),
    body("customer").notEmpty().withMessage("Customer is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const newDelivery = await Delivery.create(req.body);
      res.status(201).json(newDelivery);
    } catch (error) {
      res.status(500).json({ message: "Error creating delivery" });
    }
  }
);

// Get All Deliveries
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deliveries" });
  }
});

// Update a Delivery by ID (Admin Only)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    body("status").isIn(["Pending", "In Transit", "Delivered"]).withMessage("Status must be valid"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const updatedDelivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      res.status(200).json(updatedDelivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Error updating delivery" });
    }
  }
);

// Delete a Delivery by ID (Admin Only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);
      if (!deletedDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      res.status(200).json({ message: "Delivery deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Error deleting delivery" });
    }
  }
);

// Attach deliverer to delivery
router.put("/:id/assign", async (req, res) => {
  try {
    const { delivererId } = req.body;
    const deliverer = await Deliverer.findById(delivererId);
    if (!deliverer) return res.status(404).json({ message: "Deliverer not found" });

    const delivery = await Delivery.findByIdAndUpdate(req.params.id, { deliverer: delivererId }, { new: true });
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    deliverer.deliveries.push(delivery._id);
    await deliverer.save();

    res.status(200).json(delivery);
  } catch (error) {
    res.status(500).json({ message: "Error assigning deliverer" });
  }
});

// Fetch deliveries statistics
router.get("/statistics", async (req, res) => {
  try {
    const totalByStatus = await Delivery.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const deliveriesByDate = await Delivery.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ totalByStatus, deliveriesByDate });
  } catch (error) {
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

module.exports = router;
