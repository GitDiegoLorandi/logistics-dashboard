const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.startsWith('Bearer ')
    ? req.header('Authorization').replace('Bearer ', '')
    : req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // Attach the user's info to the request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Token expired, please login again' });
    }
    console.error('JWT Verification Error:', error.message); // Log the error message for debugging
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
