const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

/**
 * Health check job that runs every minute
 * Performs basic system health checks and updates status
 */
const healthCheckJob = async () => {
  // Don't log every health check to avoid spam - only log issues
  try {
    const healthData = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
      issues: [],
    };

    // 1. Database connectivity check
    const dbCheck = await checkDatabaseHealth();
    healthData.checks.database = dbCheck;
    if (!dbCheck.healthy) {
      healthData.status = 'unhealthy';
      healthData.issues.push(dbCheck.error);
    }

    // 2. Memory usage check
    const memoryCheck = await checkMemoryHealth();
    healthData.checks.memory = memoryCheck;
    if (!memoryCheck.healthy) {
      healthData.status = 'unhealthy';
      healthData.issues.push(memoryCheck.error);
    }

    // 3. Disk space check (basic)
    const diskCheck = await checkDiskHealth();
    healthData.checks.disk = diskCheck;
    if (!diskCheck.healthy) {
      healthData.status = 'unhealthy';
      healthData.issues.push(diskCheck.error);
    }

    // 4. Application responsiveness check
    const appCheck = await checkApplicationHealth();
    healthData.checks.application = appCheck;
    if (!appCheck.healthy) {
      healthData.status = 'unhealthy';
      healthData.issues.push(appCheck.error);
    }

    // 5. Background jobs health check
    const jobsCheck = await checkBackgroundJobsHealth();
    healthData.checks.backgroundJobs = jobsCheck;
    if (!jobsCheck.healthy) {
      healthData.status = 'degraded';
      healthData.issues.push(jobsCheck.error);
    }

    // Store health check result
    await storeHealthCheck(healthData);

    // Only log if there are issues or significant changes
    if (healthData.status !== 'healthy') {
      console.log(`🏥 Health check: ${healthData.status}`, {
        issues: healthData.issues.length,
        timestamp: healthData.timestamp,
      });
    }

    return {
      success: true,
      health: healthData,
      message: `Health check completed: ${healthData.status}`,
    };
  } catch (error) {
    console.error('❌ Error in health check job:', error);

    // Store failed health check
    await storeHealthCheck({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      checks: {},
      issues: [error.message],
    });

    throw error;
  }
};

/**
 * Check database connectivity and performance
 */
const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();

    // Check connection state
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      // 1 = connected
      return {
        healthy: false,
        error: 'Database not connected',
        connectionState,
        responseTime: null,
      };
    }

    // Test a simple query
    const testQuery = mongoose.connection.db.admin().ping();
    await testQuery;

    const responseTime = Date.now() - startTime;

    // Check if response time is acceptable (< 1000ms)
    if (responseTime > 1000) {
      return {
        healthy: false,
        error: 'Database response time too slow',
        responseTime,
        connectionState,
      };
    }

    return {
      healthy: true,
      responseTime,
      connectionState,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: null,
      connectionState: mongoose.connection.readyState,
    };
  }
};

/**
 * Check memory usage health
 */
