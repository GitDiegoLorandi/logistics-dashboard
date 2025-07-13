const Delivery = require('../models/deliveryModel');
const User = require('../models/userModel');
const Deliverer = require('../models/delivererModel');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

/**
 * Performance monitoring job that runs every 15 minutes
 * Monitors system health, database performance, and application metrics
 */
const performanceMonitoringJob = async () => {
  console.log('📊 Starting performance monitoring...');

  try {
    const startTime = Date.now();

    const metrics = {
      timestamp: new Date().toISOString(),
      system: await collectSystemMetrics(),
      database: await collectDatabaseMetrics(),
      application: await collectApplicationMetrics(),
      errors: [],
    };

    // Check for performance issues and alerts
    const alerts = await checkPerformanceAlerts(metrics);
    metrics.alerts = alerts;

    // Calculate job execution time
    metrics.jobExecutionTime = Date.now() - startTime;

    // Store metrics for historical tracking
    await storePerformanceMetrics(metrics);

    // Log summary
    console.log('📈 Performance metrics collected:', {
      executionTime: `${metrics.jobExecutionTime}ms`,
      alerts: alerts.length,
      dbConnections: metrics.database.activeConnections,
      memoryUsage: `${metrics.system.memoryUsage.used}MB`,
    });

    return {
      success: true,
      metrics,
      message: `Performance monitoring completed in ${metrics.jobExecutionTime}ms`,
    };
  } catch (error) {
    console.error('❌ Error in performance monitoring job:', error);
    throw error;
  }
};

/**
 * Collect system-level metrics
 */
const collectSystemMetrics = async () => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: process.uptime(),
      memoryUsage: {
        rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        heapTotal:
          Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      loadAverage:
        process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };
  } catch (error) {
    console.error('❌ Error collecting system metrics:', error);
    return { error: error.message };
  }
};

/**
 * Collect database performance metrics
 */
const collectDatabaseMetrics = async () => {
  try {
    const dbStats = await mongoose.connection.db.stats();
    const connectionState = mongoose.connection.readyState;

    // Database connection states:
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      connectionState: connectionStates[connectionState] || 'unknown',
      isConnected: connectionState === 1,
      activeConnections: mongoose.connections.length,
      collections: dbStats.collections,
      dataSize: Math.round((dbStats.dataSize / 1024 / 1024) * 100) / 100, // MB
      storageSize: Math.round((dbStats.storageSize / 1024 / 1024) * 100) / 100, // MB
      indexSize: Math.round((dbStats.indexSize / 1024 / 1024) * 100) / 100, // MB
      documents: dbStats.objects,
      indexes: dbStats.indexes,
      avgObjSize: Math.round(dbStats.avgObjSize * 100) / 100,
    };
  } catch (error) {
    console.error('❌ Error collecting database metrics:', error);
    return { error: error.message };
  }
};

/**
 * Collect application-specific metrics
 */
const collectApplicationMetrics = async () => {
  try {
    const startTime = Date.now();

    // Test database query performance
    const deliveryQueryStart = Date.now();
    const totalDeliveries = await Delivery.countDocuments();
    const deliveryQueryTime = Date.now() - deliveryQueryStart;

    const userQueryStart = Date.now();
    const totalUsers = await User.countDocuments();
    const userQueryTime = Date.now() - userQueryStart;

    const delivererQueryStart = Date.now();
    const totalDeliverers = await Deliverer.countDocuments();
    const delivererQueryTime = Date.now() - delivererQueryStart;

    // Get recent delivery statistics
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDeliveries = await Delivery.countDocuments({
      createdAt: { $gte: last24Hours },
    });

    const pendingDeliveries = await Delivery.countDocuments({
      status: 'Pending',
    });

    const inTransitDeliveries = await Delivery.countDocuments({
      status: 'In Transit',
    });

    const deliveredDeliveries = await Delivery.countDocuments({
      status: 'Delivered',
      createdAt: { $gte: last24Hours },
    });

    // Calculate basic performance metrics
    const totalQueryTime = Date.now() - startTime;

    return {
      queryPerformance: {
        totalTime: totalQueryTime,
        deliveryQuery: deliveryQueryTime,
        userQuery: userQueryTime,
        delivererQuery: delivererQueryTime,
        avgQueryTime: Math.round(
          (deliveryQueryTime + userQueryTime + delivererQueryTime) / 3
        ),
      },
      counts: {
        totalDeliveries,
        totalUsers,
        totalDeliverers,
        recentDeliveries,
        pendingDeliveries,
        inTransitDeliveries,
        deliveredDeliveries,
      },
      ratios: {
        deliveryCompletionRate:
          totalDeliveries > 0
            ? Math.round((deliveredDeliveries / totalDeliveries) * 100 * 100) /
              100
            : 0,
        pendingRatio:
          totalDeliveries > 0
            ? Math.round((pendingDeliveries / totalDeliveries) * 100 * 100) /
              100
            : 0,
      },
    };
  } catch (error) {
    console.error('❌ Error collecting application metrics:', error);
    return { error: error.message };
  }
};

