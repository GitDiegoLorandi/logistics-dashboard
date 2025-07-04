import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  TrendingUp,
  Bell,
  Database,
  Shield,
  Monitor,
  Zap,
} from 'lucide-react';
import { jobsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './JobsPage.css';

const JobsPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [runningJob, setRunningJob] = useState(null);

  const jobDescriptions = {
    healthCheck: {
      title: 'Health Check',
      description: 'Monitors system health and database connectivity',
      icon: Shield,
      color: 'green',
    },
    notifications: {
      title: 'Notification Processing',
      description: 'Processes and sends pending notifications',
      icon: Bell,
      color: 'blue',
    },
    performanceMonitoring: {
      title: 'Performance Monitoring',
      description: 'Collects system performance metrics',
      icon: Monitor,
      color: 'purple',
    },
    overdueDeliveries: {
      title: 'Overdue Delivery Check',
      description: 'Identifies and flags overdue deliveries',
      icon: AlertTriangle,
      color: 'orange',
    },
    dataCleanup: {
      title: 'Data Cleanup',
      description: 'Cleans up old logs and temporary data',
      icon: Database,
      color: 'red',
    },
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await jobsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching jobs dashboard:', error);
      toast.error('Failed to load jobs dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Jobs dashboard refreshed');
  };

  const handleRunJob = async jobName => {
    try {
      setRunningJob(jobName);
      await jobsAPI.runJob(jobName);
      toast.success(`Job ${jobName} executed successfully`);
      await fetchDashboardData();
    } catch (error) {
      console.error(`Error running job ${jobName}:`, error);
      toast.error(`Failed to run job ${jobName}`);
    } finally {
      setRunningJob(null);
    }
  };

  const handleStartAllJobs = async () => {
    try {
      await jobsAPI.startAllJobs();
      toast.success('All background jobs started');
      await fetchDashboardData();
    } catch (error) {
      console.error('Error starting jobs:', error);
      toast.error('Failed to start background jobs');
    }
  };

  const handleStopAllJobs = async () => {
    try {
      await jobsAPI.stopAllJobs();
      toast.success('All background jobs stopped');
      await fetchDashboardData();
    } catch (error) {
      console.error('Error stopping jobs:', error);
      toast.error('Failed to stop background jobs');
    }
  };

  const formatLastRun = lastRun => {
    if (!lastRun) return 'Never';
    const date = new Date(lastRun);
    return date.toLocaleString();
  };

  const formatUptime = uptime => {
    if (!uptime) return 'N/A';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getHealthStatusColor = status => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'degraded':
        return 'yellow';
      case 'unhealthy':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getJobStatusIcon = job => {
    if (job.errorCount > 0)
      return <AlertTriangle className='status-icon error' />;
    if (job.isRunning) return <Activity className='status-icon running' />;
    return <CheckCircle className='status-icon success' />;
  };

  if (loading) {
    return (
      <div className='jobs-page'>
        <div className='jobs-loading'>
          <div className='loading-spinner'></div>
          <p>Loading jobs dashboard...</p>
        </div>
      </div>
    );
  }

  const { jobStatus, healthStatus, performanceStatus, stats } = dashboardData;

  return (
    <div className='jobs-page'>
      <div className='jobs-header'>
        <div className='jobs-title'>
          <h1>Background Jobs Management</h1>
          <p>Monitor and control system background processes</p>
        </div>
        <div className='jobs-actions'>
          <button
            onClick={handleRefresh}
            className='refresh-btn'
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleStartAllJobs}
            className='start-btn'
            disabled={jobStatus?.isRunning}
          >
            <Play />
            Start All
          </button>
          <button
            onClick={handleStopAllJobs}
            className='stop-btn'
            disabled={!jobStatus?.isRunning}
          >
            <Square />
            Stop All
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className='status-overview'>
        <div className='status-card'>
          <div className='status-header'>
            <Shield className='status-icon' />
            <h3>System Health</h3>
          </div>
          <div
            className={`status-indicator ${getHealthStatusColor(healthStatus?.status)}`}
          >
            {healthStatus?.status || 'Unknown'}
          </div>
          <p className='status-detail'>
            {healthStatus?.issues
              ? `${healthStatus.issues.length} issues detected`
              : 'All systems operational'}
          </p>
          {healthStatus?.issues && healthStatus.issues.length > 0 && (
            <div className='health-issues'>
              <ul>
                {healthStatus.issues.map((issue, index) => (
                  <li key={index} className='health-issue-item'>
                    <AlertTriangle size={14} className='issue-icon' />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className='status-card'>
          <div className='status-header'>
            <Activity className='status-icon' />
            <h3>Jobs Status</h3>
          </div>
          <div
            className={`status-indicator ${jobStatus?.isRunning ? 'green' : 'red'}`}
          >
            {jobStatus?.isRunning ? 'Running' : 'Stopped'}
          </div>
          <p className='status-detail'>
            {jobStatus?.totalJobs || 0} jobs configured
          </p>
        </div>

        <div className='status-card'>
          <div className='status-header'>
            <TrendingUp className='status-icon' />
            <h3>Performance</h3>
          </div>
          <div
            className={`status-indicator ${performanceStatus?.status === 'OK' ? 'green' : 'yellow'}`}
          >
            {performanceStatus?.status || 'Unknown'}
          </div>
          <p className='status-detail'>
            Memory: {performanceStatus?.metrics?.memoryUsage || 'N/A'}
          </p>
        </div>

        <div className='status-card'>
          <div className='status-header'>
            <Clock className='status-icon' />
            <h3>Uptime</h3>
          </div>
          <div className='status-indicator green'>
            {formatUptime(performanceStatus?.metrics?.uptime)}
          </div>
          <p className='status-detail'>
            Last restart: {formatLastRun(dashboardData.timestamp)}
          </p>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className='jobs-grid'>
        {jobStatus?.jobs &&
          Object.entries(jobStatus.jobs).map(([jobName, job]) => {
            const jobInfo = jobDescriptions[jobName] || {
              title: jobName,
              description: 'Background job',
              icon: Settings,
              color: 'gray',
            };
            const IconComponent = jobInfo.icon;

            return (
              <div
                key={jobName}
                className={`job-card job-card-${jobInfo.color}`}
              >
                <div className='job-header'>
                  <div className='job-icon'>
                    <IconComponent />
                  </div>
                  <div className='job-info'>
                    <h3>{jobInfo.title}</h3>
                    <p>{jobInfo.description}</p>
                  </div>
                  {getJobStatusIcon(job)}
                </div>

                <div className='job-details'>
                  <div className='job-stat'>
                    <span className='stat-label'>Schedule:</span>
                    <span className='stat-value'>{job.schedule}</span>
                  </div>
                  <div className='job-stat'>
                    <span className='stat-label'>Last Run:</span>
                    <span className='stat-value'>
                      {formatLastRun(job.lastRun)}
                    </span>
                  </div>
                  <div className='job-stat'>
                    <span className='stat-label'>Success Rate:</span>
                    <span className='stat-value'>
                      {job.successCount > 0 || job.errorCount > 0
                        ? `${Math.round((job.successCount / (job.successCount + job.errorCount)) * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='job-stat'>
                    <span className='stat-label'>Runs:</span>
                    <span className='stat-value'>
                      ✅ {job.successCount} / ❌ {job.errorCount}
                    </span>
                  </div>
                </div>

                {job.lastError && (
                  <div className='job-error'>
                    <AlertTriangle size={16} />
                    <span>Last Error: {job.lastError.error}</span>
                  </div>
                )}

                <div className='job-actions'>
                  <button
                    onClick={() => handleRunJob(jobName)}
                    disabled={runningJob === jobName || job.isRunning}
                    className='run-job-btn'
                  >
                    {runningJob === jobName ? (
                      <>
                        <RefreshCw className='spinning' size={16} />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Run Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Statistics Section */}
      <div className='stats-section'>
        <h2>System Statistics</h2>
        <div className='stats-grid'>
          {stats?.health && (
            <div className='stat-card'>
              <div className='stat-header'>
                <Shield className='stat-icon' />
                <h3>Health Metrics</h3>
              </div>
              <div className='stat-content'>
                <div className='stat-item'>
                  <span>Total Checks:</span>
                  <span>{stats.health.totalChecks || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Healthy Checks:</span>
                  <span>{stats.health.healthyChecks || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Uptime:</span>
                  <span>{stats.health.uptime || 0}%</span>
                </div>
              </div>
            </div>
          )}

          {stats?.notifications && (
            <div className='stat-card'>
              <div className='stat-header'>
                <Bell className='stat-icon' />
                <h3>Notifications</h3>
              </div>
              <div className='stat-content'>
                <div className='stat-item'>
                  <span>Pending:</span>
                  <span>{stats.notifications.pending || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Processed Today:</span>
                  <span>{stats.notifications.processedToday || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Failed Today:</span>
                  <span>{stats.notifications.failedToday || 0}</span>
                </div>
              </div>
            </div>
          )}

          {stats?.overdue && (
            <div className='stat-card'>
              <div className='stat-header'>
                <AlertTriangle className='stat-icon' />
                <h3>Overdue Deliveries</h3>
              </div>
              <div className='stat-content'>
                <div className='stat-item'>
                  <span>Total In Transit:</span>
                  <span>{stats.overdue.totalInTransit || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Overdue:</span>
                  <span>{stats.overdue.overdue || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Critically Overdue:</span>
                  <span>{stats.overdue.criticallyOverdue || 0}</span>
                </div>
              </div>
            </div>
          )}

          {stats?.cleanup && (
            <div className='stat-card'>
              <div className='stat-header'>
                <Database className='stat-icon' />
                <h3>Data Cleanup</h3>
              </div>
              <div className='stat-content'>
                <div className='stat-item'>
                  <span>Last Cleanup:</span>
                  <span>
                    {stats.cleanup.lastCleanup
                      ? formatLastRun(stats.cleanup.lastCleanup)
                      : 'Never'}
                  </span>
                </div>
                <div className='stat-item'>
                  <span>Records Cleaned:</span>
                  <span>{stats.cleanup.recordsCleaned || 0}</span>
                </div>
                <div className='stat-item'>
                  <span>Space Freed:</span>
                  <span>{stats.cleanup.spaceFreed || '0 MB'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
