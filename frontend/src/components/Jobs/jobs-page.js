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

  const getStatusIcon = job => {
    if (job.error) return <AlertTriangle className='text-destructive h-5 w-5' />;
    if (job.isRunning) return <Activity className='text-info h-5 w-5' />;
    return <CheckCircle className='text-success h-5 w-5' />;
  };

  if (loading) {
    return (
      <div className='px-4 py-6 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]'>
        <div className='text-center'>
          <div className='h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading jobs dashboard...</p>
        </div>
      </div>
    );
  }

  const { jobStatus, healthStatus, performanceStatus, stats } = dashboardData;

  return (
    <div className='px-4 py-6 max-w-7xl mx-auto'>
      <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8 bg-card p-6 rounded-xl shadow'>
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
              className={refreshing ? 'animate-spin h-4 w-4' : 'h-4 w-4'}
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
      <Grid className='gap-6 mb-8'>
        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex justify-between items-start mb-4'>
                <div className='p-2 rounded-lg bg-green-50 text-green-700 border border-green-200'>
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
              <div className='flex justify-between items-start mb-4'>
                <div className='p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200'>
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
              <div className='flex justify-between items-start mb-4'>
                <div className='p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200'>
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
              <div className='flex justify-between items-start mb-4'>
                <div className='p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200'>
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
        {jobStatus?.jobs &&
          Object.entries(jobStatus.jobs).map(([jobName, job]) => {
            const jobInfo = jobDescriptions[jobName] || {
              title: jobName,
              description: 'Background job',
              icon: Settings,
              color: 'gray',
            };
            const IconComponent = jobInfo.icon;

            const colorMap = {
              green: 'bg-green-50 text-green-700 border-green-200',
              blue: 'bg-blue-50 text-blue-700 border-blue-200',
              purple: 'bg-purple-50 text-purple-700 border-purple-200',
              orange: 'bg-amber-50 text-amber-700 border-amber-200',
              red: 'bg-red-50 text-red-700 border-red-200',
              gray: 'bg-slate-50 text-slate-700 border-slate-200',
            };

            return (
              <Card key={jobName} className='overflow-hidden'>
                <div className='p-6'>
                  <div className='flex justify-between items-start mb-4'>
                    <div
                      className={cn(
                        'p-2 rounded-lg border',
                        colorMap[jobInfo.color]
                      )}
                    >
                      <IconComponent className='h-5 w-5' />
                    </div>
                    <div>
                      {job.errorCount > 0 ? (
                        <Badge
                          variant='destructive'
                          className='flex items-center gap-1'
                        >
                          <AlertTriangle className='h-3 w-3' />
                          Error
                        </Badge>
                      ) : job.isRunning ? (
                        <Badge
                          variant='info'
                          className='flex items-center gap-1'
                        >
                          <Activity className='h-3 w-3' />
                          Running
                        </Badge>
                      ) : (
                        <Badge
                          variant='success'
                          className='flex items-center gap-1'
                        >
                          <CheckCircle className='h-3 w-3' />
                          Ready
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className='text-lg font-medium'>{jobInfo.title}</h3>
                  <p className='text-sm text-muted-foreground mb-6'>
                    {jobInfo.description}
                  </p>

                  <div className='space-y-3 mb-6'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Schedule:</span>
                      <span className='font-medium'>{job.schedule}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Last Run:</span>
                      <span className='font-medium'>
                        {formatLastRun(job.lastRun)}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Success Rate:
                      </span>
                      <span className='font-medium'>
                        {job.successCount > 0 || job.errorCount > 0
                          ? `${Math.round((job.successCount / (job.successCount + job.errorCount)) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Runs:</span>
                      <span className='font-medium'>
                        <span className='text-success'>
                          {job.successCount}
                        </span>{' '}
                        /<span className='text-red-600'>{job.errorCount}</span>
                      </span>
                    </div>
                  </div>

                  {job.lastError && (
                    <div className='p-3 bg-red-50 border border-red-200 rounded-md mb-4 text-sm text-red-800 flex items-start gap-2'>
                      <AlertTriangle className='h-4 w-4 mt-0.5 flex-shrink-0' />
                      <span>Last Error: {job.lastError.error}</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleRunJob(jobName)}
                    disabled={runningJob === jobName || job.isRunning}
                    className='w-full'
                    variant='outline'
                  >
                    {runningJob === jobName ? (
                      <>
                        <RefreshCw className='animate-spin h-4 w-4 mr-2' />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap className='h-4 w-4 mr-2' />
                        Run Now
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
      </div>

      {/* Statistics Section */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold mb-4'>System Statistics</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {stats?.health && (
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='p-2 rounded-lg bg-green-50 text-green-700 border border-green-200'>
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
                <div className='flex items-center gap-3 mb-4'>
                  <div className='p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200'>
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
                <div className='flex items-center gap-3 mb-4'>
                  <div className='p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200'>
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
                <div className='flex items-center gap-3 mb-4'>
                  <div className='p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200'>
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