/**
 * Check for performance alerts and issues
 */
const checkPerformanceAlerts = async metrics => {
  const alerts = [];

  try {
    // Memory usage alerts
    if (
      metrics.system.memoryUsage &&
      metrics.system.memoryUsage.heapUsed > 512
    ) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'WARNING',
        message: `High memory usage: ${metrics.system.memoryUsage.heapUsed}MB`,
        threshold: '512MB',
        current: `${metrics.system.memoryUsage.heapUsed}MB`,
      });
    }

    if (
      metrics.system.memoryUsage &&
      metrics.system.memoryUsage.heapUsed > 1024
    ) {
      alerts.push({
        type: 'CRITICAL_MEMORY_USAGE',
        severity: 'CRITICAL',
        message: `Critical memory usage: ${metrics.system.memoryUsage.heapUsed}MB`,
        threshold: '1024MB',
        current: `${metrics.system.memoryUsage.heapUsed}MB`,
      });
    }

    // Database connection alerts
    if (metrics.database && !metrics.database.isConnected) {
      alerts.push({
        type: 'DATABASE_DISCONNECTED',
        severity: 'CRITICAL',
        message: 'Database connection is not active',
        current: metrics.database.connectionState,
      });
    }

    // Query performance alerts
    if (
      metrics.application.queryPerformance &&
      metrics.application.queryPerformance.avgQueryTime > 1000
    ) {
      alerts.push({
        type: 'SLOW_DATABASE_QUERIES',
        severity: 'WARNING',
        message: `Slow database queries detected: ${metrics.application.queryPerformance.avgQueryTime}ms average`,
        threshold: '1000ms',
        current: `${metrics.application.queryPerformance.avgQueryTime}ms`,
      });
    }

    // High pending deliveries alert
    if (
      metrics.application.counts &&
      metrics.application.counts.pendingDeliveries > 100
    ) {
      alerts.push({
        type: 'HIGH_PENDING_DELIVERIES',
        severity: 'WARNING',
        message: `High number of pending deliveries: ${metrics.application.counts.pendingDeliveries}`,
        threshold: '100',
        current: metrics.application.counts.pendingDeliveries.toString(),
      });
    }

    // Database storage alerts
    if (metrics.database.storageSize && metrics.database.storageSize > 1000) {
      alerts.push({
        type: 'HIGH_DATABASE_STORAGE',
        severity: 'INFO',
        message: `Database storage usage: ${metrics.database.storageSize}MB`,
        threshold: '1000MB',
        current: `${metrics.database.storageSize}MB`,
      });
    }
  } catch (error) {
    console.error('❌ Error checking performance alerts:', error);
    alerts.push({
      type: 'ALERT_CHECK_ERROR',
      severity: 'ERROR',
      message: 'Error while checking performance alerts',
      error: error.message,
    });
  }

  return alerts;
};

/**
 * Store performance metrics for historical tracking
 */
