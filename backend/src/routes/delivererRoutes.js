const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createDeliverer,
  getAllDeliverers,
  getAvailableDeliverers,
  getDelivererById,
  updateDeliverer,
  deleteDeliverer,
  getDelivererStats
} = require("../controllers/delivererController");

const router = express.Router();

// Validation middleware
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

// Create Deliverer (Admin Only)
router.post("/", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("phone")
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Please provide a valid phone number"),
    body("vehicleType")
      .optional()
      .isIn(["Car", "Motorcycle", "Van", "Truck", "Bicycle"])
      .withMessage("Invalid vehicle type"),
    body("licenseNumber")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("License number must be between 5 and 20 characters")
  ],
  handleValidationErrors,
  createDeliverer
);

// Get All Deliverers with Pagination (Admin Only)
router.get("/", 
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllDeliverers
);

// Get Available Deliverers (for assignment)
router.get("/available", 
  authMiddleware,
  roleMiddleware(["admin"]),
  getAvailableDeliverers
);

// Get Single Deliverer
router.get("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid deliverer ID")
  ],
  handleValidationErrors,
  getDelivererById
);

// Update Deliverer (Admin Only)
router.put("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid deliverer ID"),
    body("name")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("phone")
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Please provide a valid phone number"),
    body("status")
      .optional()
      .isIn(["Available", "Busy", "Offline"])
      .withMessage("Status must be Available, Busy, or Offline"),
    body("vehicleType")
      .optional()
      .isIn(["Car", "Motorcycle", "Van", "Truck", "Bicycle"])
      .withMessage("Invalid vehicle type")
  ],
  handleValidationErrors,
  updateDeliverer
);

// Delete Deliverer (Admin Only)
router.delete("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid deliverer ID")
  ],
  handleValidationErrors,
  deleteDeliverer
);

// Get Deliverer Performance Stats (Admin Only)
router.get("/:id/stats", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid deliverer ID")
  ],
  handleValidationErrors,
  getDelivererStats
);

module.exports = router;
