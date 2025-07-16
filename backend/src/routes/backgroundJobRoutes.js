const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { jobManager } = require('../jobs');
const {
  getCurrentPerformanceStatus,
} = require('../jobs/performanceMonitoringJob');
const {
  getCurrentHealthStatus,
  getHealthStats,
} = require('../jobs/healthCheckJob');
const { getNotificationStats } = require('../jobs/notificationJob');
const { getCleanupStats } = require('../jobs/dataCleanupJob');
const { getOverdueDeliveryStats } = require('../jobs/overdueDeliveryJob');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     JobStatus:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Job name
 *         schedule:
 *           type: string
 *           description: Cron schedule
 *         lastRun:
 *           type: string
 *           format: date-time
 *           description: Last execution time
 *         lastError:
 *           type: object
 *           description: Last error information
 *         successCount:
 *           type: integer
 *           description: Number of successful executions
 *         errorCount:
 *           type: integer
 *           description: Number of failed executions
 *         isRunning:
 *           type: boolean
 *           description: Whether job is currently running
 */

/**
 * @swagger
 * /api/jobs/status:
 *   get:
 *     summary: Get status of all background jobs
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRunning:
 *                   type: boolean
 *                 totalJobs:
 *                   type: integer
 *                 jobs:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/JobStatus'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/status', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    console.log('GET /jobs/status: Received request');
    console.log('User ID:', req.user?.userId);
    console.log('User Role:', req.user?.role);
    
    const status = jobManager.getJobStatus();
    console.log('Job status retrieved:', JSON.stringify(status, null, 2));
    
    // Use the status directly as the job manager now returns data in the expected format
    res.status(200).json(status);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      message: 'Error getting job status',
      error: error.message,
    });
  }
});

// Helper function to calculate success rate
function calculateSuccessRate(jobs) {
  const jobsList = Object.values(jobs);
  if (!jobsList.length) return 0;
  
  let totalSuccess = 0;
  let totalRuns = 0;
  
  jobsList.forEach(job => {
    totalSuccess += job.successCount || 0;
    totalRuns += (job.successCount || 0) + (job.errorCount || 0);
  });
  
  return totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;
}

// Helper function to get the most recent run time
function getLastRunTime(jobs) {
  const jobsList = Object.values(jobs);
  const runTimes = jobsList
    .map(job => job.lastRun)
    .filter(time => time !== null);
  
  return runTimes.length > 0 ? new Date(Math.max(...runTimes.map(t => new Date(t).getTime()))) : null;
}

/**
 * @swagger
 * /api/jobs/health:
 *   get:
 *     summary: Get current system health status
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy, error]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get(
  '/health',
  authMiddleware,
  roleMiddleware(['admin', 'user']),
  async (req, res) => {
    try {
      const healthStatus = await getCurrentHealthStatus();
      res.status(200).json(healthStatus);
    } catch (error) {
      console.error('Error getting health status:', error);
      res.status(500).json({
        message: 'Error getting health status',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/health/stats:
 *   get:
 *     summary: Get health statistics
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalChecks:
 *                   type: integer
 *                 healthyChecks:
 *                   type: integer
 *                 unhealthyChecks:
 *                   type: integer
 *                 uptime:
 *                   type: number
 *                   description: Uptime percentage
 */