const storePerformanceMetrics = async metrics => {
  try {
    const metricsDir = path.join(__dirname, '../data/metrics');
    await fs.mkdir(metricsDir, { recursive: true });

    // Store daily metrics file
    const date = new Date().toISOString().split('T')[0];
    const metricsFile = path.join(
      metricsDir,
      `performance_metrics_${date}.json`
    );

    let dailyMetrics = [];

    // Read existing metrics for today
    try {
      const existingData = await fs.readFile(metricsFile, 'utf8');
      dailyMetrics = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, start with empty array
      dailyMetrics = [];
    }

    // Add new metrics
    dailyMetrics.push(metrics);

    // Keep only last 96 entries (24 hours * 4 entries per hour)
    if (dailyMetrics.length > 96) {
      dailyMetrics = dailyMetrics.slice(-96);
    }

    // Write updated metrics
    await fs.writeFile(metricsFile, JSON.stringify(dailyMetrics, null, 2));

    // Also maintain a rolling summary file
    await updateMetricsSummary(metrics);
  } catch (error) {
    console.error('❌ Error storing performance metrics:', error);
  }
};

/**
 * Update rolling metrics summary
 */
const updateMetricsSummary = async currentMetrics => {
  try {
    const summaryFile = path.join(
      __dirname,
      '../data/metrics/performance_summary.json'
    );

    let summary = {
      lastUpdated: currentMetrics.timestamp,
      totalSamples: 0,
      averages: {
        memoryUsage: 0,
        queryTime: 0,
        uptime: 0,
      },
      peaks: {
        maxMemoryUsage: 0,
        maxQueryTime: 0,
        maxUptime: 0,
      },
      alerts: {
        total: 0,
        critical: 0,
        warning: 0,
      },
    };

    // Read existing summary
    try {
      const existingData = await fs.readFile(summaryFile, 'utf8');
      summary = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, use default summary
    }

    // Update summary with current metrics
    summary.lastUpdated = currentMetrics.timestamp;
    summary.totalSamples++;

    if (currentMetrics.system.memoryUsage) {
      const currentMemory = currentMetrics.system.memoryUsage.heapUsed;
      summary.averages.memoryUsage =
        (summary.averages.memoryUsage * (summary.totalSamples - 1) +
          currentMemory) /
        summary.totalSamples;
      summary.peaks.maxMemoryUsage = Math.max(
        summary.peaks.maxMemoryUsage,
        currentMemory
      );
    }

    if (currentMetrics.application.queryPerformance) {
      const currentQueryTime =
        currentMetrics.application.queryPerformance.avgQueryTime;
      summary.averages.queryTime =
        (summary.averages.queryTime * (summary.totalSamples - 1) +
          currentQueryTime) /
        summary.totalSamples;
      summary.peaks.maxQueryTime = Math.max(
        summary.peaks.maxQueryTime,
        currentQueryTime
      );
    }

    if (currentMetrics.system.uptime) {
      summary.peaks.maxUptime = Math.max(
        summary.peaks.maxUptime,
        currentMetrics.system.uptime
      );
    }

    // Update alert counts
    if (currentMetrics.alerts) {
      summary.alerts.total += currentMetrics.alerts.length;
      summary.alerts.critical += currentMetrics.alerts.filter(
        a => a.severity === 'CRITICAL'
      ).length;
      summary.alerts.warning += currentMetrics.alerts.filter(
        a => a.severity === 'WARNING'
      ).length;
    }

    // Write updated summary
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('❌ Error updating metrics summary:', error);
  }
};

/**
 * Get current performance status (for API endpoints)
 */
const getCurrentPerformanceStatus = async () => {
  try {
    const metrics = {
      system: await collectSystemMetrics(),
      database: await collectDatabaseMetrics(),
      application: await collectApplicationMetrics(),
    };

    const alerts = await checkPerformanceAlerts(metrics);

    return {
      status: alerts.some(a => a.severity === 'CRITICAL')
        ? 'CRITICAL'
        : alerts.some(a => a.severity === 'WARNING')
          ? 'WARNING'
          : 'OK',
      metrics,
      alerts,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error getting current performance status:', error);
    return {
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  performanceMonitoringJob,
  getCurrentPerformanceStatus,
  collectSystemMetrics,
  collectDatabaseMetrics,
  collectApplicationMetrics,
};
