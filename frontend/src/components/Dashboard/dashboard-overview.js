import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Truck,
  RefreshCw
} from 'lucide-react';
import { deliveryAPI, userAPI, delivererAPI } from '../../services/api';
import ResponsiveChartCard from '../ui/data-visualization/charts/responsive-chart-card';
import { LineChart, PieChart } from '../ui/data-visualization/charts';
import { Button } from '../ui/button';

/**
 * Dashboard overview component
 */
const DashboardOverview = () => {
  const { t } = useTranslation(['dashboard', 'common', 'navigation']);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard data from APIs...');
      
      // Fetch data from multiple APIs
      const [deliveriesData, deliverersData, usersData] = await Promise.all([
        deliveryAPI.getAll(),
        delivererAPI.getAll(),
        userAPI.getProfile().catch(() => null)
      ]);

      // Process deliveries data
      const deliveriesArray = deliveriesData?.docs || [];
      const delivered = deliveriesArray.filter(d => d.status === 'Delivered').length;
      const pending = deliveriesArray.filter(d => d.status === 'Pending').length;
      const inTransit = deliveriesArray.filter(d => d.status === 'In Transit').length;
      const cancelled = deliveriesArray.filter(d => d.status === 'Cancelled').length;
      
      // Create status breakdown for pie chart
      const byStatus = [
        { name: 'Delivered', value: delivered },
        { name: 'Pending', value: pending },
        { name: 'In Transit', value: inTransit },
        { name: 'Cancelled', value: cancelled }
      ].filter(item => item.value > 0);

      // Create trends data - last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Group by date to create trend data
      const trendData = [];
      const dateMap = new Map();
      
      deliveriesArray.forEach(delivery => {
        const date = new Date(delivery.createdAt || delivery.created_at || Date.now()).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, completed: 0, pending: 0 });
        }
        
        if (delivery.status === 'Delivered') {
          dateMap.get(date).completed += 1;
        } else if (delivery.status === 'Pending' || delivery.status === 'In Transit') {
          dateMap.get(date).pending += 1;
        }
      });
      
      // Convert to array and sort by date
      const trendsArray = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7); // Only take the last 7 days

      // Calculate on-time delivery rate
      const totalDelivered = delivered;
      const onTimeDeliveries = deliveriesArray.filter(
        d => d.status === 'Delivered' && new Date(d.deliveredAt || d.delivered_at) <= new Date(d.expectedDeliveryDate || d.expected_delivery_date)
      ).length;
      const onTimeRate = totalDelivered > 0 ? Math.round((onTimeDeliveries / totalDelivered) * 100) : 0;

      // Process user data
      const userInfo = usersData || { role: 'unknown' };
      
      // Create dashboard data structure
      const dashboardData = {
        deliveries: {
          total: deliveriesArray.length,
          pending: pending,
          inTransit: inTransit,
          completed: delivered,
          failed: cancelled,
          byStatus: byStatus,
          trends: trendsArray.length > 0 ? trendsArray : [
            { date: new Date().toISOString().split('T')[0], completed: 0, pending: 0 }
          ]
        },
        deliverers: {
          total: Array.isArray(deliverersData) ? deliverersData.length : 0,
          active: Array.isArray(deliverersData) ? deliverersData.filter(d => d.status === 'active' || d.status === 'Active').length : 0,
          inactive: Array.isArray(deliverersData) ? deliverersData.filter(d => d.status !== 'active' && d.status !== 'Active').length : 0,
          onDelivery: Array.isArray(deliverersData) ? deliverersData.filter(d => d.currentDelivery || d.current_delivery).length : 0
        },
        users: {
          total: userInfo ? 1 : 0,
          admins: userInfo.role === 'admin' ? 1 : 0,
          managers: userInfo.role === 'manager' ? 1 : 0,
          operators: userInfo.role === 'user' ? 1 : 0
        },
        performance: {
          onTimeDeliveryRate: onTimeRate,
          averageDeliveryTime: 0, // Not calculated yet
          customerSatisfaction: 0 // Not available yet
        }
      };
      
      console.log('Dashboard data processed:', dashboardData);
      setStats(dashboardData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle retry on error
  const handleRetry = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h3 className="text-xl font-bold">{t('dataLoadingError')}</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={handleRetry} className="mt-4 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('common:retry')}
        </Button>
      </div>
    );
  }

  // If we reach this point, stats should be available
  // But we'll add a safety check just in case
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="text-xl font-bold">{t('noDataAvailable')}</h3>
        <Button onClick={handleRetry} className="mt-4 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('common:retry')}
        </Button>
      </div>
    );
  }

  const { deliveries, deliverers, users, performance } = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('summary')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common:refresh')}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('deliveriesTotal')}
          value={deliveries.total}
          icon={<Package className="h-5 w-5" />}
          className="bg-blue-50 dark:bg-blue-950"
          iconClassName="text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          title={t('deliveriesPending')}
          value={deliveries.pending}
          icon={<Clock className="h-5 w-5" />}
          className="bg-amber-50 dark:bg-amber-950"
          iconClassName="text-amber-600 dark:text-amber-400"
        />
        <StatCard 
          title={t('deliveriesCompleted')}
          value={deliveries.completed}
          icon={<CheckCircle className="h-5 w-5" />}
          className="bg-green-50 dark:bg-green-950"
          iconClassName="text-green-600 dark:text-green-400"
        />
        <StatCard 
          title={t('deliveriesFailed')}
          value={deliveries.failed}
          icon={<AlertTriangle className="h-5 w-5" />}
          className="bg-red-50 dark:bg-red-950"
          iconClassName="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {deliveries.trends && deliveries.trends.length > 0 ? (
          <ResponsiveChartCard
            title={t('deliveryTrends')}
            subtitle={t('chartLabels.dailyDeliveryTrends')}
          >
            <LineChart 
              data={deliveries.trends}
              lines={[
                { dataKey: 'completed', name: t('chartLabels.completed') },
                { dataKey: 'pending', name: t('chartLabels.pending') }
              ]}
              xAxisDataKey="date"
            />
          </ResponsiveChartCard>
        ) : (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-medium">{t('deliveryTrends')}</h3>
            <p className="text-muted-foreground">{t('noTrendDataAvailable')}</p>
          </div>
        )}

        {deliveries.byStatus && deliveries.byStatus.length > 0 ? (
          <ResponsiveChartCard
            title={t('deliveryStatus')}
            subtitle={t('chartLabels.statusDistribution')}
          >
            <PieChart 
              data={deliveries.byStatus}
              dataKey="value"
              nameKey="name"
              donut={true}
            />
          </ResponsiveChartCard>
        ) : (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-medium">{t('deliveryStatus')}</h3>
            <p className="text-muted-foreground">{t('noStatusDataAvailable')}</p>
          </div>
        )}
      </div>

      {/* Additional stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          title={t('deliverers.title', { ns: 'navigation' })}
          value={deliverers.total}
          subvalue={`${deliverers.active} ${t('statuses.active', { ns: 'deliverers' })}`}
          icon={<Truck className="h-5 w-5" />}
          className="bg-purple-50 dark:bg-purple-950"
          iconClassName="text-purple-600 dark:text-purple-400"
        />
        <StatCard 
          title={t('users', { ns: 'navigation' })}
          value={users.total > 0 ? users.total : t('noDataAvailableShort')}
          subvalue={users.total > 0 
            ? `${users.admins} ${t('users.admin', { ns: 'common' })}, ${users.managers} ${t('users.manager', { ns: 'common' })}`
            : t('userDataNotAvailable')
          }
          icon={<Users className="h-5 w-5" />}
          className="bg-indigo-50 dark:bg-indigo-950"
          iconClassName="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard 
          title={t('performance')}
          value={`${performance.onTimeDeliveryRate}%`}
          subvalue={t('onTime')}
          icon={<TrendingUp className="h-5 w-5" />}
          className="bg-emerald-50 dark:bg-emerald-950"
          iconClassName="text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </div>
  );
};

// Stat card component
const StatCard = ({ title, value, subvalue, icon, className = '', iconClassName = '' }) => (
  <div className={`rounded-lg border p-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="mt-1 text-2xl font-bold">{value}</h3>
        {subvalue && <p className="mt-1 text-xs text-muted-foreground">{subvalue}</p>}
      </div>
      <div className={`rounded-full p-2 ${iconClassName}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default DashboardOverview;
