const cron = require('node-cron');
const { overdueDeliveryJob } = require('./overdueDeliveryJob');
const { dataCleanupJob } = require('./dataCleanupJob');
const { performanceMonitoringJob } = require('./performanceMonitoringJob');
const { notificationJob } = require('./notificationJob');
const { healthCheckJob } = require('./healthCheckJob');

// Centralized job registry to avoid duplication
const jobsMap = {
  overdueDeliveries: {
    schedule: '*/30 * * * *',
    function: overdueDeliveryJob,
    description: 'Overdue Delivery Detection'
  },
  dataCleanup: {
    schedule: '0 2 * * *',
    function: dataCleanupJob,
    description: 'Data Cleanup'
  },
  performanceMonitoring: {
    schedule: '*/15 * * * *',
    function: performanceMonitoringJob,
    description: 'Performance Monitoring'
  },
  notifications: {
    schedule: '*/5 * * * *',
    function: notificationJob,
    description: 'Notification Processing'
  },
  healthCheck: {
    schedule: '* * * * *',
    function: healthCheckJob,
    description: 'Health Check'
  }
};

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.recentRuns = []; // Track recent job executions
    this.maxRecentRuns = 50; // Maximum number of recent runs to keep
    this.systemHealth = { 
      status: 'unknown',
      issuesCount: 0,
      lastChecked: null
    };
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
      // Schedule all jobs from the centralized registry
      Object.entries(jobsMap).forEach(([jobName, jobConfig]) => {
        this.scheduleJob(jobName, jobConfig.schedule, jobConfig.function);
      });

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
        const run = { 
          jobName, 
          startTime: new Date().toISOString(),
          status: 'running'
        };
        
        // Add to recent runs immediately when job starts
        this.addRecentRun(run);
        
        try {
          console.log(`🔄 Starting job: ${jobName}`);
          await jobFunction();
          const duration = Date.now() - startTime;
          console.log(`✅ Job completed: ${jobName} (${duration}ms)`);
          
          // Update job stats and recent runs
          if (this.jobs.has(jobName)) {
            const job = this.jobs.get(jobName);
            job.successCount++;
            job.lastRun = new Date().toISOString();
            this.jobs.set(jobName, job);
          }
          
          // Update the run with completion data
          run.endTime = new Date().toISOString();
          run.duration = duration;
          run.status = 'completed';
          run.result = 'Success';
          this.updateRecentRun(run);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`❌ Job failed: ${jobName} (${duration}ms)`, error);

          // Log error details for monitoring
          this.logJobError(jobName, error, duration);
          
          // Update the run with error data
          run.endTime = new Date().toISOString();
          run.duration = duration;
          run.status = 'failed';
          run.result = `Error: ${error.message}`;
          this.updateRecentRun(run);
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
      isRunning: false,
    });

    task.start();
    console.log(`📅 Scheduled job: ${jobName} (${schedule})`);
  }

  /**
   * Add a new job run to the recent runs array
   */
  addRecentRun(run) {
    // Generate a unique ID for the run for easy tracking/updating
    run.id = `${run.jobName}-${Date.now()}`;
    this.recentRuns.unshift(run);
    
    // Ensure we don't exceed the maximum number of recent runs
    if (this.recentRuns.length > this.maxRecentRuns) {
      this.recentRuns.pop();
    }
  }
  
  /**
   * Update an existing job run in the recent runs array
   */
  updateRecentRun(updatedRun) {
    const index = this.recentRuns.findIndex(run => run.id === updatedRun.id);
    if (index !== -1) {
      this.recentRuns[index] = updatedRun;
    }
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
      activeJobs: 0,
      successRate: this.calculateSuccessRate(),
      lastRun: this.getLastRunTime(),
      jobs: [],
    };

    // Convert jobs Map to array for easier frontend consumption
    this.jobs.forEach((job, jobName) => {
      status.jobs.push({
        name: jobName,
        schedule: job.schedule,
        lastRun: job.lastRun,
        status: job.isRunning ? 'running' : 'idle',
        successCount: job.successCount,
        errorCount: job.errorCount,
      });
      
      if (job.isRunning) {
        status.activeJobs++;
      }
    });

    // Add system health data
    status.systemHealth = this.systemHealth;
    
    // Add recent runs data
    status.recentRuns = this.recentRuns;

    return status;
  }
  
  /**
   * Calculate the overall success rate of jobs
   */
  calculateSuccessRate() {
    let totalSuccess = 0;
    let totalRuns = 0;
    
    this.jobs.forEach(job => {
      totalSuccess += job.successCount || 0;
      totalRuns += (job.successCount || 0) + (job.errorCount || 0);
    });
    
    return totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;
  }
  
  /**
   * Get the most recent run time
   */
  getLastRunTime() {
    const runTimes = [];
    this.jobs.forEach(job => {
      if (job.lastRun) {
        runTimes.push(new Date(job.lastRun).getTime());
      }
    });
    
    return runTimes.length > 0 ? new Date(Math.max(...runTimes)).toISOString() : null;
  }

  /**
   * Log job status for monitoring
   */
  logJobStatus() {
    const status = this.getJobStatus();
    console.log('📊 Background Jobs Status:', {
      totalJobs: status.totalJobs,
      runningJobs: status.activeJobs,
      successRate: status.successRate + '%'
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
    if (!jobsMap[jobName] || !jobsMap[jobName].function) {
      throw new Error(`Job function not found: ${jobName}`);
    }

    const jobFunction = jobsMap[jobName].function;
    
    console.log(`🔄 Manually running job: ${jobName}`);
    const startTime = Date.now();
    
    // Create a run record
    const run = { 
      jobName, 
      startTime: new Date().toISOString(),
      status: 'running'
    };
    
    // Add to recent runs immediately when job starts
    this.addRecentRun(run);

    try {
      // Update the job to show it's running if it exists in the jobs map
      if (this.jobs.has(jobName)) {
        const job = this.jobs.get(jobName);
        job.isRunning = true;
        this.jobs.set(jobName, job);
      }
      
      await jobFunction();
      const duration = Date.now() - startTime;
      console.log(`✅ Manual job completed: ${jobName} (${duration}ms)`);

      // Update success statistics
      if (this.jobs.has(jobName)) {
        const job = this.jobs.get(jobName);
        job.successCount++;
        job.lastRun = new Date().toISOString();
        job.isRunning = false;
        this.jobs.set(jobName, job);
      }
      
      // Update the run with completion data
      run.endTime = new Date().toISOString();
      run.duration = duration;
      run.status = 'completed';
      run.result = 'Success';
      this.updateRecentRun(run);

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Manual job failed: ${jobName} (${duration}ms)`, error);
      this.logJobError(jobName, error, duration);
      
      // Update the job to show it's not running
      if (this.jobs.has(jobName)) {
        const job = this.jobs.get(jobName);
        job.isRunning = false;
        this.jobs.set(jobName, job);
      }
      
      // Update the run with error data
      run.endTime = new Date().toISOString();
      run.duration = duration;
      run.status = 'failed';
      run.result = `Error: ${error.message}`;
      this.updateRecentRun(run);
      
      throw error;
    }
  }
}

// Create singleton instance
const jobManager = new JobManager();

module.exports = {
  jobManager,
  JobManager,
  jobsMap
};