const checkMemoryHealth = async () => {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    // Consider unhealthy if using more than 80% of heap
    if (heapUsagePercent > 80) {
      return {
        healthy: false,
        error: `High memory usage: ${heapUsagePercent.toFixed(1)}%`,
        heapUsedMB,
        heapTotalMB,
        heapUsagePercent,
      };
    }

    // Warning level at 60%
    const warningLevel = heapUsagePercent > 60;

    return {
      healthy: true,
      warning: warningLevel,
      heapUsedMB,
      heapTotalMB,
      heapUsagePercent: Math.round(heapUsagePercent),
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

/**
 * Check disk space health (basic check)
 */
const checkDiskHealth = async () => {
  try {
    // This is a basic check - in production you'd want more sophisticated disk monitoring
    const dataDir = path.join(__dirname, '../data');

    try {
      // Try to write a small test file
      const testFile = path.join(dataDir, 'health_check_test.tmp');
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(testFile, 'health check test');
      await fs.unlink(testFile);

      return {
        healthy: true,
        canWrite: true,
      };
    } catch (error) {
      if (error.code === 'ENOSPC') {
        return {
          healthy: false,
          error: 'Disk space full',
          canWrite: false,
        };
      }

      return {
        healthy: false,
        error: `Disk write error: ${error.message}`,
        canWrite: false,
      };
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

/**
 * Check application responsiveness
 */
const checkApplicationHealth = async () => {
  try {
    const startTime = Date.now();

    // Test basic model operations
    const Delivery = require('../models/deliveryModel');

    // Test a simple count query
    const deliveryCount = await Delivery.countDocuments();

    const responseTime = Date.now() - startTime;

    // Check if application is responsive (< 500ms for basic operations)
    if (responseTime > 500) {
      return {
        healthy: false,
        error: 'Application response time too slow',
        responseTime,
        deliveryCount,
      };
    }

    return {
      healthy: true,
      responseTime,
      deliveryCount,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: null,
    };
  }
};

/**
 * Check background jobs health
 */
const checkBackgroundJobsHealth = async () => {
  try {
    // Check if job manager is available and running
    const { jobManager } = require('./index');

    if (!jobManager.isRunning) {
      return {
        healthy: false,
        error: 'Background jobs not running',
        isRunning: false,
      };
    }

    const jobStatus = jobManager.getJobStatus();

    // Check if any jobs have recent errors
    const jobsWithErrors = Object.values(jobStatus.jobs).filter(
      job =>
        job.errorCount > 0 &&
        job.lastError &&
        new Date(job.lastError.timestamp) >
          new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    if (jobsWithErrors.length > 0) {
      return {
        healthy: false,
        error: `${jobsWithErrors.length} background jobs have recent errors`,
        isRunning: true,
        totalJobs: jobStatus.totalJobs,
        jobsWithErrors: jobsWithErrors.length,
      };
    }

    return {
      healthy: true,
      isRunning: true,
      totalJobs: jobStatus.totalJobs,
      runningJobs: Object.values(jobStatus.jobs).filter(job => job.isRunning)
        .length,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      isRunning: false,
    };
  }
};

/**
 * Store health check results
 */
const storeHealthCheck = async healthData => {
  try {
    const healthDir = path.join(__dirname, '../data/health');
    await fs.mkdir(healthDir, { recursive: true });

    // Store in daily file
    const date = new Date().toISOString().split('T')[0];
    const healthFile = path.join(healthDir, `health_checks_${date}.json`);

    let dailyHealth = [];

    // Read existing health checks for today
    try {
      const data = await fs.readFile(healthFile, 'utf8');
      dailyHealth = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
      dailyHealth = [];
    }

    // Add new health check
    dailyHealth.push(healthData);

    // Keep only last 1440 entries (24 hours * 60 minutes)
    if (dailyHealth.length > 1440) {
      dailyHealth = dailyHealth.slice(-1440);
    }

    // Write updated health checks
    await fs.writeFile(healthFile, JSON.stringify(dailyHealth, null, 2));

    // Also maintain current status file
    const currentStatusFile = path.join(healthDir, 'current_status.json');
    await fs.writeFile(currentStatusFile, JSON.stringify(healthData, null, 2));
  } catch (error) {
    console.error('❌ Error storing health check:', error);
  }
};

/**
 * Get current health status
 */
const getCurrentHealthStatus = async () => {
  try {
    const currentStatusFile = path.join(
      __dirname,
      '../data/health/current_status.json'
    );

    try {
      const data = await fs.readFile(currentStatusFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist, return default status
      return {
        timestamp: new Date().toISOString(),
        status: 'unknown',
        message: 'No health data available',
        checks: {},
        issues: [],
      };
    }
  } catch (error) {
    console.error('❌ Error getting current health status:', error);
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      checks: {},
      issues: [error.message],
    };
  }
};

/**
 * Get health history for a specific date
 */
const getHealthHistory = async date => {
  try {
    const healthFile = path.join(
      __dirname,
      `../data/health/health_checks_${date}.json`
    );

    try {
      const data = await fs.readFile(healthFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error getting health history:', error);
    return null;
  }
};

/**
 * Get health statistics
 */
const getHealthStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const healthHistory = await getHealthHistory(today);

    if (!healthHistory || healthHistory.length === 0) {
      return {
        totalChecks: 0,
        healthyChecks: 0,
        unhealthyChecks: 0,
        uptime: 0,
      };
    }

    const stats = {
      totalChecks: healthHistory.length,
      healthyChecks: healthHistory.filter(h => h.status === 'healthy').length,
      unhealthyChecks: healthHistory.filter(h => h.status === 'unhealthy')
        .length,
      degradedChecks: healthHistory.filter(h => h.status === 'degraded').length,
      uptime: 0,
    };

    // Calculate uptime percentage
    stats.uptime =
      stats.totalChecks > 0
        ? Math.round((stats.healthyChecks / stats.totalChecks) * 100 * 100) /
          100
        : 0;

    return stats;
  } catch (error) {
    console.error('❌ Error getting health stats:', error);
    return null;
  }
};

module.exports = {
  healthCheckJob,
  getCurrentHealthStatus,
  getHealthHistory,
  getHealthStats,
};
