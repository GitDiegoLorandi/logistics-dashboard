const express = require("express");
const { body, param, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

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
  async (req, res) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;

      const filter = {};
      if (role) filter.role = role;
      if (search) {
        filter.email = { $regex: search, $options: 'i' };
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select: '-password' // Exclude password field
      };

      const users = await User.paginate(filter, options);
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  }
);

// Get Current User Profile
router.get("/profile", 
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Error fetching user profile" });
    }
  }
);

// Get Single User (Admin Only)
router.get("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  }
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
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const allowedUpdates = ['firstName', 'lastName', 'phone', 'email'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // Check if email is already taken
      if (updates.email) {
        const existingUser = await User.findOne({ 
          email: updates.email, 
          _id: { $ne: req.user.userId } 
        });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  }
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
  async (req, res) => {
    try {
      // Prevent admin from demoting themselves
      if (req.params.id === req.user.userId && req.body.role !== 'admin') {
        return res.status(400).json({ message: "Cannot change your own admin role" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: "User role updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role" });
    }
  }
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
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await User.findByIdAndUpdate(req.user.userId, { password: hashedNewPassword });

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Error changing password" });
    }
  }
);

// Deactivate User (Admin Only)
router.put("/:id/deactivate", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Prevent admin from deactivating themselves
      if (req.params.id === req.user.userId) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: "User deactivated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Error deactivating user" });
    }
  }
);

// Delete User (Admin Only) - Soft delete
router.delete("/:id", 
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid user ID")
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Prevent admin from deleting themselves
      if (req.params.id === req.user.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Soft delete - mark as deleted instead of removing
      await User.findByIdAndUpdate(req.params.id, { 
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
      });

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  }
);

module.exports = router; 