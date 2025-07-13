const Delivery = require('../models/deliveryModel');
const Deliverer = require('../models/delivererModel');
// const User = require('../models/userModel'); // Currently unused

// Get overall delivery statistics
const getOverallStatistics = async (req, res) => {
  try {
    const totalDeliveries = await Delivery.countDocuments();
    const deliveredCount = await Delivery.countDocuments({
      status: 'Delivered',
    });
    const pendingCount = await Delivery.countDocuments({ status: 'Pending' });
    const inTransitCount = await Delivery.countDocuments({
      status: 'In Transit',
    });
    const cancelledCount = await Delivery.countDocuments({
      status: 'Cancelled',
    });

    const totalDeliverers = await Deliverer.countDocuments();
    const activeDeliverers = await Deliverer.countDocuments({
      deliveries: { $exists: true, $not: { $size: 0 } },
    });

    const deliveryRate =
      totalDeliveries > 0
        ? ((deliveredCount / totalDeliveries) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      totalDeliveries,
      deliveryBreakdown: {
        delivered: deliveredCount,
        pending: pendingCount,
        inTransit: inTransitCount,
        cancelled: cancelledCount,
      },
      deliveryRate: parseFloat(deliveryRate),
      totalDeliverers,
      activeDeliverers,
    });
  } catch (error) {
    console.error('Error fetching overall statistics:', error);
    res.status(500).json({ message: 'Error fetching overall statistics' });
  }
};

// Get deliveries by status
const getDeliveriesByStatus = async (req, res) => {
  try {
    const statusStats = await Delivery.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          percentage: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const totalCount = statusStats.reduce((sum, stat) => sum + stat.count, 0);

    const statusWithPercentage = statusStats.map(stat => ({
      status: stat._id,
      count: stat.count,
      percentage:
        totalCount > 0 ? ((stat.count / totalCount) * 100).toFixed(2) : 0,
    }));

    res.status(200).json(statusWithPercentage);
  } catch (error) {
    console.error('Error fetching status statistics:', error);
    res.status(500).json({ message: 'Error fetching status statistics' });
  }
};

// Get deliveries by date range
const getDeliveriesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchCondition = {};
    if (startDate || endDate) {
      matchCondition.createdAt = {};
      if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
      if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
    }

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
        break;
    }

    const deliveriesByDate = await Delivery.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inTransit: {
            $sum: { $cond: [{ $eq: ['$status', 'In Transit'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      groupBy,
      dateRange: { startDate, endDate },
      data: deliveriesByDate,
    });
  } catch (error) {
    console.error('Error fetching date range statistics:', error);
    res.status(500).json({ message: 'Error fetching date range statistics' });
  }
};

// Get deliverer performance statistics
const getDelivererPerformance = async (req, res) => {
  try {
    const delivererStats = await Delivery.aggregate([
      {
        $match: { deliverer: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: '$deliverer',
          totalDeliveries: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inTransit: {
            $sum: { $cond: [{ $eq: ['$status', 'In Transit'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'deliverers',
          localField: '_id',
          foreignField: '_id',
          as: 'delivererInfo',
        },
      },
      {
        $unwind: '$delivererInfo',
      },
      {
        $addFields: {
          successRate: {
            $cond: [
              { $gt: ['$totalDeliveries', 0] },
              {
                $multiply: [
                  { $divide: ['$delivered', '$totalDeliveries'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          delivererId: '$_id',
          delivererName: '$delivererInfo.name',
          delivererEmail: '$delivererInfo.email',
          totalDeliveries: 1,
          delivered: 1,
          pending: 1,
          inTransit: 1,
          cancelled: 1,
          successRate: { $round: ['$successRate', 2] },
        },
      },
      { $sort: { totalDeliveries: -1 } },
    ]);

    res.status(200).json(delivererStats);
  } catch (error) {
    console.error('Error fetching deliverer performance:', error);
    res.status(500).json({ message: 'Error fetching deliverer performance' });
  }
};

// Get delivery trends (last 30 days)
const getDeliveryTrends = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing dates with zero counts
    const dateRange = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    const filledTrends = dateRange.map(date => {
      const existing = trends.find(trend => trend._id === date);
      if (existing) {
        return existing;
      }
      return {
        _id: date,
        statuses: [],
        totalCount: 0,
      };
    });

    res.status(200).json({
      period: 'Last 30 days',
      trends: filledTrends,
    });
  } catch (error) {
    console.error('Error fetching delivery trends:', error);
    res.status(500).json({ message: 'Error fetching delivery trends' });
  }
};

// Get priority-based statistics
const getPriorityStatistics = async (req, res) => {
  try {
    const priorityStats = await Delivery.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inTransit: {
            $sum: { $cond: [{ $eq: ['$status', 'In Transit'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
          },
        },
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$delivered', '$count'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $project: {
          priority: '$_id',
          count: 1,
          delivered: 1,
          pending: 1,
          inTransit: 1,
          cancelled: 1,
          completionRate: { $round: ['$completionRate', 2] },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json(priorityStats);
  } catch (error) {
    console.error('Error fetching priority statistics:', error);
    res.status(500).json({ message: 'Error fetching priority statistics' });
  }
};

module.exports = {
  getOverallStatistics,
  getDeliveriesByStatus,
  getDeliveriesByDateRange,
  getDelivererPerformance,
  getDeliveryTrends,
  getPriorityStatistics,
};
