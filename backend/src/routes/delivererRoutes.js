const express = require("express");
const Deliverer = require("../models/delivererModel");
const router = express.Router();

// Create a new deliverer
router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const deliverer = new Deliverer({ name, email, phone });
    await deliverer.save();
    res.status(201).json(deliverer);
  } catch (error) {
    res.status(400).json({ message: "Error creating deliverer", error });
  }
});

// Fetch all deliverers
router.get("/", async (req, res) => {
  try {
    const deliverers = await Deliverer.find().populate("deliveries");
    res.status(200).json(deliverers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deliverers" });
  }
});

// Fetch a single deliverer by ID
router.get("/:id", async (req, res) => {
  try {
    const deliverer = await Deliverer.findById(req.params.id).populate("deliveries");
    if (!deliverer) return res.status(404).json({ message: "Deliverer not found" });
    res.status(200).json(deliverer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deliverer" });
  }
});

// Update a deliverer
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const deliverer = await Deliverer.findByIdAndUpdate(req.params.id, { name, email, phone }, { new: true });
    if (!deliverer) return res.status(404).json({ message: "Deliverer not found" });
    res.status(200).json(deliverer);
  } catch (error) {
    res.status(400).json({ message: "Error updating deliverer" });
  }
});

// Delete a deliverer
router.delete("/:id", async (req, res) => {
  try {
    await Deliverer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deliverer deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting deliverer" });
  }
});

module.exports = router;
