const Delivery = require('../models/deliveryModel');
const Deliverer = require('../models/delivererModel');

/**
 * Job to detect and handle overdue deliveries
 * Runs every 30 minutes to check for deliveries that are past their estimated delivery date
 */
const overdueDeliveryJob = async () => {
  console.log('🔍 Checking for overdue deliveries...');

  try {
    const now = new Date();

    // Find deliveries that are overdue
    // Criteria: Status is 'In Transit' and estimated delivery date has passed
    const overdueDeliveries = await Delivery.find({
      status: 'In Transit',
      estimatedDeliveryDate: { $lt: now },
    }).populate('deliverer', 'name email phone');

    if (overdueDeliveries.length === 0) {
      console.log('✅ No overdue deliveries found');
      return {
        success: true,
        overdueCount: 0,
        message: 'No overdue deliveries found',
      };
    }

    console.log(`⚠️  Found ${overdueDeliveries.length} overdue deliveries`);

    const processedDeliveries = [];
    const notifications = [];

    for (const delivery of overdueDeliveries) {
      const hoursOverdue = Math.round(
        (now - delivery.estimatedDeliveryDate) / (1000 * 60 * 60)
      );

      // Determine action based on how long it's been overdue
      let action = 'flagged';
      const _newStatus = 'In Transit'; // Keep status but flag as overdue

      // If more than 24 hours overdue, consider it critical
      if (hoursOverdue > 24) {
        action = 'critical';
        // Add notes about being critically overdue
        delivery.notes =
          (delivery.notes || '') +
          `\n[AUTO] CRITICAL: ${hoursOverdue} hours overdue as of ${now.toISOString()}`;
      } else {
        // Add notes about being overdue
        delivery.notes =
          (delivery.notes || '') +
          `\n[AUTO] OVERDUE: ${hoursOverdue} hours overdue as of ${now.toISOString()}`;
      }

      // Save the updated delivery
      await delivery.save();

      processedDeliveries.push({
        orderId: delivery.orderId,
        customer: delivery.customer,
        deliverer: delivery.deliverer ? delivery.deliverer.name : 'Unassigned',
        hoursOverdue,
        action,
        estimatedDeliveryDate: delivery.estimatedDeliveryDate,
      });

      // Create notification for admin/dispatcher
      notifications.push({
        type: 'OVERDUE_DELIVERY',
        priority: hoursOverdue > 24 ? 'HIGH' : 'MEDIUM',
        title: `Delivery Overdue: ${delivery.orderId}`,
        message:
          `Delivery for ${delivery.customer} is ${hoursOverdue} hours overdue. ` +
          `Assigned to: ${delivery.deliverer ? delivery.deliverer.name : 'Unassigned'}`,
        data: {
          deliveryId: delivery._id,
          orderId: delivery.orderId,
          customer: delivery.customer,
          deliverer: delivery.deliverer,
          hoursOverdue,
          estimatedDeliveryDate: delivery.estimatedDeliveryDate,
        },
        createdAt: now,
      });

      // If deliverer is assigned, check their performance
      if (delivery.deliverer) {
        await updateDelivererPerformanceMetrics(delivery.deliverer._id);
      }
    }

    // Log summary
    console.log('📊 Overdue Delivery Summary:', {
      totalOverdue: overdueDeliveries.length,
      critical: processedDeliveries.filter(d => d.action === 'critical').length,
      flagged: processedDeliveries.filter(d => d.action === 'flagged').length,
    });

    // Store notifications for the notification job to process
    await storeNotifications(notifications);

    return {
      success: true,
      overdueCount: overdueDeliveries.length,
      processed: processedDeliveries,
      notifications: notifications.length,
      message: `Processed ${overdueDeliveries.length} overdue deliveries`,
    };
  } catch (error) {
    console.error('❌ Error in overdue delivery job:', error);
    throw error;
  }
};

/**
 * Update deliverer performance metrics when they have overdue deliveries
 */
const updateDelivererPerformanceMetrics = async delivererId => {
  try {
    const deliverer = await Deliverer.findById(delivererId);
    if (!deliverer) return;

    // Calculate recent performance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDeliveries = await Delivery.find({
      deliverer: delivererId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const overdueDeliveries = recentDeliveries.filter(
      d =>
        d.status === 'In Transit' &&
        d.estimatedDeliveryDate &&
        d.estimatedDeliveryDate < new Date()
    );

    const overdueRate =
      recentDeliveries.length > 0
        ? (overdueDeliveries.length / recentDeliveries.length) * 100
        : 0;

    // Update deliverer status if overdue rate is too high
    if (overdueRate > 20) {
      // More than 20% overdue rate
      console.log(
        `⚠️  Deliverer ${deliverer.name} has high overdue rate: ${overdueRate.toFixed(1)}%`
      );

      // You might want to implement performance tracking in the deliverer model
      // For now, we'll just log it
    }
  } catch (error) {
    console.error('❌ Error updating deliverer performance metrics:', error);
  }
};

/**
 * Store notifications for processing by the notification job
 */
const storeNotifications = async notifications => {
  try {
    // In a real application, you might store these in a notifications collection
    // For now, we'll store them in memory or a simple file
    // This is a placeholder - implement according to your notification system

    const fs = require('fs').promises;
    const path = require('path');

    const notificationFile = path.join(
      __dirname,
      '../data/pending_notifications.json'
    );

    try {
      // Read existing notifications
      let existingNotifications = [];
      try {
        const data = await fs.readFile(notificationFile, 'utf8');
        existingNotifications = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is empty, start with empty array
        existingNotifications = [];
      }

      // Add new notifications
      existingNotifications.push(...notifications);

      // Ensure data directory exists
      await fs.mkdir(path.dirname(notificationFile), { recursive: true });

      // Write updated notifications
      await fs.writeFile(
        notificationFile,
        JSON.stringify(existingNotifications, null, 2)
      );

      console.log(
        `📧 Stored ${notifications.length} notifications for processing`
      );
    } catch (error) {
      console.error('❌ Error storing notifications:', error);
    }
  } catch (error) {
    console.error('❌ Error in storeNotifications:', error);
  }
};

/**
 * Get statistics about overdue deliveries (for monitoring)
 */
const getOverdueDeliveryStats = async () => {
  try {
    const now = new Date();

    const stats = await Delivery.aggregate([
      {
        $match: {
          status: 'In Transit',
          estimatedDeliveryDate: { $exists: true },
        },
      },
      {
        $addFields: {
          hoursFromEstimated: {
            $divide: [
              { $subtract: [now, '$estimatedDeliveryDate'] },
              1000 * 60 * 60, // Convert to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalInTransit: { $sum: 1 },
          overdue: {
            $sum: {
              $cond: [{ $gt: ['$hoursFromEstimated', 0] }, 1, 0],
            },
          },
          criticallyOverdue: {
            $sum: {
              $cond: [{ $gt: ['$hoursFromEstimated', 24] }, 1, 0],
            },
          },
          avgHoursOverdue: {
            $avg: {
              $cond: [
                { $gt: ['$hoursFromEstimated', 0] },
                '$hoursFromEstimated',
                null,
              ],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalInTransit: 0,
        overdue: 0,
        criticallyOverdue: 0,
        avgHoursOverdue: 0,
      }
    );
  } catch (error) {
    console.error('❌ Error getting overdue delivery stats:', error);
    return null;
  }
};

module.exports = {
  overdueDeliveryJob,
  getOverdueDeliveryStats,
  updateDelivererPerformanceMetrics,
};
