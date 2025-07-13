const express = require("express");
const { getDeliveries, addDelivery } = require("../controllers/deliveryController");

const router = express.Router();

// GET all deliveries
router.get("/", getDeliveries);

// POST a new delivery
router.post("/", addDelivery);

module.exports = router;
