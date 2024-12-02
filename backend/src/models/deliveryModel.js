const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  status: { type: String, required: true },
  customer: { type: String, required: true },
  deliverer: { type: mongoose.Schema.Types.ObjectId, ref: "Deliverer" },
});

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;
