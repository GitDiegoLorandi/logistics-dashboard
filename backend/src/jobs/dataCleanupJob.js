const Delivery = require('../models/deliveryModel');
const User = require('../models/userModel');
const Deliverer = require('../models/delivererModel');
const fs = require('fs').promises;
const path = require('path');

/**
 * Data cleanup job that runs daily at 2:00 AM
 * Handles archiving old deliveries and cleans up unnecessary data
 */
const dataCleanupJob = async () => {
  console.log('🧹 Starting data cleanup job...');

  try {
    const results = {
      archivedDeliveries: 0,
      deletedOldLogs: 0,
      cleanedNotifications: 0,
      optimizedIndexes: false,
      errors: [],
    };

    // 1. Archive completed deliveries older than 90 days
    const archiveResult = await archiveOldDeliveries();
    results.archivedDeliveries = archiveResult.count;
    if (archiveResult.error) results.errors.push(archiveResult.error);

    // 2. Clean up old notification files
    const notificationResult = await cleanupOldNotifications();
    results.cleanedNotifications = notificationResult.count;
    if (notificationResult.error) results.errors.push(notificationResult.error);

    // 3. Clean up old log files
    const logResult = await cleanupOldLogFiles();
    results.deletedOldLogs = logResult.count;
    if (logResult.error) results.errors.push(logResult.error);

    // 4. Remove inactive users (optional - be careful with this)
    const inactiveUserResult = await cleanupInactiveUsers();
    if (inactiveUserResult.error) results.errors.push(inactiveUserResult.error);

    // 5. Optimize database indexes (lightweight check)
    const indexResult = await checkDatabaseIndexes();
    results.optimizedIndexes = indexResult.success;
    if (indexResult.error) results.errors.push(indexResult.error);

    // 6. Generate cleanup report
    await generateCleanupReport(results);

    console.log('✅ Data cleanup completed:', {
      archived: results.archivedDeliveries,
      notifications: results.cleanedNotifications,
      logs: results.deletedOldLogs,
      errors: results.errors.length,
    });

    return {
      success: true,
      results,
      message: `Cleanup completed: ${results.archivedDeliveries} deliveries archived, ${results.errors.length} errors`,
    };
  } catch (error) {
    console.error('❌ Error in data cleanup job:', error);
    throw error;
  }
};

/**
 * Archive deliveries older than 90 days (completed ones)
 */
const archiveOldDeliveries = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find old completed/cancelled deliveries
    const oldDeliveries = await Delivery.find({
      $and: [
        {
          $or: [{ status: 'Delivered' }, { status: 'Cancelled' }],
        },
        { updatedAt: { $lt: ninetyDaysAgo } },
      ],
    });

    if (oldDeliveries.length === 0) {
      console.log('📦 No old deliveries to archive');
      return { count: 0, error: null };
    }

    console.log(`📦 Found ${oldDeliveries.length} old deliveries to archive`);

    // Create archive directory if it doesn't exist
    const archiveDir = path.join(__dirname, '../data/archives');
    await fs.mkdir(archiveDir, { recursive: true });

    // Create archive file with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const archiveFile = path.join(
      archiveDir,
      `deliveries_archive_${timestamp}.json`
    );

    // Prepare archive data
    const archiveData = {
      archived_date: new Date().toISOString(),
      criteria:
        'Deliveries older than 90 days with status Delivered or Cancelled',
      count: oldDeliveries.length,
      deliveries: oldDeliveries.map(delivery => ({
        _id: delivery._id,
        orderId: delivery.orderId,
        status: delivery.status,
        customer: delivery.customer,
        deliverer: delivery.deliverer,
        priority: delivery.priority,
        deliveryAddress: delivery.deliveryAddress,
        estimatedDeliveryDate: delivery.estimatedDeliveryDate,
        actualDeliveryDate: delivery.actualDeliveryDate,
        notes: delivery.notes,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
      })),
    };

    // Write archive file
    await fs.writeFile(archiveFile, JSON.stringify(archiveData, null, 2));

    // Delete archived deliveries from main collection
    const deleteResult = await Delivery.deleteMany({
      _id: { $in: oldDeliveries.map(d => d._id) },
    });

    console.log(
      `✅ Archived ${deleteResult.deletedCount} deliveries to ${archiveFile}`
    );

    return { count: deleteResult.deletedCount, error: null };
  } catch (error) {
    console.error('❌ Error archiving old deliveries:', error);
    return { count: 0, error: error.message };
  }
};

/**
 * Clean up old notification files
 */
