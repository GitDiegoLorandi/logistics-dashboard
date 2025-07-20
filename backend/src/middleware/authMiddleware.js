const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    
    // Extract token from Authorization header
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : authHeader;
    
    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Standardize the user object - handle different token formats
      req.user = {
        userId: decoded.userId || decoded.id || decoded.sub,
        role: decoded.role
      };
      
      if (!req.user.userId) {
        return res.status(401).json({ 
          message: 'Invalid token format: missing user identifier'
        });
      }
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ message: 'Token expired, please login again' });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication process failed' });
  }
};

module.exports = authMiddleware;
