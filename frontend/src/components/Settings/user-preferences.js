import { authAPI } from '../../services/api';

/**
 * Helper functions to manage user preferences and profile data
 */

/**
 * Synchronizes user data from API response with localStorage
 * @param {Object} userData - User data from API response
 */
export const syncUserData = (userData) => {
  if (!userData) return;
  
  try {
    // Get current stored user data
    const storedUser = authAPI.getStoredUser();
    
    // Create merged user data object with new data taking precedence
    const updatedUser = {
      ...(storedUser || {}),
      ...userData,
      // Ensure id is preserved from both sources
      id: userData.id || userData._id || (storedUser && (storedUser.id || storedUser._id)),
      // Add _id if only id exists
      _id: userData._id || userData.id || (storedUser && (storedUser._id || storedUser.id))
    };
    
    // Save updated user data to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    console.log('User data synchronized with localStorage');
    return updatedUser;
  } catch (error) {
    console.error('Error synchronizing user data:', error);
    return userData;
  }
};

/**
 * Ensures user ID format is consistent between frontend and backend
 * @param {Object} userData - User data object
 * @returns {Object} - User data with consistent ID format
 */
export const ensureConsistentUserIdFormat = (userData) => {
  if (!userData) return null;
  
  // Create a copy to avoid modifying the original
  const updatedData = { ...userData };
  
  // Ensure both id and _id are available for MongoDB compatibility
  if (updatedData.id && !updatedData._id) {
    updatedData._id = updatedData.id;
  }
  
  if (updatedData._id && !updatedData.id) {
    updatedData.id = updatedData._id;
  }
  
  return updatedData;
};

/**
 * Gets the best available user data from various sources
 * @returns {Object} User data
 */
export const getBestAvailableUserData = () => {
  // Try stored user first
  const storedUser = authAPI.getStoredUser();
  if (storedUser) {
    return ensureConsistentUserIdFormat(storedUser);
  }
  
  // Return empty object if nothing is available
  return {};
};

export default {
  syncUserData,
  ensureConsistentUserIdFormat,
  getBestAvailableUserData
}; 