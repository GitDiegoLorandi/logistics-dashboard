const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery,
  assignDeliverer,
  unassignDeliverer
} = require("../controllers/deliveryController");

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
  createDelivery
);

// Get All Deliveries with pagination and filtering
router.get("/", 
  authMiddleware, 
  roleMiddleware(["admin"]), 
  getAllDeliveries
);

// Get single delivery by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["user", "admin"]),
  [
    param("id").isMongoId().withMessage("Invalid delivery ID")
  ],
  handleValidationErrors,
  getDeliveryById
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
  updateDelivery
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
  deleteDelivery
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
  assignDeliverer
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
  unassignDeliverer
);

module.exports = router;
