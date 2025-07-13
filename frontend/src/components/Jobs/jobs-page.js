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
import { useTranslation } from 'react-i18next';
import { Button } from '../UI/button';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Grid, GridItem } from '../UI/grid';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { cn } from '../../lib/utils';

const JobsPage = () => {
  const { t } = useTranslation(['jobs', 'common']);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [runningJob, setRunningJob] = useState(null);

  const jobDescriptions = {
    healthCheck: {
      title: t('jobs.healthCheck'),
      description: t('jobs.healthCheckDescription'),
      icon: Shield,
      color: 'green',
    },
    notifications: {
      title: t('jobs.notifications'),
      description: t('jobs.notificationsDescription'),
      icon: Bell,
      color: 'blue',
    },
    performanceMonitoring: {
      title: t('jobs.performanceMonitoring'),
      description: t('jobs.performanceMonitoringDescription'),
      icon: Monitor,
      color: 'purple',
    },
    overdueDeliveries: {
      title: t('jobs.overdueDeliveries'),
      description: t('jobs.overdueDeliveriesDescription'),
      icon: AlertTriangle,
      color: 'orange',
    },
    dataCleanup: {
      title: t('jobs.dataCleanup'),
      description: t('jobs.dataCleanupDescription'),
      icon: Database,
      color: 'red',
    },
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getStatus();
      setDashboardData(response); // Changed from response.data to response
    } catch (error) {
      console.error('Error fetching job status:', error);
      toast.error(t('jobs.errorFetchingStatus'));
      // Provide fallback data to prevent destructuring errors
      setDashboardData({
        jobStatus: { 
          isRunning: false,
          activeJobs: 0,
          totalJobs: 0,
          successRate: 0,
          lastRun: null,
          jobs: []
        },
        systemHealth: { 
          status: 'unknown',
          issuesCount: 0
        },
        recentRuns: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success(t('jobs.dataRefreshed'));
  };

  const handleStartJob = async (jobName) => {
    try {
      setRunningJob(jobName);
      await jobsAPI.startJob(jobName);
      toast.success(t('jobs.jobStarted', { jobName }));
      fetchDashboardData();
    } catch (error) {
      console.error(`Error starting job ${jobName}:`, error);
      toast.error(t('jobs.errorStartingJob', { jobName }));
    } finally {
      setRunningJob(null);
    }
  };

  const handleStopJob = async (jobName) => {
    try {
      setRunningJob(jobName);
      await jobsAPI.stopJob(jobName);
      toast.success(t('jobs.jobStopped', { jobName }));
      fetchDashboardData();
    } catch (error) {
      console.error(`Error stopping job ${jobName}:`, error);
      toast.error(t('jobs.errorStoppingJob', { jobName }));
    } finally {
      setRunningJob(null);
    }
  };

  const handleStartAllJobs = async () => {
    try {
      setRunningJob('all');
      await jobsAPI.startAllJobs();
      toast.success(t('jobs.allJobsStarted'));
      fetchDashboardData();
    } catch (error) {
      console.error('Error starting all jobs:', error);
      toast.error(t('jobs.errorStartingAllJobs'));
    } finally {
      setRunningJob(null);
    }
  };

  const handleStopAllJobs = async () => {
    try {
      setRunningJob('all');
      await jobsAPI.stopAllJobs();
      toast.success(t('jobs.allJobsStopped'));
      fetchDashboardData();
    } catch (error) {
      console.error('Error stopping all jobs:', error);
      toast.error(t('jobs.errorStoppingAllJobs'));
    } finally {
      setRunningJob(null);
    }
  };

  const { jobStatus = {}, systemHealth = {}, recentRuns = [] } = dashboardData || {};

  if (loading) {
    return (
      <div className='mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4 py-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-muted-foreground'>{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8 flex flex-col gap-6 rounded-xl bg-card p-6 shadow md:flex-row md:items-start md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Zap className='h-6 w-6 text-primary' />
            {t('jobs.title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('jobs.subtitle')}
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
            {refreshing ? t('common:loading') : t('common:refresh')}
          </Button>
          <Button
            variant='success'
            size='sm'
            onClick={handleStartAllJobs}
            disabled={jobStatus?.isRunning}
            className='flex items-center gap-2'
          >
            <Play className='h-4 w-4' />
            {t('jobs.startAll')}
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={handleStopAllJobs}
            disabled={!jobStatus?.isRunning}
            className='flex items-center gap-2'
          >
            <Square className='h-4 w-4' />
            {t('jobs.stopAll')}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Grid className='mb-8 gap-6'>
        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700'>
                  <Activity className='h-5 w-5' />
                </div>
                <Badge
                  variant={jobStatus?.isRunning ? 'success' : 'destructive'}
                  className='text-xs'
                >
                  {jobStatus?.isRunning
                    ? t('jobs.systemActive')
                    : t('jobs.systemInactive')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {jobStatus?.activeJobs || 0}/{jobStatus?.totalJobs || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>{t('jobs.activeJobs')}</p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-green-200 bg-green-50 p-2 text-green-700'>
                  <CheckCircle className='h-5 w-5' />
                </div>
                <Badge variant='outline' className='text-xs'>
                  {t('jobs.lastRun')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {jobStatus?.successRate || 0}%
              </h3>
              <p className='text-sm text-muted-foreground'>{t('jobs.successRate')}</p>
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
                <Badge variant='outline' className='text-xs'>
                  {t('jobs.lastExecution')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {jobStatus?.lastRun
                  ? new Date(jobStatus.lastRun).toLocaleTimeString()
                  : '--:--'}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {jobStatus?.lastRun
                  ? new Date(jobStatus.lastRun).toLocaleDateString()
                  : t('jobs.never')}
              </p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-red-200 bg-red-50 p-2 text-red-700'>
                  <AlertTriangle className='h-5 w-5' />
                </div>
                <Badge
                  variant={
                    systemHealth?.status === 'healthy'
                      ? 'success'
                      : systemHealth?.status === 'warning'
                      ? 'warning'
                      : 'destructive'
                  }
                  className='text-xs'
                >
                  {systemHealth?.status === 'healthy'
                    ? t('jobs.healthy')
                    : systemHealth?.status === 'warning'
                    ? t('jobs.warning')
                    : t('jobs.critical')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {systemHealth?.issuesCount || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>{t('jobs.activeIssues')}</p>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Jobs Table */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <h3 className='mb-4 text-lg font-medium'>{t('jobs.backgroundJobs')}</h3>
          <p className='mb-6 text-sm text-muted-foreground'>
            {t('jobs.manageBackgroundJobs')}
          </p>

          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='p-3 text-left'>{t('jobs.jobName')}</th>
                  <th className='p-3 text-left'>{t('jobs.description')}</th>
                  <th className='p-3 text-left'>{t('jobs.schedule')}</th>
                  <th className='p-3 text-left'>{t('jobs.lastRunTime')}</th>
                  <th className='p-3 text-left'>{t('jobs.status')}</th>
                  <th className='p-3 text-left'>{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobStatus?.jobs?.map(job => {
                  const jobInfo = jobDescriptions[job.name] || {
                    title: job.name,
                    description: t('jobs.noDescription'),
                    icon: Settings,
                    color: 'gray',
                  };
                  const JobIcon = jobInfo.icon;

                  return (
                    <tr key={job.name} className='border-b hover:bg-muted/50'>
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`rounded p-1 text-${jobInfo.color}-600`}
                          >
                            <JobIcon className='h-4 w-4' />
                          </div>
                          <span className='font-medium'>{jobInfo.title}</span>
                        </div>
                      </td>
                      <td className='p-3 text-sm text-muted-foreground'>
                        {jobInfo.description}
                      </td>
                      <td className='p-3'>{job.schedule || t('jobs.manual')}</td>
                      <td className='p-3'>
                        {job.lastRun
                          ? new Date(job.lastRun).toLocaleString()
                          : t('jobs.never')}
                      </td>
                      <td className='p-3'>
                        <Badge
                          variant={
                            job.status === 'running'
                              ? 'success'
                              : job.status === 'idle'
                              ? 'outline'
                              : job.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {job.status === 'running'
                            ? t('jobs.running')
                            : job.status === 'idle'
                            ? t('jobs.idle')
                            : job.status === 'failed'
                            ? t('jobs.failed')
                            : job.status}
                        </Badge>
                      </td>
                      <td className='p-3'>
                        {job.status === 'running' ? (
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleStopJob(job.name)}
                            disabled={runningJob === job.name}
                            className='flex items-center gap-1'
                          >
                            {runningJob === job.name ? (
                              <RefreshCw className='h-3 w-3 animate-spin' />
                            ) : (
                              <Square className='h-3 w-3' />
                            )}
                            {t('jobs.stop')}
                          </Button>
                        ) : (
                          <Button
                            variant='success'
                            size='sm'
                            onClick={() => handleStartJob(job.name)}
                            disabled={runningJob === job.name}
                            className='flex items-center gap-1'
                          >
                            {runningJob === job.name ? (
                              <RefreshCw className='h-3 w-3 animate-spin' />
                            ) : (
                              <Play className='h-3 w-3' />
                            )}
                            {t('jobs.start')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Job Runs */}
      <Card>
        <CardContent className='p-6'>
          <h3 className='mb-4 text-lg font-medium'>{t('jobs.recentJobRuns')}</h3>
          <p className='mb-6 text-sm text-muted-foreground'>
            {t('jobs.recentJobRunsDescription')}
          </p>

          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='p-3 text-left'>{t('jobs.jobName')}</th>
                  <th className='p-3 text-left'>{t('jobs.startTime')}</th>
                  <th className='p-3 text-left'>{t('jobs.endTime')}</th>
                  <th className='p-3 text-left'>{t('jobs.duration')}</th>
                  <th className='p-3 text-left'>{t('jobs.status')}</th>
                  <th className='p-3 text-left'>{t('jobs.result')}</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns?.map((run, index) => {
                  const jobInfo = jobDescriptions[run.jobName] || {
                    title: run.jobName,
                    icon: Settings,
                    color: 'gray',
                  };
                  const JobIcon = jobInfo.icon;

                  return (
                    <tr key={index} className='border-b hover:bg-muted/50'>
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`rounded p-1 text-${jobInfo.color}-600`}
                          >
                            <JobIcon className='h-4 w-4' />
                          </div>
                          <span className='font-medium'>{jobInfo.title}</span>
                        </div>
                      </td>
                      <td className='p-3'>
                        {new Date(run.startTime).toLocaleString()}
                      </td>
                      <td className='p-3'>
                        {run.endTime
                          ? new Date(run.endTime).toLocaleString()
                          : t('jobs.running')}
                      </td>
                      <td className='p-3'>
                        {run.duration ? `${run.duration}ms` : '--'}
                      </td>
                      <td className='p-3'>
                        <Badge
                          variant={
                            run.status === 'completed'
                              ? 'success'
                              : run.status === 'running'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {run.status === 'completed'
                            ? t('jobs.completed')
                            : run.status === 'running'
                            ? t('jobs.running')
                            : run.status === 'failed'
                            ? t('jobs.failed')
                            : run.status}
                        </Badge>
                      </td>
                      <td className='p-3 text-sm'>
                        {run.result || t('jobs.noResult')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsPage;