const cleanupOldNotifications = async () => {
  try {
    const notificationFile = path.join(
      __dirname,
      '../data/pending_notifications.json'
    );

    try {
      const data = await fs.readFile(notificationFile, 'utf8');
      const notifications = JSON.parse(data);

      // Remove notifications older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activeNotifications = notifications.filter(
        notification => new Date(notification.createdAt) > sevenDaysAgo
      );

      const removedCount = notifications.length - activeNotifications.length;

      if (removedCount > 0) {
        await fs.writeFile(
          notificationFile,
          JSON.stringify(activeNotifications, null, 2)
        );
        console.log(`🗑️  Cleaned up ${removedCount} old notifications`);
      }

      return { count: removedCount, error: null };
    } catch (error) {
      // File doesn't exist or is empty
      if (error.code === 'ENOENT') {
        return { count: 0, error: null };
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    return { count: 0, error: error.message };
  }
};

/**
 * Clean up old log files (if you're storing logs in files)
 */
const cleanupOldLogFiles = async () => {
  try {
    // This is a placeholder - implement based on your logging strategy
    // For now, just clean up any temporary files in the data directory

    const dataDir = path.join(__dirname, '../data');

    try {
      const files = await fs.readdir(dataDir);
      const tempFiles = files.filter(
        file =>
          file.startsWith('temp_') ||
          file.endsWith('.tmp') ||
          file.startsWith('log_')
      );

      let deletedCount = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const file of tempFiles) {
        const filePath = path.join(dataDir, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.mtime < thirtyDaysAgo) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch (error) {
          // File might not exist or be accessible, skip it
          continue;
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} old temporary files`);
      }

      return { count: deletedCount, error: null };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { count: 0, error: null };
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error cleaning up log files:', error);
    return { count: 0, error: error.message };
  }
};

/**
 * Clean up truly inactive users (be very careful with this)
 */
const cleanupInactiveUsers = async () => {
  try {
    // This is a very cautious approach - only flag users, don't delete them
    // In a real system, you might want to just mark them as inactive

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Find users who haven't been updated in 6 months and have no associated deliveries
    const potentialInactiveUsers = await User.find({
      updatedAt: { $lt: sixMonthsAgo },
      role: { $ne: 'admin' }, // Never touch admin accounts
    });

    let flaggedCount = 0;

    for (const user of potentialInactiveUsers) {
      // Check if user has any deliveries (as creator)
      const userDeliveries = await Delivery.countDocuments({
        createdBy: user._id,
      });

      if (userDeliveries === 0) {
        // Instead of deleting, just log for manual review
        console.log(
          `⚠️  Inactive user detected: ${user.email} (no activity for 6+ months, no deliveries)`
        );
        flaggedCount++;

        // You could add a flag to the user model instead of deleting:
        // user.isInactive = true;
        // await user.save();
      }
    }

    if (flaggedCount > 0) {
      console.log(
        `🏷️  Flagged ${flaggedCount} potentially inactive users for manual review`
      );
    }

    return { count: flaggedCount, error: null };
  } catch (error) {
    console.error('❌ Error checking inactive users:', error);
    return { count: 0, error: error.message };
  }
};

/**
 * Check database indexes for optimization
 */
const checkDatabaseIndexes = async () => {
  try {
    // Get index information for main collections
    const deliveryIndexes = await Delivery.collection.getIndexes();
    const userIndexes = await User.collection.getIndexes();
    const delivererIndexes = await Deliverer.collection.getIndexes();

    console.log('📊 Database indexes status:', {
      deliveries: Object.keys(deliveryIndexes).length,
      users: Object.keys(userIndexes).length,
      deliverers: Object.keys(delivererIndexes).length,
    });

    // Log any potential index optimizations
    // This is basic - a full optimization would analyze query patterns

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Error checking database indexes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a cleanup report
 */
const generateCleanupReport = async results => {
  try {
    const reportDir = path.join(__dirname, '../data/reports');
    await fs.mkdir(reportDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const reportFile = path.join(
      reportDir,
      `cleanup_report_${timestamp.split('T')[0]}.json`
    );

    const report = {
      timestamp,
      results,
      summary: {
        total_operations: 5,
        successful_operations: 5 - results.errors.length,
        errors: results.errors,
        recommendations: generateRecommendations(results),
      },
    };

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    console.log(`📊 Cleanup report saved to ${reportFile}`);
  } catch (error) {
    console.error('❌ Error generating cleanup report:', error);
  }
};

/**
 * Generate recommendations based on cleanup results
 */
const generateRecommendations = results => {
  const recommendations = [];

  if (results.archivedDeliveries > 100) {
    recommendations.push(
      'Consider implementing automatic archiving more frequently to manage database size'
    );
  }

  if (results.errors.length > 0) {
    recommendations.push('Review cleanup errors and improve error handling');
  }

  if (results.cleanedNotifications > 50) {
    recommendations.push(
      'Consider implementing notification system with automatic expiry'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('System maintenance is operating normally');
  }

  return recommendations;
};

/**
 * Get cleanup statistics (for monitoring)
 */
const getCleanupStats = async () => {
  try {
    const stats = {
      totalDeliveries: await Delivery.countDocuments(),
      oldDeliveries: await Delivery.countDocuments({
        status: { $in: ['Delivered', 'Cancelled'] },
        updatedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      }),
      totalUsers: await User.countDocuments(),
      inactiveUsers: await User.countDocuments({
        updatedAt: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        role: { $ne: 'admin' },
      }),
    };

    return stats;
  } catch (error) {
    console.error('❌ Error getting cleanup stats:', error);
    return null;
  }
};

module.exports = {
  dataCleanupJob,
  getCleanupStats,
  archiveOldDeliveries,
  cleanupOldNotifications,
};
