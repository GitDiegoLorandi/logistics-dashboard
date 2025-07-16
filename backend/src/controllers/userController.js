const User = require('../models/userModel');
// const bcrypt = require('bcrypt'); // Currently unused in this controller

// Get All Users (Admin Only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const filter = { isActive: true }; // Only active users
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password',
    };

    const users = await User.paginate(filter, options);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get Current User Profile
const getUserProfile = async (req, res) => {
  try {
    // Check if req.user exists
    if (!req.user) {
      console.error('User not authenticated: req.user is null or undefined');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Log full request user object for debugging
    console.log('User object in request:', JSON.stringify(req.user));
    
    // Check if userId exists
    if (!req.user.userId) {
      console.error('Invalid token structure: Missing userId in token payload');
      return res.status(400).json({ message: 'Invalid token structure: Missing userId' });
    }

    const userId = req.user.userId;
    console.log(`Attempting to find user with ID: ${userId}`);
    
    try {
      // First try with direct ID lookup
      let user = null;
      
      // Try different lookup approaches
      if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.log('Using MongoDB ObjectId lookup');
        // Valid MongoDB ObjectId format
        user = await User.findById(userId).select('-password');
      } else {
        console.log('Using alternative lookup methods since ID is not a valid MongoDB ObjectId');
        // Try different lookup methods
        user = await User.findOne({
          $or: [
            { _id: userId }, // Try anyway
            { id: userId },  // Maybe the ID is stored in a different field
            { email: req.user.email } // Use email if available in the token
          ]
        }).select('-password');
      }
      
      if (!user) {
        console.log(`No user found with ID: ${userId}`);
        
        // As a fallback, try to find by email if available in local storage
        if (req.user.email) {
          console.log(`Trying to find user by email: ${req.user.email}`);
          user = await User.findOne({ email: req.user.email }).select('-password');
          if (user) {
            console.log('Found user by email');
          }
        }
        
        // If still not found, return not found error
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
      }
      
      if (!user.isActive) {
        console.log(`User found but inactive: ${userId}`);
        return res.status(403).json({ message: 'User account is inactive' });
      }

      console.log(`User found successfully: ${user.email}`);
      res.status(200).json(user);
    } catch (dbError) {
      console.error('Database error when finding user:', dbError);
      
      // Check for specific MongoDB errors
      if (dbError.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      if (dbError.name === 'MongoNetworkError' || dbError.name === 'MongooseServerSelectionError') {
        return res.status(503).json({ message: 'Database connection error' });
      }
      
      throw dbError; // Re-throw for general error handler
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Single User (Admin Only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isActive: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Update User Profile (Self or Admin)
const updateUserProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'email'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Check if email is already taken
    if (updates.email) {
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: req.user.userId },
        isActive: true,
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Use safer lookup method for updating
    let updatedUser;
    const userId = req.user.userId;

    try {
      if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        // Valid MongoDB ObjectId format
        updatedUser = await User.findByIdAndUpdate(userId, updates, {
          new: true,
          runValidators: true,
        }).select('-password');
      } else {
        // Try different lookup methods
        const user = await User.findOne({
          $or: [
            { _id: userId },
            { id: userId },
            { email: req.user.email }
          ]
        });

        if (user) {
          // Update the user
          Object.keys(updates).forEach(key => {
            user[key] = updates[key];
          });

          // Save the updated user
          updatedUser = await user.save();
          updatedUser = updatedUser.toObject();
          delete updatedUser.password;
        }
      }
    } catch (dbError) {
      console.error('Database error when updating user:', dbError);
      if (dbError.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      throw dbError;
    }

    if (!updatedUser || !updatedUser.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Update User Role (Admin Only)
const updateUserRole = async (req, res) => {
  try {
    // Prevent admin from demoting themselves
    if (req.params.id === req.user.userId && req.body.role !== 'admin') {
      return res
        .status(400)
        .json({ message: 'Cannot change your own admin role' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({
      _id: req.user.userId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

// Deactivate User (Admin Only)
const deactivateUser = async (req, res) => {
  try {
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.userId) {
      return res
        .status(400)
        .json({ message: 'Cannot deactivate your own account' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deactivated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Error deactivating user' });
  }
};

// Delete User (Admin Only) - Soft delete
const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.userId) {
      return res
        .status(400)
        .json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete - mark as deleted instead of removing
    await User.findByIdAndUpdate(req.params.id, {
      isActive: false,
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

module.exports = {
  getAllUsers,
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserRole,
  changePassword,
  deactivateUser,
  deleteUser,
};