router.get(
  '/health/stats',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const healthStats = await getHealthStats();
      if (healthStats === null) {
        return res
          .status(500)
          .json({ message: 'Error getting health statistics' });
      }
      res.status(200).json(healthStats);
    } catch (error) {
      console.error('Error getting health stats:', error);
      res.status(500).json({
        message: 'Error getting health statistics',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/performance:
 *   get:
 *     summary: Get current performance metrics
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [OK, WARNING, CRITICAL, ERROR]
 *                 metrics:
 *                   type: object
 *                 alerts:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get(
  '/performance',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const performanceStatus = await getCurrentPerformanceStatus();
      res.status(200).json(performanceStatus);
    } catch (error) {
      console.error('Error getting performance status:', error);
      res.status(500).json({
        message: 'Error getting performance status',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pending:
 *                   type: integer
 *                 processedToday:
 *                   type: integer
 *                 failedToday:
 *                   type: integer
 */
router.get(
  '/notifications/stats',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const notificationStats = await getNotificationStats();
      if (notificationStats === null) {
        return res
          .status(500)
          .json({ message: 'Error getting notification statistics' });
      }
      res.status(200).json(notificationStats);
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        message: 'Error getting notification statistics',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/cleanup/stats:
 *   get:
 *     summary: Get data cleanup statistics
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data cleanup statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDeliveries:
 *                   type: integer
 *                 oldDeliveries:
 *                   type: integer
 *                 totalUsers:
 *                   type: integer
 *                 inactiveUsers:
 *                   type: integer
 */
router.get(
  '/cleanup/stats',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const cleanupStats = await getCleanupStats();
      if (cleanupStats === null) {
        return res
          .status(500)
          .json({ message: 'Error getting cleanup statistics' });
      }
      res.status(200).json(cleanupStats);
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      res.status(500).json({
        message: 'Error getting cleanup statistics',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/overdue/stats:
 *   get:
 *     summary: Get overdue delivery statistics
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue delivery statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInTransit:
 *                   type: integer
 *                 overdue:
 *                   type: integer
 *                 criticallyOverdue:
 *                   type: integer
 *                 avgHoursOverdue:
 *                   type: number
 */
router.get(
  '/overdue/stats',
  authMiddleware,
  roleMiddleware(['admin', 'user']),
  async (req, res) => {
    try {
      const overdueStats = await getOverdueDeliveryStats();
      if (overdueStats === null) {
        return res
          .status(500)
          .json({ message: 'Error getting overdue delivery statistics' });
      }
      res.status(200).json(overdueStats);
    } catch (error) {
      console.error('Error getting overdue stats:', error);
      res.status(500).json({
        message: 'Error getting overdue delivery statistics',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/run/{jobName}:
 *   post:
 *     summary: Manually run a specific background job
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [overdueDeliveries, dataCleanup, performanceMonitoring, notifications, healthCheck]
 *         description: Name of the job to run
 *     responses:
 *       200:
 *         description: Job executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 duration:
 *                   type: integer
 *                   description: Execution time in milliseconds
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid job name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Job execution failed
 */
router.post(
  '/run/:jobName',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const { jobName } = req.params;

      const validJobs = [
        'overdueDeliveries',
        'dataCleanup',
        'performanceMonitoring',
        'notifications',
        'healthCheck',
      ];

      if (!validJobs.includes(jobName)) {
        return res.status(400).json({
          message: 'Invalid job name',
          validJobs: validJobs,
        });
      }

      console.log(
        `🔧 Manual job execution requested: ${jobName} by user ${req.user.userId}`
      );

      const result = await jobManager.runJobManually(jobName);

      res.status(200).json({
        success: true,
        jobName,
        duration: result.duration,
        message: `Job ${jobName} executed successfully`,
        executedBy: req.user.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error running job ${req.params.jobName}:`, error);
      res.status(500).json({
        message: `Error running job ${req.params.jobName}`,
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/start:
 *   post:
 *     summary: Start all background jobs
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jobs started successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Error starting jobs
 */
router.post(
  '/start',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      await jobManager.startAllJobs();

      res.status(200).json({
        success: true,
        message: 'All background jobs started successfully',
        startedBy: req.user.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error starting background jobs:', error);
      res.status(500).json({
        message: 'Error starting background jobs',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/stop:
 *   post:
 *     summary: Stop all background jobs
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Jobs stopped successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Error stopping jobs
 */
router.post(
  '/stop',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      jobManager.stopAllJobs();

      res.status(200).json({
        success: true,
        message: 'All background jobs stopped successfully',
        stoppedBy: req.user.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error stopping background jobs:', error);
      res.status(500).json({
        message: 'Error stopping background jobs',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/jobs/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data for background jobs
 *     tags: [Background Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobStatus:
 *                   type: object
 *                 healthStatus:
 *                   type: object
 *                 performanceStatus:
 *                   type: object
 *                 stats:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      // Gather all dashboard data in parallel
      const [
        jobStatus,
        healthStatus,
        performanceStatus,
        healthStats,
        notificationStats,
        cleanupStats,
        overdueStats,
      ] = await Promise.all([
        Promise.resolve(jobManager.getJobStatus()),
        getCurrentHealthStatus(),
        getCurrentPerformanceStatus(),
        getHealthStats(),
        getNotificationStats(),
        getCleanupStats(),
        getOverdueDeliveryStats(),
      ]);

      const dashboardData = {
        jobStatus,
        healthStatus,
        performanceStatus,
        stats: {
          health: healthStats,
          notifications: notificationStats,
          cleanup: cleanupStats,
          overdue: overdueStats,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(dashboardData);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        message: 'Error getting dashboard data',
        error: error.message,
      });
    }
  }
);

module.exports = router;
