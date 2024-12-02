const mongoose = require("mongoose");

const delivererSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  deliveries: [{ type: mongoose.Schema.Types.ObjectId, ref: "Delivery" }]  // List of deliveries
});

module.exports = mongoose.model("Deliverer", delivererSchema);
