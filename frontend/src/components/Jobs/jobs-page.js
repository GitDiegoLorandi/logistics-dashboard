import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
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

const JobsPage = () => {
  const { t } = useTranslation(['jobs', 'common']);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [runningJob, setRunningJob] = useState(null);

  const jobDescriptions = {
    healthCheck: {
      title: t('healthCheck'),
      description: t('healthCheckDescription'),
      icon: Shield,
      color: 'green',
    },
    notifications: {
      title: t('notifications'),
      description: t('notificationsDescription'),
      icon: Bell,
      color: 'blue',
    },
    performanceMonitoring: {
      title: t('performanceMonitoring'),
      description: t('performanceMonitoringDescription'),
      icon: Monitor,
      color: 'purple',
    },
    overdueDeliveries: {
      title: t('overdueDeliveries'),
      description: t('overdueDeliveriesDescription'),
      icon: AlertTriangle,
      color: 'orange',
    },
    dataCleanup: {
      title: t('dataCleanup'),
      description: t('dataCleanupDescription'),
      icon: Database,
      color: 'red',
    },
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getStatus();
      setDashboardData(response); // Changed from response.data to response
    } catch (error) {
      console.error('Error fetching job status:', error);
      toast.error(t('errorFetchingStatus'));
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
  }, [t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success(t('dataRefreshed'));
  };

  const handleStartJob = async (jobName) => {
    try {
      setRunningJob(jobName);
      await jobsAPI.startJob(jobName);
      toast.success(t('jobStarted', { jobName }));
      fetchDashboardData();
    } catch (error) {
      console.error(`Error starting job ${jobName}:`, error);
      toast.error(t('errorStartingJob', { jobName }));
    } finally {
      setRunningJob(null);
    }
  };

  const handleStopJob = async (jobName) => {
    try {
      setRunningJob(jobName);
      await jobsAPI.stopJob(jobName);
      toast.success(t('jobStopped', { jobName }));
      fetchDashboardData();
    } catch (error) {
      console.error(`Error stopping job ${jobName}:`, error);
      toast.error(t('errorStoppingJob', { jobName }));
    } finally {
      setRunningJob(null);
    }
  };

  const handleStartAllJobs = async () => {
    try {
      setRunningJob('all');
      await jobsAPI.startAllJobs();
      toast.success(t('allJobsStarted'));
      fetchDashboardData();
    } catch (error) {
      console.error('Error starting all jobs:', error);
      toast.error(t('errorStartingAllJobs'));
    } finally {
      setRunningJob(null);
    }
  };

  const handleStopAllJobs = async () => {
    try {
      setRunningJob('all');
      await jobsAPI.stopAllJobs();
      toast.success(t('allJobsStopped'));
      fetchDashboardData();
    } catch (error) {
      console.error('Error stopping all jobs:', error);
      toast.error(t('errorStoppingAllJobs'));
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
            {t('title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('subtitle')}
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
            variant='default'
            size='sm'
            onClick={handleStartAllJobs}
            disabled={jobStatus?.isRunning}
            className='flex items-center gap-2'
          >
            <Play className='h-4 w-4' />
            {t('startAll')}
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={handleStopAllJobs}
            disabled={!jobStatus?.isRunning}
            className='flex items-center gap-2'
          >
            <Square className='h-4 w-4' />
            {t('stopAll')}
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
                    ? t('systemActive')
                    : t('systemInactive')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {jobStatus?.activeJobs || 0}/{jobStatus?.totalJobs || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>{t('activeJobs')}</p>
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
                  {t('lastRun')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {jobStatus?.successRate || 0}%
              </h3>
              <p className='text-sm text-muted-foreground'>{t('successRate')}</p>
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
                  {t('lastExecution')}
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
                  : t('never')}
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
                    ? t('healthy')
                    : systemHealth?.status === 'warning'
                    ? t('warning')
                    : t('critical')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {systemHealth?.issuesCount || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>{t('activeIssues')}</p>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Jobs Table */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <h3 className='mb-4 text-lg font-medium'>{t('backgroundJobs')}</h3>
          <p className='mb-6 text-sm text-muted-foreground'>
            {t('manageBackgroundJobs')}
          </p>

          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='p-3 text-left'>{t('jobName')}</th>
                  <th className='p-3 text-left'>{t('description')}</th>
                  <th className='p-3 text-left'>{t('schedule')}</th>
                  <th className='p-3 text-left'>{t('lastRunTime')}</th>
                  <th className='p-3 text-left'>{t('status')}</th>
                  <th className='p-3 text-left'>{t('common:actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobStatus?.jobs?.map(job => {
                  const jobInfo = jobDescriptions[job.name] || {
                    title: job.name,
                    description: t('noDescription'),
                    icon: Settings,
                    color: 'gray',
                  };
                  const JobIcon = jobInfo.icon;

                  return (
                    <tr key={job.name} className='border-b hover:bg-muted/50'>
                      <td className='p-3'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`rounded p-1 ${
                              jobInfo.color === 'green' ? 'text-green-600' :
                              jobInfo.color === 'blue' ? 'text-blue-600' :
                              jobInfo.color === 'purple' ? 'text-purple-600' :
                              jobInfo.color === 'orange' ? 'text-orange-600' :
                              jobInfo.color === 'red' ? 'text-red-600' :
                              'text-gray-600'
                            }`}
                          >
                            <JobIcon className='h-4 w-4' />
                          </div>
                          <span className='font-medium'>{jobInfo.title}</span>
                        </div>
                      </td>
                      <td className='p-3 text-sm text-muted-foreground'>
                        {jobInfo.description}
                      </td>
                      <td className='p-3'>{job.schedule || t('manual')}</td>
                      <td className='p-3'>
                        {job.lastRun
                          ? new Date(job.lastRun).toLocaleString()
                          : t('never')}
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
                            ? t('running')
                            : job.status === 'idle'
                            ? t('idle')
                            : job.status === 'failed'
                            ? t('failed')
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
                            {t('stop')}
                          </Button>
                        ) : (
                          <Button
                            variant='default'
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
                            {t('start')}
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
          <h3 className='mb-4 text-lg font-medium'>{t('recentJobRuns')}</h3>
          <p className='mb-6 text-sm text-muted-foreground'>
            {t('recentJobRunsDescription')}
          </p>

          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='p-3 text-left'>{t('jobName')}</th>
                  <th className='p-3 text-left'>{t('startTime')}</th>
                  <th className='p-3 text-left'>{t('endTime')}</th>
                  <th className='p-3 text-left'>{t('duration')}</th>
                  <th className='p-3 text-left'>{t('status')}</th>
                  <th className='p-3 text-left'>{t('result')}</th>
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
                            className={`rounded p-1 ${
                              jobInfo.color === 'green' ? 'text-green-600' :
                              jobInfo.color === 'blue' ? 'text-blue-600' :
                              jobInfo.color === 'purple' ? 'text-purple-600' :
                              jobInfo.color === 'orange' ? 'text-orange-600' :
                              jobInfo.color === 'red' ? 'text-red-600' :
                              'text-gray-600'
                            }`}
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
                          : t('running')}
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
                            ? t('completed')
                            : run.status === 'running'
                            ? t('running')
                            : run.status === 'failed'
                            ? t('failed')
                            : run.status}
                        </Badge>
                      </td>
                      <td className='p-3 text-sm'>
                        {run.result || t('noResult')}
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
