const express = require('express');
const { query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getOverallStatistics,
  getDeliveriesByStatus,
  getDeliveriesByDateRange,
  getDelivererPerformance,
  getDeliveryTrends,
  getPriorityStatistics,
} = require('../controllers/statisticsController');

const router = express.Router();

// Middleware for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Get overall statistics - accessible to both users and admins
router.get(
  '/overall',
  authMiddleware,
  roleMiddleware(['user', 'admin']),
  getOverallStatistics
);

// Get deliveries by status - accessible to both users and admins
router.get(
  '/status',
  authMiddleware,
  roleMiddleware(['user', 'admin']),
  getDeliveriesByStatus
);

// Get deliveries by date range with validation
router.get(
  '/date-range',
  authMiddleware,
  roleMiddleware(['user', 'admin']),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Group by must be one of: day, week, month'),
  ],
  handleValidationErrors,
  getDeliveriesByDateRange
);

// Get deliverer performance - admin only
router.get(
  '/deliverers',
  authMiddleware,
  roleMiddleware(['admin']),
  getDelivererPerformance
);

// Get delivery trends (last 30 days)
router.get(
  '/trends',
  authMiddleware,
  roleMiddleware(['user', 'admin']),
  getDeliveryTrends
);

// Get priority-based statistics
router.get(
  '/priority',
  authMiddleware,
  roleMiddleware(['user', 'admin']),
  getPriorityStatistics
);

// Legacy endpoint - keep for backward compatibility
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['user', 'admin']),
  async (req, res) => {
    try {
      // Call the basic statistics that were in deliveryRoutes
      const Delivery = require('../models/deliveryModel');

      const totalByStatus = await Delivery.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const deliveriesByDate = await Delivery.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.status(200).json({ totalByStatus, deliveriesByDate });
    } catch (error) {
      console.error('Error fetching legacy statistics:', error);
      res.status(500).json({ message: 'Error fetching statistics' });
    }
  }
);

module.exports = router;
