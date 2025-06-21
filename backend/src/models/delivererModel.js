const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const delivererSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: { 
    type: String, 
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  phone: { 
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"]
  },
  status: {
    type: String,
    enum: {
      values: ["Available", "Busy", "Offline"],
      message: "Status must be Available, Busy, or Offline"
    },
    default: "Available"
  },
  vehicleType: {
    type: String,
    enum: {
      values: ["Car", "Motorcycle", "Van", "Truck", "Bicycle"],
      message: "Invalid vehicle type"
    }
  },
  licenseNumber: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: "USA" }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  deliveries: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Delivery" 
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add pagination plugin
delivererSchema.plugin(mongoosePaginate);

// Indexes for better performance
delivererSchema.index({ email: 1 });
delivererSchema.index({ status: 1 });
delivererSchema.index({ vehicleType: 1 });
delivererSchema.index({ createdAt: -1 });

// Virtual for full name
delivererSchema.virtual('fullContactInfo').get(function() {
  return `${this.name} (${this.email}) - ${this.phone || 'No phone'}`;
});

// Don't return sensitive data in JSON
delivererSchema.methods.toJSON = function() {
  const delivererObject = this.toObject();
  return delivererObject;
};

module.exports = mongoose.model("Deliverer", delivererSchema);
