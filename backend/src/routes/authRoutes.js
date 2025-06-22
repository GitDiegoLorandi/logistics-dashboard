const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const { body, validationResult } = require("express-validator");

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

// Validate JWT_SECRET on startup
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('📝 Please create a .env file with JWT_SECRET=your-secret-key');
  process.exit(1);
}

// Register
router.post("/register", 
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .optional()
      .isIn(["user", "admin"])
      .withMessage("Role must be either 'user' or 'admin'"),
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
      .withMessage("Please provide a valid phone number")
  ],
  handleValidationErrors,
  async (req, res) => {
    const { email, password, role, firstName, lastName, phone } = req.body;
    let newUser = null;
    
    try {
      console.log("Registration attempt for:", email);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Create user (password will be hashed by the pre-save middleware)
      newUser = await User.create({ 
        email, 
        password, // Don't hash here - let the model do it
        role: role || "user",
        firstName,
        lastName,
        phone
      });
      
      console.log("User created successfully:", newUser._id);

      // Validate JWT_SECRET before generating token
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not configured");
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );
      
      console.log("JWT token generated successfully for:", email);
      
      res.status(201).json({ 
        message: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone
        }
      });
      
    } catch (error) {
      console.error("Registration error:", error);
      
      // If user was created but token generation failed, clean up
      if (newUser && error.message.includes('JWT')) {
        console.log("Cleaning up user due to JWT error:", newUser._id);
        try {
          await User.findByIdAndDelete(newUser._id);
          console.log("User cleanup completed");
        } catch (cleanupError) {
          console.error("Failed to cleanup user:", cleanupError);
        }
      }
      
      // Handle specific errors
      if (error.message.includes('JWT_SECRET')) {
        return res.status(500).json({ 
          message: "Server configuration error", 
          error: "Authentication system not properly configured" 
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: "Validation error", errors: messages });
      }
      
      res.status(500).json({ 
        message: "Server error during registration",
        error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  }
);

// Login
router.post("/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
  ],
  handleValidationErrors,
  async (req, res) => {
    const { email, password } = req.body;
    
    try {
      console.log("Login attempt for:", email);
      
      // Validate JWT_SECRET before proceeding
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not configured");
      }
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      console.log("Login successful for:", email);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );
      
      res.status(200).json({ 
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        }
      });
      
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.message.includes('JWT_SECRET')) {
        return res.status(500).json({ 
          message: "Server configuration error", 
          error: "Authentication system not properly configured" 
        });
      }
      
      res.status(500).json({ 
        message: "Server error during login",
        error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
      });
    }
  }
);

module.exports = router;
