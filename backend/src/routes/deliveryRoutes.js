const express = require("express");
const mongoose = require("mongoose");
const Delivery = require("../models/deliveryModel");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.get("/test-db", async (req, res) => {
  try {
    res.status(200).json({ message: "Test DB route is working" });
  } catch (error) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Get all deliveries
router.get("/", async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.status(200).json(deliveries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deliveries" });
  }
});

router.post(
  "/",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("status").isIn(["Pending", "In Transit", "Delivered"]).withMessage("Status must be valid"),
    body("customer").notEmpty().withMessage("Customer is required"),
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, status, customer } = req.body;
    try {
      const newDelivery = await Delivery.create({ orderId, status, customer });
      res.status(201).json(newDelivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Update a delivery by ID
router.put("/:id", async (req, res) => {
  try {
    // Check if the status is valid
    if (!["Pending", "In Transit", "Delivered"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,  // Find by ID from URL
      req.body,        // New data from request body
      { new: true }    // Return the updated document
    );

    if (!updatedDelivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.status(200).json(updatedDelivery);
  } catch (error) {
    console.error("Error updating delivery:", error);
    res.status(500).json({ message: "Error updating delivery" });
  }
});

// Delete a delivery
router.delete("/:id", async (req, res) => {
  try {
    await Delivery.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Delivery deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting delivery" });
  }
});

module.exports = router;