const cron = require('node-cron');
const { overdueDeliveryJob } = require('./overdueDeliveryJob');
const { dataCleanupJob } = require('./dataCleanupJob');
const { performanceMonitoringJob } = require('./performanceMonitoringJob');
const { notificationJob } = require('./notificationJob');
const { healthCheckJob } = require('./healthCheckJob');

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize and start all background jobs
   */
  async startAllJobs() {
    if (this.isRunning) {
      console.log('⚠️  Jobs are already running');
      return;
    }

    console.log('🚀 Starting background jobs...');

    try {
      // 1. Overdue Delivery Detection - Every 30 minutes
      this.scheduleJob('overdueDeliveries', '*/30 * * * *', overdueDeliveryJob);

      // 2. Data Cleanup - Daily at 2:00 AM
      this.scheduleJob('dataCleanup', '0 2 * * *', dataCleanupJob);

      // 3. Performance Monitoring - Every 15 minutes
      this.scheduleJob(
        'performanceMonitoring',
        '*/15 * * * *',
        performanceMonitoringJob
      );

      // 4. Notification Processing - Every 5 minutes
      this.scheduleJob('notifications', '*/5 * * * *', notificationJob);

      // 5. Health Check - Every minute
      this.scheduleJob('healthCheck', '* * * * *', healthCheckJob);

      this.isRunning = true;
      console.log('✅ All background jobs started successfully');
      this.logJobStatus();
    } catch (error) {
      console.error('❌ Error starting background jobs:', error);
      throw error;
    }
  }

  /**
   * Schedule a single job with error handling
   */
  scheduleJob(jobName, schedule, jobFunction) {
    const task = cron.schedule(
      schedule,
      async () => {
        const startTime = Date.now();

        try {
          console.log(`🔄 Starting job: ${jobName}`);
          await jobFunction();
          const duration = Date.now() - startTime;
          console.log(`✅ Job completed: ${jobName} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`❌ Job failed: ${jobName} (${duration}ms)`, error);

          // Log error details for monitoring
          this.logJobError(jobName, error, duration);
        }
      },
      {
        scheduled: false,
        timezone: 'UTC',
      }
    );

    this.jobs.set(jobName, {
      task,
      schedule,
      name: jobName,
      lastRun: null,
      lastError: null,
      successCount: 0,
      errorCount: 0,
    });

    task.start();
    console.log(`📅 Scheduled job: ${jobName} (${schedule})`);
  }

  /**
   * Stop all background jobs
   */
  stopAllJobs() {
    console.log('🛑 Stopping all background jobs...');

    this.jobs.forEach((job, jobName) => {
      job.task.stop();
      console.log(`⏹️  Stopped job: ${jobName}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ All background jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getJobStatus() {
    const status = {
      isRunning: this.isRunning,
      totalJobs: this.jobs.size,
      jobs: {},
    };

    this.jobs.forEach((job, jobName) => {
      status.jobs[jobName] = {
        name: job.name,
        schedule: job.schedule,
        lastRun: job.lastRun,
        lastError: job.lastError,
        successCount: job.successCount,
        errorCount: job.errorCount,
        isRunning: job.task.running,
      };
    });

    return status;
  }

  /**
   * Log job status for monitoring
   */
  logJobStatus() {
    const status = this.getJobStatus();
    console.log('📊 Background Jobs Status:', {
      totalJobs: status.totalJobs,
      runningJobs: Object.values(status.jobs).filter(job => job.isRunning)
        .length,
    });
  }

  /**
   * Log job errors for monitoring
   */
  logJobError(jobName, error, duration) {
    const errorLog = {
      jobName,
      error: error.message,
      stack: error.stack,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Update job statistics
    if (this.jobs.has(jobName)) {
      const job = this.jobs.get(jobName);
      job.errorCount++;
      job.lastError = errorLog;
      this.jobs.set(jobName, job);
    }

    // In production, you might want to send this to a logging service
    console.error('🚨 Job Error Log:', errorLog);
  }

  /**
   * Manually run a specific job (for testing)
   */
  async runJobManually(jobName) {
    if (!this.jobs.has(jobName)) {
      throw new Error(`Job not found: ${jobName}`);
    }

    const jobMap = {
      overdueDeliveries: overdueDeliveryJob,
      dataCleanup: dataCleanupJob,
      performanceMonitoring: performanceMonitoringJob,
      notifications: notificationJob,
      healthCheck: healthCheckJob,
    };

    const jobFunction = jobMap[jobName];
    if (!jobFunction) {
      throw new Error(`Job function not found: ${jobName}`);
    }

    console.log(`🔄 Manually running job: ${jobName}`);
    const startTime = Date.now();

    try {
      await jobFunction();
      const duration = Date.now() - startTime;
      console.log(`✅ Manual job completed: ${jobName} (${duration}ms)`);

      // Update success statistics
      if (this.jobs.has(jobName)) {
        const job = this.jobs.get(jobName);
        job.successCount++;
        job.lastRun = new Date();
        this.jobs.set(jobName, job);
      }

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Manual job failed: ${jobName} (${duration}ms)`, error);
      this.logJobError(jobName, error, duration);
      throw error;
    }
  }
}

// Create singleton instance
const jobManager = new JobManager();

module.exports = {
  jobManager,
  JobManager,
};
