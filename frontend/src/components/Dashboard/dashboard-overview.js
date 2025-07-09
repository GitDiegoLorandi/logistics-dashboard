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
  Legend,
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
  HelpCircle,
} from 'lucide-react';
import { statisticsAPI, deliveryAPI, jobsAPI } from '../../services/api';
import LoadingSpinner from '../UI/loading-spinner';
import ErrorMessage from '../UI/error-message';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Grid, GridItem } from '../UI/grid';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { Button } from '../UI/button';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import ResponsiveChartCard from '../UI/data-visualization/charts/responsive-chart-card';
import DashboardTour from './dashboard-tour';

const DashboardOverview = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [trends, setTrends] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [jobStatus, setJobStatus] = useState({});
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Check if this is the first visit to show the tour
    const tourCompleted = localStorage.getItem('dashboard-tour-completed') === 'true';
    if (!tourCompleted) {
      setShowTour(true);
    }
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
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTourFinish = () => {
    localStorage.setItem('dashboard-tour-completed', 'true');
    setShowTour(false);
  };

  const handleTourSkip = () => {
    localStorage.setItem('dashboard-tour-completed', 'true');
    setShowTour(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

  const statusCards = [
    {
      title: t('dashboard.deliveriesTotal'),
      value: stats.totalDeliveries || 0,
      icon: Package,
      color: 'blue',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: t('deliverers.title'),
      value: stats.activeDeliverers || 0,
      icon: Truck,
      color: 'green',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: t('dashboard.deliveriesCompleted'),
      value: `${stats.deliveryRate || 0}%`,
      icon: TrendingUp,
      color: 'purple',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      title: t('users.title'),
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'orange',
      trend: '+8%',
      trendUp: true,
    },
  ];

  const deliveryStatusData = [
    {
      name: t('deliveries.statuses.delivered'),
      value: stats.deliveryBreakdown?.delivered || 0,
      color: '#10b981',
    },
    {
      name: t('deliveries.statuses.inTransit'),
      value: stats.deliveryBreakdown?.inTransit || 0,
      color: '#3b82f6',
    },
    {
      name: t('deliveries.statuses.pending'),
      value: stats.deliveryBreakdown?.pending || 0,
      color: '#f59e0b',
    },
    {
      name: t('deliveries.statuses.cancelled'),
      value: stats.deliveryBreakdown?.cancelled || 0,
      color: '#ef4444',
    },
  ];

  const getStatusIcon = status => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle size={16} className='text-status-delivered' />;
      case 'In Transit':
        return <Clock size={16} className='text-status-in-transit' />;
      case 'Pending':
        return <AlertCircle size={16} className='text-status-pending' />;
      case 'Cancelled':
        return <XCircle size={16} className='text-status-cancelled' />;
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
      {/* Tour */}
      <DashboardTour run={showTour} onFinish={handleTourFinish} onSkip={handleTourSkip} />
      
      {/* Header */}
      <div className='flex justify-between items-center mb-6 dashboard-header'>
        <div>
          <h1 className='text-2xl font-bold'>{t('dashboard.title')}</h1>
          <p className='text-muted-foreground'>{t('dashboard.summary')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowTour(true)}>
          <HelpCircle className="mr-2 h-4 w-4" />
          {t('common.help')}
        </Button>
      </div>
      
      {/* Statistics Cards */}
      <Grid className='gap-6 mb-8 dashboard-stats'>
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

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 dashboard-chart'>
        {/* Delivery Trends Chart */}
        <ResponsiveChartCard
          title={t('dashboard.deliveryTrends')}
          description={t('dashboard.lastSevenDays')}
          chart={
            <LineChart data={formatTrendsData(trends)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={t('dashboard.total')}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={t('deliveries.statuses.delivered')}
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={t('deliveries.statuses.pending')}
              />
            </LineChart>
          }
        />

        {/* Delivery Status Chart */}
        <ResponsiveChartCard
          title={t('dashboard.deliveryStatus')}
          description={t('dashboard.currentStatus')}
          chart={
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {deliveryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          }
        />
      </div>

      {/* Recent Deliveries */}
      <div className='mb-6 dashboard-recent'>
        <Card>
          <CardContent className='p-0'>
            <div className='p-6 border-b'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-medium'>{t('dashboard.recentDeliveries')}</h3>
                <Button variant='ghost' size='sm'>
                  {t('dashboard.viewAll')}
                </Button>
              </div>
            </div>
            <div className='overflow-x-auto'>
              <Table>
                <THead>
                  <TR>
                    <TH>{t('deliveries.deliveryID')}</TH>
                    <TH>{t('deliveries.customer')}</TH>
                    <TH>{t('deliveries.destination')}</TH>
                    <TH>{t('deliveries.scheduledDate')}</TH>
                    <TH>{t('deliveries.status')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {recentDeliveries.map(delivery => (
                    <TR key={delivery._id}>
                      <TD>{delivery._id.substring(0, 8)}</TD>
                      <TD>{delivery.customer?.name || 'N/A'}</TD>
                      <TD className='max-w-[200px] truncate'>
                        {delivery.destination?.address || 'N/A'}
                      </TD>
                      <TD>
                        {new Date(delivery.scheduledDate).toLocaleDateString()}
                      </TD>
                      <TD>
                        <div className='flex items-center'>
                          {getStatusIcon(delivery.status)}
                          <span className='ml-2'>{delivery.status}</span>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
