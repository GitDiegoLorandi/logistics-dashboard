import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Package,
  CheckCircle,
  Users,
  Clock,
  Filter,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { statisticsAPI } from '../../services/api';
import { Button } from '../UI/button';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Grid, GridItem } from '../UI/grid';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Label } from '../UI/label';
import ResponsiveChartCard from '../UI/data-visualization/charts/responsive-chart-card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-lg border bg-card p-3 shadow'>
        <p className='mb-1 font-medium'>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const { t } = useTranslation(['analytics', 'common', 'deliveries']);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({});
  const [statusStats, setStatusStats] = useState([]);
  const [delivererPerformance, setDelivererPerformance] = useState([]);
  const [deliveryTrends, setDeliveryTrends] = useState({});
  const [priorityStats, setPriorityStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'day',
  });
  const [dateRangeStats, setDateRangeStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Color schemes for charts
  const statusColors = {
    Delivered: '#10B981',
    Pending: '#F59E0B',
    'In Transit': '#3B82F6',
    Cancelled: '#EF4444',
  };

  const priorityColors = {
    High: '#EF4444',
    Medium: '#F59E0B',
    Low: '#10B981',
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        overallResponse,
        statusResponse,
        delivererResponse,
        trendsResponse,
        priorityResponse,
      ] = await Promise.all([
        statisticsAPI.getOverall(),
        statisticsAPI.getByStatus(),
        statisticsAPI.getDelivererPerformance(),
        statisticsAPI.getTrends(),
        statisticsAPI.getPriority(),
      ]);

      setOverallStats(overallResponse.data);
      setStatusStats(statusResponse.data);
      setDelivererPerformance(delivererResponse.data);
      setDeliveryTrends(trendsResponse.data);
      setPriorityStats(priorityResponse.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDateRangeData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error(t('selectDateRange'));
      return;
    }

    try {
      const response = await statisticsAPI.getByDateRange({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: dateRange.groupBy,
      });
      setDateRangeStats(response.data);
    } catch (error) {
      console.error('Error fetching date range data:', error);
      toast.error(t('failedToLoadDateRange'));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success(t('dataRefreshed'));
  };

  const handleExport = () => {
    const data = {
      overall: overallStats,
      status: statusStats,
      delivererPerformance: delivererPerformance,
      trends: deliveryTrends,
      priority: priorityStats,
      dateRange: dateRangeStats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('dataExported'));
  };

  const formatTrendData = trends => {
    if (!trends || !trends.trends) return [];

    return trends.trends.map(trend => {
      const data = { date: trend._id, total: trend.totalCount };

      // Initialize all statuses to 0
      Object.keys(statusColors).forEach(status => {
        data[status] = 0;
      });

      // Fill in actual values
      trend.statuses.forEach(statusData => {
        data[statusData.status] = statusData.count;
      });

      return data;
    });
  };

  const prepareStatusPieData = () => {
    return statusStats.map(stat => ({
      name: stat.status,
      value: stat.count,
      percentage: parseFloat(stat.percentage),
    }));
  };

  const preparePriorityBarData = () => {
    return priorityStats.map(stat => ({
      priority: stat.priority,
      total: stat.count,
      delivered: stat.delivered,
      pending: stat.pending,
      inTransit: stat.inTransit,
      cancelled: stat.cancelled,
      completionRate: stat.completionRate,
    }));
  };

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
            <TrendingUp className='h-6 w-6 text-primary' />
            {t('title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('overview')}
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
            {refreshing ? t('common:loading') : t('refreshData')}
          </Button>
          <Button
            onClick={handleExport}
            size='sm'
            className='flex items-center gap-2'
          >
            <Download className='h-4 w-4' />
            {t('exportReport')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Grid className='mb-8 gap-6'>
        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700'>
                  <Package className='h-5 w-5' />
                </div>
                <Badge variant='success' className='text-xs'>
                  +{overallStats.deliveryBreakdown?.delivered || 0}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.totalDeliveries || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>{t('totalDeliveries')}</p>
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
                <Badge variant='success' className='text-xs'>
                  {overallStats.deliveryBreakdown?.delivered || 0} {t('deliveries.statuses.delivered', { ns: 'deliveries' })}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.deliveryRate || 0}%
              </h3>
              <p className='text-sm text-muted-foreground'>
                {t('completionRate')}
              </p>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem colSpan='col-span-12 sm:col-span-6 lg:col-span-3'>
          <Card>
            <CardContent className='pt-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='rounded-lg border border-purple-200 bg-purple-50 p-2 text-purple-700'>
                  <Users className='h-5 w-5' />
                </div>
                <Badge variant='outline' className='text-xs'>
                  {t('of')} {overallStats.totalDeliverers || 0} {t('total')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.activeDeliverers || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>{t('deliverers.statuses.active', { ns: 'deliverers' })} {t('deliverers.title', { ns: 'deliverers' })}</p>
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
                  {t('avgTime')}
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.averageDeliveryTime || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {t('averageDeliveryTime')} ({t('minutes')})
              </p>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Section */}
      <Grid className='mb-8 gap-6'>
        {/* Delivery Status Distribution */}
        <GridItem colSpan='col-span-12 lg:col-span-6'>
          <ResponsiveChartCard
            title={t('deliveryStatusDistribution')}
            subtitle={t('currentBreakdown')}
          >
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={prepareStatusPieData()}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='value'
                  nameKey='name'
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {prepareStatusPieData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={statusColors[entry.name] || '#8884d8'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ResponsiveChartCard>
        </GridItem>

        {/* Delivery Trends */}
        <GridItem colSpan='col-span-12 lg:col-span-6'>
          <ResponsiveChartCard
            title={t('deliveryTrends')}
            subtitle={t('dashboard:lastSevenDays', { ns: 'dashboard' })}
          >
            <ResponsiveContainer width='100%' height={300}>
              <LineChart
                data={formatTrendData(deliveryTrends)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='Delivered'
                  stroke={statusColors['Delivered']}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type='monotone'
                  dataKey='Pending'
                  stroke={statusColors['Pending']}
                />
                <Line
                  type='monotone'
                  dataKey='In Transit'
                  stroke={statusColors['In Transit']}
                />
              </LineChart>
            </ResponsiveContainer>
          </ResponsiveChartCard>
        </GridItem>

        {/* Priority Statistics */}
        <GridItem colSpan='col-span-12'>
          <ResponsiveChartCard
            title={t('priorityStatistics')}
            subtitle={t('deliveryCompletionByPriority')}
          >
            <ResponsiveContainer width='100%' height={300}>
              <BarChart
                data={preparePriorityBarData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='priority' />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey='delivered' name={t('deliveries.statuses.delivered', { ns: 'deliveries' })} fill='#10B981' />
                <Bar dataKey='pending' name={t('deliveries.statuses.pending', { ns: 'deliveries' })} fill='#F59E0B' />
                <Bar dataKey='inTransit' name={t('deliveries.statuses.inTransit', { ns: 'deliveries' })} fill='#3B82F6' />
              </BarChart>
            </ResponsiveContainer>
          </ResponsiveChartCard>
        </GridItem>
      </Grid>

      {/* Custom Date Range Section */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <h3 className='mb-4 text-lg font-medium'>{t('customDateRange')}</h3>
          <p className='mb-6 text-sm text-muted-foreground'>
            {t('filterDeliveriesByDateRange')}
          </p>

          <div className='mb-6 grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='startDate'>{t('startDate')}</Label>
              <Input
                id='startDate'
                type='date'
                value={dateRange.startDate}
                onChange={e =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='endDate'>{t('endDate')}</Label>
              <Input
                id='endDate'
                type='date'
                value={dateRange.endDate}
                onChange={e =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='groupBy'>{t('groupBy')}</Label>
              <Select
                id='groupBy'
                value={dateRange.groupBy}
                onChange={e =>
                  setDateRange({ ...dateRange, groupBy: e.target.value })
                }
              >
                <option value='day'>{t('common:day')}</option>
                <option value='week'>{t('common:week')}</option>
                <option value='month'>{t('common:month')}</option>
              </Select>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={fetchDateRangeData}
              className='flex items-center gap-2'
            >
              <Filter className='h-4 w-4' />
              {t('applyFilter')}
            </Button>
          </div>

          {Object.keys(dateRangeStats).length > 0 && (
            <div className='mt-8'>
              <h4 className='mb-4 text-md font-medium'>
                {t('resultsFor')} {dateRange.startDate} {t('common:to')} {dateRange.endDate}
              </h4>

              {/* Date Range Results Chart */}
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={dateRangeStats.data || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey='count'
                    name={t('deliveries')}
                    fill='#3B82F6'
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deliverer Performance Table */}
      <Card>
        <CardContent className='p-6'>
          <h3 className='mb-4 text-lg font-medium'>{t('delivererPerformance')}</h3>
          <p className='mb-6 text-sm text-muted-foreground'>
            {t('topPerformers')}
          </p>

          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='p-3 text-left'>{t('name')}</th>
                  <th className='p-3 text-left'>{t('deliveries')}</th>
                  <th className='p-3 text-left'>{t('onTimeRate')}</th>
                  <th className='p-3 text-left'>{t('avgTime')}</th>
                  <th className='p-3 text-left'>{t('rating')}</th>
                </tr>
              </thead>
              <tbody>
                {delivererPerformance.map((deliverer, index) => (
                  <tr
                    key={deliverer.id || index}
                    className='border-b hover:bg-muted/50'
                  >
                    <td className='p-3'>{deliverer.name}</td>
                    <td className='p-3'>{deliverer.deliveries}</td>
                    <td className='p-3'>
                      <Badge
                        variant={
                          deliverer.onTimeRate > 90
                            ? 'success'
                            : deliverer.onTimeRate > 75
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {deliverer.onTimeRate}%
                      </Badge>
                    </td>
                    <td className='p-3'>{deliverer.avgTime} {t('minutes')}</td>
                    <td className='p-3'>
                      <div className='flex items-center'>
                        <span className='mr-2'>{deliverer.rating}</span>
                        <div className='flex'>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.round(deliverer.rating)
                                  ? 'text-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
