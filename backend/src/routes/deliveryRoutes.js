const express = require("express");
const { body, param, validationResult } = require("express-validator");
const Delivery = require("../models/deliveryModel");
const Deliverer = require("../models/delivererModel");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Middleware for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array()
    });
  }
  next();
};

// Create Delivery
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["user", "admin"]),
  [
    body("orderId")
      .notEmpty()
      .withMessage("Order ID is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Order ID must be between 3 and 50 characters"),
    body("status")
      .optional()
      .isIn(["Pending", "In Transit", "Delivered", "Cancelled"])
      .withMessage("Invalid status"),
    body("customer")
      .notEmpty()
      .withMessage("Customer is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Customer name must be between 2 and 100 characters"),
    body("priority")
      .optional()
      .isIn(["Low", "Medium", "High", "Urgent"])
      .withMessage("Invalid priority level"),
    body("deliveryAddress")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Delivery address must not exceed 200 characters"),
    body("estimatedDeliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Estimated delivery date must be in ISO 8601 format"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes must not exceed 500 characters")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const deliveryData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const newDelivery = await Delivery.create(deliveryData);
      res.status(201).json(newDelivery);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: "Order ID already exists" });
      }
      console.error("Error creating delivery:", error);
      res.status(500).json({ message: "Error creating delivery" });
    }
  }
);

// Get All Deliveries with pagination and filtering
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      deliverer,
      startDate,
      endDate 
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (deliverer) filter.deliverer = deliverer;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'deliverer', select: 'name email' },
        { path: 'createdBy', select: 'email' }
      ]
    };

    const deliveries = await Delivery.paginate(filter, options);
    res.status(200).json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({ message: "Error fetching deliveries" });
  }
});

// Get single delivery by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["user", "admin"]),
  [
    param("id").isMongoId().withMessage("Invalid delivery ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const delivery = await Delivery.findById(req.params.id)
        .populate('deliverer', 'name email phone')
        .populate('createdBy', 'email');
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.status(200).json(delivery);
    } catch (error) {
      console.error("Error fetching delivery:", error);
      res.status(500).json({ message: "Error fetching delivery" });
    }
  }
);

// Update a Delivery by ID (Admin Only)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid delivery ID"),
    body("status")
      .optional()
      .isIn(["Pending", "In Transit", "Delivered", "Cancelled"])
      .withMessage("Status must be valid"),
    body("priority")
      .optional()
      .isIn(["Low", "Medium", "High", "Urgent"])
      .withMessage("Invalid priority level"),
    body("deliveryAddress")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Delivery address must not exceed 200 characters"),
    body("estimatedDeliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Estimated delivery date must be in ISO 8601 format"),
    body("actualDeliveryDate")
      .optional()
      .isISO8601()
      .withMessage("Actual delivery date must be in ISO 8601 format"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes must not exceed 500 characters")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Auto-set actual delivery date when status changes to "Delivered"
      if (req.body.status === "Delivered" && !req.body.actualDeliveryDate) {
        req.body.actualDeliveryDate = new Date();
      }

      const updatedDelivery = await Delivery.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
      )
        .populate('deliverer', 'name email')
        .populate('createdBy', 'email');
      
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
  [
    param("id").isMongoId().withMessage("Invalid delivery ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);
      if (!deletedDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      // Remove delivery reference from deliverer
      if (deletedDelivery.deliverer) {
        await Deliverer.findByIdAndUpdate(
          deletedDelivery.deliverer,
          { $pull: { deliveries: req.params.id } }
        );
      }
      
      res.status(200).json({ message: "Delivery deleted successfully" });
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Error deleting delivery" });
    }
  }
);

// Assign deliverer to delivery
router.put(
  "/:id/assign",
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid delivery ID"),
    body("delivererId").isMongoId().withMessage("Invalid deliverer ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { delivererId } = req.body;
      
      const deliverer = await Deliverer.findById(delivererId);
      if (!deliverer) {
        return res.status(404).json({ message: "Deliverer not found" });
      }

      const delivery = await Delivery.findByIdAndUpdate(
        req.params.id, 
        { deliverer: delivererId }, 
        { new: true }
      ).populate('deliverer', 'name email');
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      // Add delivery to deliverer's deliveries array if not already present
      if (!deliverer.deliveries.includes(delivery._id)) {
        deliverer.deliveries.push(delivery._id);
        await deliverer.save();
      }

      res.status(200).json(delivery);
    } catch (error) {
      console.error("Error assigning deliverer:", error);
      res.status(500).json({ message: "Error assigning deliverer" });
    }
  }
);

// Remove deliverer from delivery
router.put(
  "/:id/unassign",
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid delivery ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const delivery = await Delivery.findById(req.params.id);
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }

      const previousDelivererId = delivery.deliverer;
      
      // Remove deliverer from delivery
      delivery.deliverer = undefined;
      await delivery.save();

      // Remove delivery from deliverer's array
      if (previousDelivererId) {
        await Deliverer.findByIdAndUpdate(
          previousDelivererId,
          { $pull: { deliveries: delivery._id } }
        );
      }

      res.status(200).json({ message: "Deliverer unassigned successfully", delivery });
    } catch (error) {
      console.error("Error unassigning deliverer:", error);
      res.status(500).json({ message: "Error unassigning deliverer" });
    }
  }
);

module.exports = router;
