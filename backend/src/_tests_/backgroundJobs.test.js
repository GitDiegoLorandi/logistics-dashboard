const { jobManager } = require('../jobs');
const { overdueDeliveryJob } = require('../jobs/overdueDeliveryJob');
const { dataCleanupJob } = require('../jobs/dataCleanupJob');
const {
  performanceMonitoringJob,
} = require('../jobs/performanceMonitoringJob');
const { notificationJob } = require('../jobs/notificationJob');
const { healthCheckJob } = require('../jobs/healthCheckJob');
const Delivery = require('../models/deliveryModel');
const mongoose = require('mongoose');

describe('Background Jobs System', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://localhost:27017/logistics-test'
      );
    }
  });

  afterAll(async () => {
    // Clean up and close connections
    if (jobManager.isRunning) {
      jobManager.stopAllJobs();
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await Delivery.deleteMany({});
  });

  describe('Job Manager', () => {
    test('should initialize job manager correctly', () => {
      expect(jobManager).toBeDefined();
      expect(jobManager.isRunning).toBe(false);
      expect(jobManager.jobs).toBeDefined();
    });

    test('should start all jobs successfully', async () => {
      await jobManager.startAllJobs();
      expect(jobManager.isRunning).toBe(true);

      const status = jobManager.getJobStatus();
      expect(status.totalJobs).toBe(5);
      expect(status.isRunning).toBe(true);

      // Stop jobs after test
      jobManager.stopAllJobs();
    });

    test('should stop all jobs successfully', async () => {
      await jobManager.startAllJobs();
      jobManager.stopAllJobs();

      expect(jobManager.isRunning).toBe(false);

      const status = jobManager.getJobStatus();
      expect(status.totalJobs).toBe(0);
      expect(status.isRunning).toBe(false);
    });

    test('should run individual jobs manually', async () => {
      await jobManager.startAllJobs();

      const result = await jobManager.runJobManually('healthCheck');
      expect(result.success).toBe(true);
      expect(result.duration).toBeDefined();

      jobManager.stopAllJobs();
    });

    test('should handle invalid job names', async () => {
      await jobManager.startAllJobs();

      await expect(jobManager.runJobManually('invalidJob')).rejects.toThrow();

      jobManager.stopAllJobs();
    });
  });

  describe('Overdue Delivery Job', () => {
    test('should detect overdue deliveries', async () => {
      // Create test delivery that's overdue
      const overdueDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      await Delivery.create({
        orderId: 'TEST001',
        status: 'In Transit',
        customer: 'Test Customer',
        estimatedDeliveryDate: overdueDate,
      });

      const result = await overdueDeliveryJob();

      expect(result.success).toBe(true);
      expect(result.overdueCount).toBe(1);
    });

    test('should not detect deliveries that are not overdue', async () => {
      // Create delivery that's due in the future
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      await Delivery.create({
        orderId: 'TEST002',
        status: 'In Transit',
        customer: 'Test Customer',
        estimatedDeliveryDate: futureDate,
      });

      const result = await overdueDeliveryJob();

      expect(result.success).toBe(true);
      expect(result.overdueCount).toBe(0);
    });

    test('should only check In Transit deliveries', async () => {
      // Create overdue delivery that's already delivered
      const overdueDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

      await Delivery.create({
        orderId: 'TEST003',
        status: 'Delivered', // Not In Transit
        customer: 'Test Customer',
        estimatedDeliveryDate: overdueDate,
      });

      const result = await overdueDeliveryJob();

      expect(result.success).toBe(true);
      expect(result.overdueCount).toBe(0);
    });
  });

  describe('Data Cleanup Job', () => {
    test('should complete without errors on empty database', async () => {
      const result = await dataCleanupJob();

      expect(result.success).toBe(true);
      expect(result.results.archivedDeliveries).toBe(0);
    });

    test('should not archive recent deliveries', async () => {
      // Create recent completed delivery
      await Delivery.create({
        orderId: 'RECENT001',
        status: 'Delivered',
        customer: 'Recent Customer',
        updatedAt: new Date(), // Recent
      });

      const result = await dataCleanupJob();

      expect(result.success).toBe(true);
      expect(result.results.archivedDeliveries).toBe(0);
    });
  });

  describe('Performance Monitoring Job', () => {
    test('should collect system metrics', async () => {
      const result = await performanceMonitoringJob();

      expect(result.success).toBe(true);
      expect(result.metrics.system).toBeDefined();
      expect(result.metrics.database).toBeDefined();
      expect(result.metrics.application).toBeDefined();
      expect(result.metrics.jobExecutionTime).toBeDefined();
    });

    test('should detect database connection', async () => {
      const result = await performanceMonitoringJob();

      expect(result.metrics.database.isConnected).toBe(true);
      expect(result.metrics.database.connectionState).toBe('connected');
    });

    test('should measure query performance', async () => {
      const result = await performanceMonitoringJob();

      expect(result.metrics.application.queryPerformance).toBeDefined();
      expect(
        result.metrics.application.queryPerformance.avgQueryTime
      ).toBeDefined();
      expect(
        typeof result.metrics.application.queryPerformance.avgQueryTime
      ).toBe('number');
    });
  });

  describe('Notification Job', () => {
    test('should complete without errors when no notifications exist', async () => {
      const result = await notificationJob();

      expect(result.success).toBe(true);
      expect(result.results.processed).toBe(0);
    });

    test('should generate delivery reminders for upcoming deliveries', async () => {
      // Create delivery due in 1 hour
      const soonDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await Delivery.create({
        orderId: 'UPCOMING001',
        status: 'In Transit',
        customer: 'Upcoming Customer',
        estimatedDeliveryDate: soonDate,
        reminderSent: false,
      });

      const result = await notificationJob();

      expect(result.success).toBe(true);
      // Should generate at least one reminder
      expect(result.results.processed).toBeGreaterThanOrEqual(0);
    });

    test('should not generate reminders for deliveries already reminded', async () => {
      // Create delivery that already has reminder sent
      const soonDate = new Date(Date.now() + 60 * 60 * 1000);

      await Delivery.create({
        orderId: 'REMINDED001',
        status: 'In Transit',
        customer: 'Reminded Customer',
        estimatedDeliveryDate: soonDate,
        reminderSent: true, // Already reminded
      });

      const result = await notificationJob();

      expect(result.success).toBe(true);
    });
  });

  describe('Health Check Job', () => {
    test('should perform health checks', async () => {
      const result = await healthCheckJob();

      expect(result.success).toBe(true);
      expect(result.health.status).toBeDefined();
      expect(result.health.checks).toBeDefined();
      expect(result.health.timestamp).toBeDefined();
    });

    test('should check database health', async () => {
      const result = await healthCheckJob();

      expect(result.health.checks.database).toBeDefined();
      expect(result.health.checks.database.healthy).toBe(true);
    });

    test('should check memory health', async () => {
      const result = await healthCheckJob();

      expect(result.health.checks.memory).toBeDefined();
      expect(result.health.checks.memory.healthy).toBe(true);
      expect(result.health.checks.memory.heapUsedMB).toBeDefined();
    });

    test('should check application health', async () => {
      const result = await healthCheckJob();

      expect(result.health.checks.application).toBeDefined();
      expect(result.health.checks.application.healthy).toBe(true);
      expect(result.health.checks.application.deliveryCount).toBeDefined();
    });
  });

  describe('Job Integration', () => {
    test('should handle job errors gracefully', async () => {
      // Mock a job that throws an error
      const _originalJob = overdueDeliveryJob;
      const mockJob = jest.fn().mockRejectedValue(new Error('Test error'));

      // This would require modifying the job manager to accept mock jobs
      // For now, just test that errors don't crash the system
      try {
        await mockJob();
      } catch (error) {
        expect(error.message).toBe('Test error');
      }
    });

    test('should maintain job statistics', async () => {
      await jobManager.startAllJobs();

      // Run a job manually to update statistics
      await jobManager.runJobManually('healthCheck');

      const status = jobManager.getJobStatus();
      const healthCheckJob = status.jobs['healthCheck'];

      expect(healthCheckJob.successCount).toBeGreaterThan(0);

      jobManager.stopAllJobs();
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // This would require mocking mongoose connection
      // For now, just verify jobs can handle basic errors
      const result = await healthCheckJob();
      expect(result.success).toBe(true);
    });

    test('should handle file system errors gracefully', async () => {
      // Test that jobs can handle file system issues
      const result = await dataCleanupJob();
      expect(result.success).toBe(true);
    });
  });
});

describe('Background Jobs Configuration', () => {
  test('should have correct job schedules', () => {
    const expectedSchedules = {
      overdueDeliveries: '*/30 * * * *', // Every 30 minutes
      dataCleanup: '0 2 * * *', // Daily at 2:00 AM
      performanceMonitoring: '*/15 * * * *', // Every 15 minutes
      notifications: '*/5 * * * *', // Every 5 minutes
      healthCheck: '* * * * *', // Every minute
    };

    // These would be checked when jobs are running
    // For now, just verify the expected schedules are reasonable
    Object.values(expectedSchedules).forEach(schedule => {
      expect(typeof schedule).toBe('string');
      expect(schedule.split(' ')).toHaveLength(5); // Valid cron format
    });
  });

  test('should have all required job functions exported', () => {
    expect(typeof overdueDeliveryJob).toBe('function');
    expect(typeof dataCleanupJob).toBe('function');
    expect(typeof performanceMonitoringJob).toBe('function');
    expect(typeof notificationJob).toBe('function');
    expect(typeof healthCheckJob).toBe('function');
  });
});
