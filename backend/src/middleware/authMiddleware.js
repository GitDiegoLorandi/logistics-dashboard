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
    
    // Log token format
    console.log(`Token format check: ${token.substring(0, 15)}...`);
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      console.log('Decoded token:', JSON.stringify(decoded));
      
      // Standardize the user object - handle different token formats
      req.user = {
        userId: decoded.userId || decoded.id || decoded.sub,
        role: decoded.role
      };
      
      if (!req.user.userId) {
        console.error('No user ID found in token. Full decoded token:', JSON.stringify(decoded));
        return res.status(401).json({ 
          message: 'Invalid token format: missing user identifier',
          details: 'Token payload does not contain userId, id, or sub field'
        });
      }
      
      console.log(`User authenticated: ID=${req.user.userId}, Role=${req.user.role}`);
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.log('Token expired:', token.substring(0, 20) + '...');
        return res
          .status(401)
          .json({ message: 'Token expired, please login again' });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        console.log('Invalid token format:', token.substring(0, 20) + '...');
        return res.status(401).json({ message: 'Invalid token format' });
      }
      console.error('JWT Verification Error:', jwtError); // Log the full error for debugging
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication process failed' });
  }
};

module.exports = authMiddleware;
