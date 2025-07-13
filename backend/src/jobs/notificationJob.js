const fs = require('fs').promises;
const path = require('path');

/**
 * Notification processing job that runs every 5 minutes
 * Processes pending notifications and handles delivery reminders
 */
const notificationJob = async () => {
  console.log('📧 Processing notifications...');

  try {
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Process pending notifications
    const pendingResult = await processPendingNotifications();
    results.processed = pendingResult.processed;
    results.sent = pendingResult.sent;
    results.failed = pendingResult.failed;
    if (pendingResult.errors) results.errors.push(...pendingResult.errors);

    // Generate delivery reminders
    const reminderResult = await generateDeliveryReminders();
    if (reminderResult.generated > 0) {
      results.processed += reminderResult.generated;
    }
    if (reminderResult.error) results.errors.push(reminderResult.error);

    // Clean up old processed notifications
    await cleanupProcessedNotifications();

    console.log('✅ Notification processing completed:', {
      processed: results.processed,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length,
    });

    return {
      success: true,
      results,
      message: `Processed ${results.processed} notifications, sent ${results.sent}, failed ${results.failed}`,
    };
  } catch (error) {
    console.error('❌ Error in notification job:', error);
    throw error;
  }
};

/**
 * Process pending notifications from the queue
 */
const processPendingNotifications = async () => {
  try {
    const notificationFile = path.join(
      __dirname,
      '../data/pending_notifications.json'
    );

    let pendingNotifications = [];

    // Read pending notifications
    try {
      const data = await fs.readFile(notificationFile, 'utf8');
      pendingNotifications = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📧 No pending notifications file found');
        return { processed: 0, sent: 0, failed: 0, errors: [] };
      }
      throw error;
    }

    if (pendingNotifications.length === 0) {
      console.log('📧 No pending notifications to process');
      return { processed: 0, sent: 0, failed: 0, errors: [] };
    }

    console.log(
      `📧 Processing ${pendingNotifications.length} pending notifications`
    );

    const processedNotifications = [];
    const remainingNotifications = [];
    const errors = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const notification of pendingNotifications) {
      try {
        // Process each notification based on its type
        const result = await processNotification(notification);

        if (result.success) {
          sentCount++;
          notification.processed = true;
          notification.processedAt = new Date().toISOString();
          notification.result = result;
          processedNotifications.push(notification);
        } else {
          failedCount++;
          notification.failed = true;
          notification.failedAt = new Date().toISOString();
          notification.error = result.error;

          // Retry logic: keep failed notifications for up to 3 attempts
          notification.retryCount = (notification.retryCount || 0) + 1;
          if (notification.retryCount < 3) {
            remainingNotifications.push(notification);
          } else {
            // Max retries reached, move to processed but mark as failed
            processedNotifications.push(notification);
          }

          errors.push(
            `Failed to process notification ${notification.type}: ${result.error}`
          );
        }
      } catch (error) {
        console.error('❌ Error processing individual notification:', error);
        failedCount++;
        errors.push(`Error processing notification: ${error.message}`);

        // Keep for retry
        notification.retryCount = (notification.retryCount || 0) + 1;
        if (notification.retryCount < 3) {
          remainingNotifications.push(notification);
        }
      }
    }

    // Update the pending notifications file with remaining notifications
    await fs.writeFile(
      notificationFile,
      JSON.stringify(remainingNotifications, null, 2)
    );

    // Store processed notifications for record keeping
    if (processedNotifications.length > 0) {
      await storeProcessedNotifications(processedNotifications);
    }

    return {
      processed: pendingNotifications.length,
      sent: sentCount,
      failed: failedCount,
      errors,
    };
  } catch (error) {
    console.error('❌ Error processing pending notifications:', error);
    return { processed: 0, sent: 0, failed: 0, errors: [error.message] };
  }
};

/**
 * Process individual notification based on its type
 */
