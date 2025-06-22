const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getAllUsers,
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserRole,
  changePassword,
  deactivateUser,
  deleteUser
} = require("../controllers/userController");

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

// Get All Users (Admin Only)
router.get("/", 
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllUsers
);

// Get Current User Profile
router.get("/profile", 
  authMiddleware,
  getUserProfile
);

// Get Single User (Admin Only)
router.get("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID")
  ],
  handleValidationErrors,
  getUserById
);

// Update User Profile (Self or Admin)
router.put("/profile", 
  authMiddleware,
  [
    body("firstName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("phone")
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Please provide a valid phone number"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail()
  ],
  handleValidationErrors,
  updateUserProfile
);

// Update User Role (Admin Only)
router.put("/:id/role", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("role")
      .isIn(["user", "admin"])
      .withMessage("Role must be either 'user' or 'admin'")
  ],
  handleValidationErrors,
  updateUserRole
);

// Change Password
router.put("/change-password", 
  authMiddleware,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Password confirmation does not match");
        }
        return true;
      })
  ],
  handleValidationErrors,
  changePassword
);

// Deactivate User (Admin Only)
router.put("/:id/deactivate", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID")
  ],
  handleValidationErrors,
  deactivateUser
);

// Delete User (Admin Only) - Soft delete
router.delete("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID")
  ],
  handleValidationErrors,
  deleteUser
);

module.exports = router; 