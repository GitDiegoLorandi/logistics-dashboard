const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  status: { type: String, required: true },
  customer: { type: String, required: true },
});

module.exports = mongoose.model("Delivery", deliverySchema);
