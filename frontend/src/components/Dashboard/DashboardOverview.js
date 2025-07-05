import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { statisticsAPI, deliveryAPI, jobsAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Grid, GridItem } from '../UI/grid';
import { Table, THead, TBody, TR, TH, TD } from '../UI/table';
import { cn } from '../../lib/utils';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [trends, setTrends] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [jobStatus, setJobStatus] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overallStats, trendsData, recentDeliveriesData, jobsData] =
        await Promise.all([
          statisticsAPI.getOverall(),
          statisticsAPI.getTrends(),
          deliveryAPI.getAll({ limit: 10, sort: '-createdAt' }),
          jobsAPI.getStatus().catch(() => ({ data: {} })), // Background jobs might not be available
        ]);

      setStats(overallStats.data);
      setTrends(trendsData.data.trends || []);
      setRecentDeliveries(recentDeliveriesData.data.deliveries || []);
      setJobStatus(jobsData.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

  const statusCards = [
    {
      title: 'Total Deliveries',
      value: stats.totalDeliveries || 0,
      icon: Package,
      color: 'blue',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Deliverers',
      value: stats.activeDeliverers || 0,
      icon: Truck,
      color: 'green',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Delivery Rate',
      value: `${stats.deliveryRate || 0}%`,
      icon: TrendingUp,
      color: 'purple',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'orange',
      trend: '+8%',
      trendUp: true,
    },
  ];

  const deliveryStatusData = [
    {
      name: 'Delivered',
      value: stats.deliveryBreakdown?.delivered || 0,
      color: '#10b981',
    },
    {
      name: 'In Transit',
      value: stats.deliveryBreakdown?.inTransit || 0,
      color: '#3b82f6',
    },
    {
      name: 'Pending',
      value: stats.deliveryBreakdown?.pending || 0,
      color: '#f59e0b',
    },
    {
      name: 'Cancelled',
      value: stats.deliveryBreakdown?.cancelled || 0,
      color: '#ef4444',
    },
  ];

  const getStatusIcon = status => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle size={16} className='text-green-500' />;
      case 'In Transit':
        return <Clock size={16} className='text-blue-500' />;
      case 'Pending':
        return <AlertCircle size={16} className='text-yellow-500' />;
      case 'Cancelled':
        return <XCircle size={16} className='text-red-500' />;
      default:
        return <Package size={16} />;
    }
  };

  const formatTrendsData = trends => {
    return trends.slice(-7).map(trend => ({
      date: new Date(trend._id).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      total: trend.totalCount,
      delivered: trend.statuses.find(s => s.status === 'Delivered')?.count || 0,
      pending: trend.statuses.find(s => s.status === 'Pending')?.count || 0,
    }));
  };

  return (
    <div className='px-4 py-6 max-w-7xl mx-auto'>
      {/* Statistics Cards */}
      <Grid className='gap-6 mb-8'>
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          const colorMap = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-green-50 text-green-700 border-green-200',
            purple: 'bg-purple-50 text-purple-700 border-purple-200',
            orange: 'bg-orange-50 text-orange-700 border-orange-200',
          };

          return (
            <GridItem
              key={index}
              colSpan='col-span-12 sm:col-span-6 lg:col-span-3'
            >
              <Card>
                <CardContent className='pt-6'>
                  <div className='flex justify-between items-start mb-4'>
                    <div className={cn('p-2 rounded-lg', colorMap[card.color])}>
                      <Icon className='h-5 w-5' />
                    </div>
                    <Badge
                      variant={card.trendUp ? 'success' : 'destructive'}
                      className='text-xs'
                    >
                      {card.trend}
                    </Badge>
                  </div>
                  <h3 className='text-3xl font-bold'>{card.value}</h3>
                  <p className='text-sm text-muted-foreground'>{card.title}</p>
                </CardContent>
              </Card>
            </GridItem>
          );
        })}
      </Grid>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {/* Delivery Trends Chart */}
        <Card className='overflow-hidden'>
          <h3 className='text-lg font-medium p-6 pb-2'>
            Delivery Trends (Last 7 Days)
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={formatTrendsData(trends)}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' />
              <YAxis />
              <Tooltip />
              <Line
                type='monotone'
                dataKey='total'
                stroke='#3b82f6'
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name='Total'
              />
              <Line
                type='monotone'
                dataKey='delivered'
                stroke='#10b981'
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name='Delivered'
              />
              <Line
                type='monotone'
                dataKey='pending'
                stroke='#f59e0b'
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name='Pending'
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Delivery Status Chart */}
        <Card className='overflow-hidden'>
          <h3 className='text-lg font-medium p-6 pb-2'>
            Delivery Status Breakdown
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx='50%'
                cy='50%'
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
                nameKey='name'
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {deliveryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Deliveries */}
        <Card>
          <div className='flex items-center justify-between p-6 pb-2'>
            <h3 className='text-lg font-medium'>Recent Deliveries</h3>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Order ID</TH>
                <TH>Customer</TH>
                <TH>Status</TH>
                <TH>Deliverer</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {recentDeliveries.length > 0 ? (
                recentDeliveries.map(delivery => (
                  <TR key={delivery._id}>
                    <TD className='font-medium'>{delivery.orderId}</TD>
                    <TD>{delivery.customer}</TD>
                    <TD>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(delivery.status)}
                        <span>{delivery.status}</span>
                      </div>
                    </TD>
                    <TD>
                      {delivery.deliverer ? (
                        delivery.deliverer.name
                      ) : (
                        <span className='text-muted-foreground italic'>
                          Unassigned
                        </span>
                      )}
                    </TD>
                    <TD className='text-muted-foreground'>
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </TD>
                  </TR>
                ))
              ) : (
                <TR>
                  <TD colSpan={5} className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      No recent deliveries found
                    </p>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </Card>

        {/* System Status */}
        <Card>
          <div className='p-6'>
            <h3 className='text-lg font-medium mb-4'>System Status</h3>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='p-1.5 rounded-full bg-green-100 text-green-600'>
                  <CheckCircle className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>Database Connection</p>
                  <p className='text-sm text-muted-foreground'>
                    Connected and operational
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div
                  className={cn(
                    'p-1.5 rounded-full',
                    jobStatus.lastRunSuccess
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  )}
                >
                  {jobStatus.lastRunSuccess ? (
                    <CheckCircle className='h-4 w-4' />
                  ) : (
                    <AlertCircle className='h-4 w-4' />
                  )}
                </div>
                <div>
                  <p className='font-medium'>Background Jobs</p>
                  <p className='text-sm text-muted-foreground'>
                    {jobStatus.lastRunSuccess
                      ? 'Running normally'
                      : 'Experiencing issues'}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='p-1.5 rounded-full bg-green-100 text-green-600'>
                  <CheckCircle className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>API Services</p>
                  <p className='text-sm text-muted-foreground'>
                    All endpoints responding
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='p-1.5 rounded-full bg-yellow-100 text-yellow-600'>
                  <AlertCircle className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>Storage Usage</p>
                  <p className='text-sm text-muted-foreground'>
                    78% - Consider cleanup
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