const processNotification = async notification => {
  try {
    console.log(
      `📤 Processing ${notification.type} notification: ${notification.title}`
    );

    switch (notification.type) {
      case 'OVERDUE_DELIVERY':
        return await processOverdueDeliveryNotification(notification);

      case 'DELIVERY_REMINDER':
        return await processDeliveryReminderNotification(notification);

      case 'SYSTEM_ALERT':
        return await processSystemAlertNotification(notification);

      case 'PERFORMANCE_ALERT':
        return await processPerformanceAlertNotification(notification);

      default:
        return await processGenericNotification(notification);
    }
  } catch (error) {
    console.error(
      `❌ Error processing notification ${notification.type}:`,
      error
    );
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process overdue delivery notifications
 */
const processOverdueDeliveryNotification = async notification => {
  try {
    // In a real system, this would:
    // 1. Send email to admin/dispatcher
    // 2. Send SMS alert if critical
    // 3. Update dashboard with alert
    // 4. Log to monitoring system

    console.log(`⚠️  OVERDUE DELIVERY ALERT: ${notification.title}`);
    console.log(`   Customer: ${notification.data.customer}`);
    console.log(`   Order ID: ${notification.data.orderId}`);
    console.log(`   Hours Overdue: ${notification.data.hoursOverdue}`);
    console.log(
      `   Deliverer: ${notification.data.deliverer ? notification.data.deliverer.name : 'Unassigned'}`
    );

    // Simulate sending notification (replace with actual email/SMS service)
    const mockResult = await sendMockNotification({
      to: 'admin@logistics.com', // Would get from admin users
      subject: notification.title,
      body: notification.message,
      priority: notification.priority,
      data: notification.data,
    });

    return mockResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process delivery reminder notifications
 */
const processDeliveryReminderNotification = async notification => {
  try {
    console.log(`🔔 DELIVERY REMINDER: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);

    // Simulate sending reminder notification
    const mockResult = await sendMockNotification({
      to: notification.data.delivererEmail || 'deliverer@logistics.com',
      subject: notification.title,
      body: notification.message,
      priority: 'NORMAL',
      data: notification.data,
    });

    return mockResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process system alert notifications
 */
const processSystemAlertNotification = async notification => {
  try {
    console.log(`🚨 SYSTEM ALERT: ${notification.title}`);
    console.log(`   Severity: ${notification.priority}`);
    console.log(`   Message: ${notification.message}`);

    // System alerts should go to technical team
    const mockResult = await sendMockNotification({
      to: 'tech@logistics.com',
      subject: `[${notification.priority}] ${notification.title}`,
      body: notification.message,
      priority: notification.priority,
      data: notification.data,
    });

    return mockResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process performance alert notifications
 */
const processPerformanceAlertNotification = async notification => {
  try {
    console.log(`📊 PERFORMANCE ALERT: ${notification.title}`);
    console.log(`   Alert: ${notification.message}`);

    // Performance alerts for monitoring team
    const mockResult = await sendMockNotification({
      to: 'monitoring@logistics.com',
      subject: `Performance Alert: ${notification.title}`,
      body: notification.message,
      priority: notification.priority || 'MEDIUM',
      data: notification.data,
    });

    return mockResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process generic notifications
 */
const processGenericNotification = async notification => {
  try {
    console.log(`📨 GENERIC NOTIFICATION: ${notification.title}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Message: ${notification.message}`);

    const mockResult = await sendMockNotification({
      to: 'admin@logistics.com',
      subject: notification.title,
      body: notification.message,
      priority: notification.priority || 'NORMAL',
      data: notification.data,
    });

    return mockResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Mock notification sender (replace with actual email/SMS service)
 */
const sendMockNotification = async notificationData => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Simulated network error');
    }

    console.log(`✉️  Mock notification sent to ${notificationData.to}`);
    console.log(`   Subject: ${notificationData.subject}`);

    return {
      success: true,
      method: 'email',
      recipient: notificationData.to,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate delivery reminders for deliveries due soon
 */
const generateDeliveryReminders = async () => {
  try {
    const Delivery = require('../models/deliveryModel');

    // Find deliveries due within the next 2 hours that haven't been reminded about
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const now = new Date();

    const upcomingDeliveries = await Delivery.find({
      status: 'In Transit',
      estimatedDeliveryDate: {
        $gte: now,
        $lte: twoHoursFromNow,
      },
      // Add a field to track if reminder was sent
      reminderSent: { $ne: true },
    }).populate('deliverer', 'name email phone');

    if (upcomingDeliveries.length === 0) {
      console.log('🔔 No upcoming deliveries requiring reminders');
      return { generated: 0, error: null };
    }

    console.log(
      `🔔 Generating reminders for ${upcomingDeliveries.length} upcoming deliveries`
    );

    const reminders = [];

    for (const delivery of upcomingDeliveries) {
      const timeUntilDelivery = Math.round(
        (delivery.estimatedDeliveryDate - now) / (1000 * 60)
      ); // minutes

      const reminder = {
        type: 'DELIVERY_REMINDER',
        priority: 'NORMAL',
        title: `Delivery Reminder: ${delivery.orderId}`,
        message:
          `Reminder: Delivery for ${delivery.customer} is due in ${timeUntilDelivery} minutes. ` +
          `Address: ${delivery.deliveryAddress || 'Not specified'}`,
        data: {
          deliveryId: delivery._id,
          orderId: delivery.orderId,
          customer: delivery.customer,
          deliverer: delivery.deliverer,
          delivererEmail: delivery.deliverer ? delivery.deliverer.email : null,
          estimatedDeliveryDate: delivery.estimatedDeliveryDate,
          timeUntilDelivery: timeUntilDelivery,
        },
        createdAt: new Date().toISOString(),
      };

      reminders.push(reminder);

      // Mark delivery as reminded
      delivery.reminderSent = true;
      await delivery.save();
    }

    // Add reminders to pending notifications
    if (reminders.length > 0) {
      await addToPendingNotifications(reminders);
    }

    return { generated: reminders.length, error: null };
  } catch (error) {
    console.error('❌ Error generating delivery reminders:', error);
    return { generated: 0, error: error.message };
  }
};

/**
 * Add notifications to the pending queue
 */
const addToPendingNotifications = async notifications => {
  try {
    const notificationFile = path.join(
      __dirname,
      '../data/pending_notifications.json'
    );

    let existingNotifications = [];

    // Read existing notifications
    try {
      const data = await fs.readFile(notificationFile, 'utf8');
      existingNotifications = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
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
      `📧 Added ${notifications.length} notifications to pending queue`
    );
  } catch (error) {
    console.error('❌ Error adding to pending notifications:', error);
    throw error;
  }
};

/**
 * Store processed notifications for record keeping
 */
const storeProcessedNotifications = async processedNotifications => {
  try {
    const processedDir = path.join(
      __dirname,
      '../data/processed_notifications'
    );
    await fs.mkdir(processedDir, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    const processedFile = path.join(
      processedDir,
      `processed_notifications_${date}.json`
    );

    let dailyProcessed = [];

    // Read existing processed notifications for today
    try {
      const data = await fs.readFile(processedFile, 'utf8');
      dailyProcessed = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
      dailyProcessed = [];
    }

    // Add new processed notifications
    dailyProcessed.push(...processedNotifications);

    // Write updated processed notifications
    await fs.writeFile(processedFile, JSON.stringify(dailyProcessed, null, 2));

    console.log(
      `📁 Stored ${processedNotifications.length} processed notifications`
    );
  } catch (error) {
    console.error('❌ Error storing processed notifications:', error);
  }
};

/**
 * Clean up old processed notifications (keep only last 30 days)
 */
const cleanupProcessedNotifications = async () => {
  try {
    const processedDir = path.join(
      __dirname,
      '../data/processed_notifications'
    );

    try {
      const files = await fs.readdir(processedDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('processed_notifications_')) {
          const filePath = path.join(processedDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < thirtyDaysAgo) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(
          `🗑️  Cleaned up ${deletedCount} old processed notification files`
        );
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up processed notifications:', error);
  }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async () => {
  try {
    const stats = {
      pending: 0,
      processedToday: 0,
      failedToday: 0,
    };

    // Count pending notifications
    try {
      const notificationFile = path.join(
        __dirname,
        '../data/pending_notifications.json'
      );
      const data = await fs.readFile(notificationFile, 'utf8');
      const pendingNotifications = JSON.parse(data);
      stats.pending = pendingNotifications.length;
    } catch (error) {
      stats.pending = 0;
    }

    // Count processed notifications for today
    try {
      const date = new Date().toISOString().split('T')[0];
      const processedFile = path.join(
        __dirname,
        `../data/processed_notifications/processed_notifications_${date}.json`
      );
      const data = await fs.readFile(processedFile, 'utf8');
      const processedNotifications = JSON.parse(data);
      stats.processedToday = processedNotifications.filter(
        n => n.processed
      ).length;
      stats.failedToday = processedNotifications.filter(n => n.failed).length;
    } catch (error) {
      stats.processedToday = 0;
      stats.failedToday = 0;
    }

    return stats;
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    return null;
  }
};

module.exports = {
  notificationJob,
  getNotificationStats,
  generateDeliveryReminders,
  addToPendingNotifications,
};
