const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      minlength: [3, 'Order ID must be at least 3 characters'],
      maxlength: [50, 'Order ID cannot exceed 50 characters'],
      validate: {
        validator: function (_v) {
          // Allow the backend to generate the Order ID
          return true;
        },
        message: props => `${props.value} is not a valid Order ID format`,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    customer: { type: String, required: true },
    deliverer: { type: mongoose.Schema.Types.ObjectId, ref: 'Deliverer' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    deliveryAddress: {
      type: String,
      required: function () {
        // Make deliveryAddress required only if status is not 'Cancelled'
        return this.status !== 'Cancelled';
      },
    },
    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reminderSent: { type: Boolean, default: false },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// Add pagination plugin
deliverySchema.plugin(mongoosePaginate);

// Index for better query performance
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ deliverer: 1, status: 1 });
deliverySchema.index({ createdAt: -1 });
deliverySchema.index({ orderId: 1 });

const Delivery = mongoose.model('Delivery', deliverySchema);
module.exports = Delivery;
