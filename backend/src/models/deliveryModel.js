const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  status: { type: String, required: true },
  customer: { type: String, required: true },
});

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;
