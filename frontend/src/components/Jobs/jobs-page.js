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
import { Button } from '../UI/button';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Grid, GridItem } from '../UI/grid';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { cn } from '../../lib/utils';

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
      setLoading(true);
      const response = await jobsAPI.getDashboard();
      // Access response directly, not through response.data
      setDashboardData(response || {});
    } catch (error) {
      console.error('Error fetching jobs dashboard:', error);
      toast.error('Failed to load jobs dashboard. Using demo data instead.');
      
      // Provide fallback data when API fails
      const fallbackData = {
        jobStatus: {
          isRunning: false,
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          uptime: 3600,
          lastError: null
        },
        healthStatus: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          issues: []
        },
        performanceStatus: {
          cpu: 25,
          memory: 40,
          disk: 35,
          network: {
            in: 1.2,
            out: 0.8
          }
        },
        stats: {
          totalJobs: 5,
          activeJobs: 0,
          completedJobs: 120,
          failedJobs: 2
        },
        jobs: [
          {
            name: 'healthCheck',
            isRunning: false,
            lastRun: new Date(Date.now() - 900000).toISOString(),
            nextRun: new Date(Date.now() + 900000).toISOString(),
            status: 'completed',
            error: null
          },
          {
            name: 'notifications',
            isRunning: false,
            lastRun: new Date(Date.now() - 1800000).toISOString(),
            nextRun: new Date(Date.now() + 1800000).toISOString(),
            status: 'completed',
            error: null
          },
          {
            name: 'performanceMonitoring',
            isRunning: false,
            lastRun: new Date(Date.now() - 3600000).toISOString(),
            nextRun: new Date(Date.now() + 3600000).toISOString(),
            status: 'completed',
            error: null
          },
          {
            name: 'overdueDeliveries',
            isRunning: false,
            lastRun: new Date(Date.now() - 7200000).toISOString(),
            nextRun: new Date(Date.now() + 7200000).toISOString(),
            status: 'completed',
            error: null
          },
          {
            name: 'dataCleanup',
            isRunning: false,
            lastRun: new Date(Date.now() - 86400000).toISOString(),
            nextRun: new Date(Date.now() + 86400000).toISOString(),
            status: 'completed',
            error: null
          }
        ]
      };
      
      setDashboardData(fallbackData);
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
      const response = await jobsAPI.runJob(jobName);
      toast.success(`Job ${jobName} executed successfully`);
      await fetchDashboardData();
      return response; // Return response directly
    } catch (error) {
      console.error(`Error running job ${jobName}:`, error);
      toast.error(`Failed to run job ${jobName}`);
    } finally {
      setRunningJob(null);
    }
  };

  const handleStartAllJobs = async () => {
    try {
      const response = await jobsAPI.startAllJobs();
      toast.success('All background jobs started');
      await fetchDashboardData();
      return response; // Return response directly
    } catch (error) {
      console.error('Error starting jobs:', error);
      toast.error('Failed to start background jobs');
    }
  };

  const handleStopAllJobs = async () => {
    try {
      const response = await jobsAPI.stopAllJobs();
      toast.success('All background jobs stopped');
      await fetchDashboardData();
      return response; // Return response directly
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

  const getStatusIcon = job => {
    if (job.error) return <AlertTriangle className='h-5 w-5 text-destructive' />;
    if (job.isRunning) return <Activity className='h-5 w-5 text-info' />;
    return <CheckCircle className='h-5 w-5 text-success' />;
  };

  if (loading) {
    return (
      <div className='mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4 py-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-muted-foreground'>Loading jobs dashboard...</p>
        </div>
      </div>
    );
  }

  // Add null checks for destructured properties
  const { jobStatus = {}, healthStatus = {}, performanceStatus = {}, stats = {}, jobs = [] } = dashboardData || {};

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8 flex flex-col gap-6 rounded-xl bg-card p-6 shadow md:flex-row md:items-start md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Zap className='h-6 w-6 text-primary' />
            Background Jobs Management
          </h1>
          <p className='text-muted-foreground'>
            Monitor and control system background processes
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={refreshing}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant='success'
            size='sm'
            onClick={handleStartAllJobs}
            disabled={jobStatus?.isRunning}
            className='flex items-center gap-2'
          >
            <Play className='h-4 w-4' />
            Start All
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={handleStopAllJobs}
            disabled={!jobStatus?.isRunning}
            className='flex items-center gap-2'
          >
            <Square className='h-4 w-4' />
            Stop All
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Grid className='mb-8 gap-6'>
        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-green-200 bg-green-50 p-2 text-green-700'>
                  <Shield className='h-5 w-5' />
                </div>
                <Badge
                  variant={
                    getHealthStatusColor(healthStatus?.status) === 'green'
                      ? 'success'
                      : getHealthStatusColor(healthStatus?.status) === 'yellow'
                        ? 'warning'
                        : 'destructive'
                  }
                >
                  {healthStatus?.status || 'Unknown'}
                </Badge>
              </div>
              <h3 className='text-lg font-medium'>System Health</h3>
              <p className='text-sm text-muted-foreground'>
                {healthStatus?.issues
                  ? `${healthStatus.issues.length} issues detected`
                  : 'All systems operational'}
              </p>
              {healthStatus?.issues && healthStatus.issues.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <ul className='text-sm'>
                    {healthStatus.issues.map((issue, index) => (
                      <li
                        key={index}
                        className='flex items-center gap-2 text-amber-600'
                      >
                        <AlertTriangle className='h-3 w-3' />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </GridItem>

        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700'>
                  <Activity className='h-5 w-5' />
                </div>
                <Badge
                  variant={jobStatus?.isRunning ? 'success' : 'destructive'}
                >
                  {jobStatus?.isRunning ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              <h3 className='text-lg font-medium'>Jobs Status</h3>
              <p className='text-sm text-muted-foreground'>
                {jobStatus?.totalJobs || 0} jobs configured
              </p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-purple-200 bg-purple-50 p-2 text-purple-700'>
                  <TrendingUp className='h-5 w-5' />
                </div>
                <Badge
                  variant={
                    performanceStatus?.status === 'OK' ? 'success' : 'warning'
                  }
                >
                  {performanceStatus?.status || 'Unknown'}
                </Badge>
              </div>
              <h3 className='text-lg font-medium'>Performance</h3>
              <p className='text-sm text-muted-foreground'>
                Memory: {performanceStatus?.metrics?.memoryUsage || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700'>
                  <Clock className='h-5 w-5' />
                </div>
                <Badge variant='success'>Active</Badge>
              </div>
              <h3 className='text-lg font-medium'>Uptime</h3>
              <p className='text-sm text-muted-foreground'>
                {formatUptime(performanceStatus?.metrics?.uptime)}
                <br />
                Last restart: {formatLastRun(dashboardData.timestamp)}
              </p>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Jobs Grid */}
      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => {
            const jobName = job.name;
            const jobInfo = jobDescriptions[jobName] || {
              title: jobName,
              description: 'Background job',
              icon: Settings,
              color: 'gray',
            };
            const JobIcon = jobInfo.icon;

            return (
              <Card key={jobName} className='overflow-hidden'>
                <div
                  className={`border-b-2 border-${jobInfo.color}-500 bg-${jobInfo.color}-50 p-4`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`rounded-lg border border-${jobInfo.color}-200 bg-${jobInfo.color}-100 p-2 text-${jobInfo.color}-700`}
                      >
                        <JobIcon className='h-5 w-5' />
                      </div>
                      <h3 className='font-medium'>{jobInfo.title}</h3>
                    </div>
                    {getStatusIcon(job)}
                  </div>
                </div>
                <CardContent className='p-4'>
                  <p className='mb-4 text-sm text-muted-foreground'>
                    {jobInfo.description}
                  </p>

                  <div className='mb-4 space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Status:</span>
                      <span
                        className={cn(
                          'font-medium',
                          job.error
                            ? 'text-destructive'
                            : job.isRunning
                            ? 'text-info'
                            : 'text-success'
                        )}
                      >
                        {job.error
                          ? 'Error'
                          : job.isRunning
                          ? 'Running'
                          : job.status || 'Idle'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Last run:</span>
                      <span>{formatLastRun(job.lastRun)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Next run:</span>
                      <span>{formatLastRun(job.nextRun)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRunJob(jobName)}
                    disabled={job.isRunning || runningJob === jobName}
                    className='w-full'
                    variant='outline'
                  >
                    {runningJob === jobName ? (
                      <>
                        <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className='mr-2 h-4 w-4' />
                        Run Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className='col-span-3 rounded-lg border border-dashed p-8 text-center'>
            <Settings className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 text-lg font-medium'>No jobs available</h3>
            <p className='mb-4 text-sm text-muted-foreground'>
              There are no background jobs configured in the system.
            </p>
          </div>
        )}
      </div>

      {/* Statistics Section */}
      <div className='mb-8'>
        <h2 className='mb-4 text-xl font-semibold'>System Statistics</h2>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {stats?.health && (
            <Card>
              <CardContent className='pt-6'>
                <div className='mb-4 flex items-center gap-3'>
                  <div className='rounded-lg border border-green-200 bg-green-50 p-2 text-green-700'>
                    <Shield className='h-5 w-5' />
                  </div>
                  <h3 className='font-medium'>Health Metrics</h3>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Total Checks:</span>
                    <span className='font-medium'>
                      {stats.health.totalChecks || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Healthy Checks:
                    </span>
                    <span className='font-medium'>
                      {stats.health.healthyChecks || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Uptime:</span>
                    <span className='font-medium'>
                      {stats.health.uptime || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.notifications && (
            <Card>
              <CardContent className='pt-6'>
                <div className='mb-4 flex items-center gap-3'>
                  <div className='rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700'>
                    <Bell className='h-5 w-5' />
                  </div>
                  <h3 className='font-medium'>Notifications</h3>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Pending:</span>
                    <span className='font-medium'>
                      {stats.notifications.pending || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Processed Today:
                    </span>
                    <span className='font-medium'>
                      {stats.notifications.processedToday || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Failed Today:</span>
                    <span className='font-medium'>
                      {stats.notifications.failedToday || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.overdue && (
            <Card>
              <CardContent className='pt-6'>
                <div className='mb-4 flex items-center gap-3'>
                  <div className='rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700'>
                    <AlertTriangle className='h-5 w-5' />
                  </div>
                  <h3 className='font-medium'>Overdue Deliveries</h3>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Total In Transit:
                    </span>
                    <span className='font-medium'>
                      {stats.overdue.totalInTransit || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Overdue:</span>
                    <span className='font-medium'>
                      {stats.overdue.overdue || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Critically Overdue:
                    </span>
                    <span className='font-medium'>
                      {stats.overdue.criticallyOverdue || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.cleanup && (
            <Card>
              <CardContent className='pt-6'>
                <div className='mb-4 flex items-center gap-3'>
                  <div className='rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700'>
                    <Database className='h-5 w-5' />
                  </div>
                  <h3 className='font-medium'>Data Cleanup</h3>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Last Cleanup:</span>
                    <span className='font-medium'>
                      {stats.cleanup.lastCleanup
                        ? formatLastRun(stats.cleanup.lastCleanup)
                        : 'Never'}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Records Cleaned:
                    </span>
                    <span className='font-medium'>
                      {stats.cleanup.recordsCleaned || 0}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Space Freed:</span>
                    <span className='font-medium'>
                      {stats.cleanup.spaceFreed || '0 MB'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
