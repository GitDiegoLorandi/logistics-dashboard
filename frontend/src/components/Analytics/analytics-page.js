import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { statisticsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Grid, GridItem } from '../UI/grid';
import { cn } from '../../lib/utils';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';

const AnalyticsPage = () => {
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
      toast.error('Please select both start and end dates');
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
      toast.error('Failed to load date range data');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
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
    toast.success('Analytics data exported');
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
          <p className='text-muted-foreground'>Loading analytics data...</p>
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
            Analytics Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Comprehensive delivery and performance analytics
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
            onClick={handleExport}
            size='sm'
            className='flex items-center gap-2'
          >
            <Download className='h-4 w-4' />
            Export Data
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
              <p className='text-sm text-muted-foreground'>Total Deliveries</p>
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
                  {overallStats.deliveryBreakdown?.delivered || 0} successful
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.deliveryRate || 0}%
              </h3>
              <p className='text-sm text-muted-foreground'>
                Delivery Success Rate
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
                  of {overallStats.totalDeliverers || 0} total
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.activeDeliverers || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>Active Deliverers</p>
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
                  {overallStats.deliveryBreakdown?.inTransit || 0} in transit
                </Badge>
              </div>
              <h3 className='text-3xl font-bold'>
                {overallStats.deliveryBreakdown?.pending || 0}
              </h3>
              <p className='text-sm text-muted-foreground'>
                Pending Deliveries
              </p>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>

      {/* Charts Grid */}
      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Delivery Status Distribution */}
        <Card className='overflow-hidden'>
          <div className='p-6 pb-2'>
            <h3 className='text-lg font-medium'>
              Delivery Status Distribution
            </h3>
            <p className='text-sm text-muted-foreground'>
              Current breakdown of all deliveries
            </p>
          </div>
          <div className='p-4'>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={prepareStatusPieData()}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {prepareStatusPieData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={statusColors[entry.name]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Delivery Trends */}
        <Card className='col-span-1 overflow-hidden lg:col-span-2'>
          <div className='p-6 pb-2'>
            <h3 className='text-lg font-medium'>Delivery Trends</h3>
            <p className='text-sm text-muted-foreground'>
              {deliveryTrends.period}
            </p>
          </div>
          <div className='p-4'>
            <ResponsiveContainer width='100%' height={300}>
              <AreaChart data={formatTrendData(deliveryTrends)}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type='monotone'
                  dataKey='Delivered'
                  stackId='1'
                  stroke={statusColors.Delivered}
                  fill={statusColors.Delivered}
                />
                <Area
                  type='monotone'
                  dataKey='In Transit'
                  stackId='1'
                  stroke={statusColors['In Transit']}
                  fill={statusColors['In Transit']}
                />
                <Area
                  type='monotone'
                  dataKey='Pending'
                  stackId='1'
                  stroke={statusColors.Pending}
                  fill={statusColors.Pending}
                />
                <Area
                  type='monotone'
                  dataKey='Cancelled'
                  stackId='1'
                  stroke={statusColors.Cancelled}
                  fill={statusColors.Cancelled}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Statistics */}
        <Card className='overflow-hidden'>
          <div className='p-6 pb-2'>
            <h3 className='text-lg font-medium'>Priority Statistics</h3>
            <p className='text-sm text-muted-foreground'>
              Delivery completion by priority
            </p>
          </div>
          <div className='p-4'>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={preparePriorityBarData()}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='priority' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='delivered' fill='#10B981' name='Delivered' />
                <Bar dataKey='pending' fill='#F59E0B' name='Pending' />
                <Bar dataKey='inTransit' fill='#3B82F6' name='In Transit' />
                <Bar dataKey='cancelled' fill='#EF4444' name='Cancelled' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Date Range Filter */}
        <Card className='overflow-hidden'>
          <div className='p-6 pb-2'>
            <h3 className='text-lg font-medium'>Custom Date Range</h3>
            <p className='text-sm text-muted-foreground'>
              Filter deliveries by date range
            </p>
          </div>
          <div className='p-6'>
            <div className='mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Start Date:</label>
                <Input
                  type='date'
                  value={dateRange.startDate}
                  onChange={e =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>End Date:</label>
                <Input
                  type='date'
                  value={dateRange.endDate}
                  onChange={e =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Group by:</label>
                <Select
                  value={dateRange.groupBy}
                  onChange={e =>
                    setDateRange({ ...dateRange, groupBy: e.target.value })
                  }
                >
                  <option value='day'>Day</option>
                  <option value='week'>Week</option>
                  <option value='month'>Month</option>
                </Select>
              </div>
              <div className='flex items-end'>
                <Button
                  onClick={fetchDateRangeData}
                  className='flex w-full items-center gap-2'
                >
                  <Filter className='h-4 w-4' />
                  Apply Filter
                </Button>
              </div>
            </div>

            {dateRangeStats.data && (
              <div className='mt-6 border-t pt-6'>
                <h4 className='mb-4 text-base font-medium'>
                  Results for {dateRangeStats.dateRange?.startDate} to{' '}
                  {dateRangeStats.dateRange?.endDate}
                </h4>
                <ResponsiveContainer width='100%' height={200}>
                  <LineChart data={dateRangeStats.data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='_id' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='count'
                      stroke='#8884d8'
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Deliverer Performance Table */}
      <Card className='mb-8'>
        <div className='p-6 pb-2'>
          <h3 className='text-lg font-medium'>Deliverer Performance</h3>
          <p className='text-sm text-muted-foreground'>
            Top performing deliverers ranked by total deliveries
          </p>
        </div>
        <Table>
          <THead>
            <TR className='bg-muted/50'>
              <TH>Rank</TH>
              <TH>Deliverer</TH>
              <TH>Total Deliveries</TH>
              <TH>Success Rate</TH>
              <TH>Delivered</TH>
              <TH>Pending</TH>
              <TH>In Transit</TH>
              <TH>Cancelled</TH>
            </TR>
          </THead>
          <TBody>
            {delivererPerformance.slice(0, 10).map((deliverer, index) => (
              <TR key={deliverer.delivererId}>
                <TD>
                  <Badge
                    variant={index < 3 ? 'default' : 'outline'}
                    className={cn(
                      'font-bold',
                      index === 0 && 'bg-yellow-500',
                      index === 1 && 'bg-slate-400',
                      index === 2 && 'bg-amber-700'
                    )}
                  >
                    #{index + 1}
                  </Badge>
                </TD>
                <TD>
                  <div className='flex flex-col'>
                    <span className='font-medium'>
                      {deliverer.delivererName}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {deliverer.delivererEmail}
                    </span>
                  </div>
                </TD>
                <TD className='font-medium'>{deliverer.totalDeliveries}</TD>
                <TD>
                  <Badge
                    variant={
                      deliverer.successRate >= 90
                        ? 'success'
                        : deliverer.successRate >= 70
                          ? 'warning'
                          : 'destructive'
                    }
                  >
                    {deliverer.successRate}%
                  </Badge>
                </TD>
                <TD>
                  <Badge variant='success'>{deliverer.delivered}</Badge>
                </TD>
                <TD>
                  <Badge variant='warning'>{deliverer.pending}</Badge>
                </TD>
                <TD>
                  <Badge variant='info'>{deliverer.inTransit}</Badge>
                </TD>
                <TD>
                  <Badge variant='destructive'>{deliverer.cancelled}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
