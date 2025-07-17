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
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { deliveryAPI, userAPI, delivererAPI } from '../../services/api';
import ResponsiveChartCard from '../ui/data-visualization/charts/responsive-chart-card';
import { LineChart, PieChart } from '../ui/data-visualization/charts';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';

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
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent shadow-lg"></div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold">{t('dataLoadingError')}</h3>
        <p className="text-[var(--text-secondary)]">{error}</p>
        <Button 
          onClick={handleRetry} 
          className="mt-4 flex items-center gap-2"
          variant="accent"
          gradient={true}
        >
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
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-bold">{t('noDataAvailable')}</h3>
        <Button 
          onClick={handleRetry} 
          className="mt-4 flex items-center gap-2"
          variant="accent"
          gradient={true}
        >
          <RefreshCw className="h-4 w-4" />
          {t('common:retry')}
        </Button>
      </div>
    );
  }

  const { deliveries, deliverers, users, performance } = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] p-4 rounded-lg text-white shadow-[var(--shadow-md)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="opacity-90">{t('summary')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/40 hover:bg-white/30 text-white"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common:refresh')}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedStatCard 
          title={t('deliveriesTotal')}
          value={deliveries.total}
          icon={<Package className="h-5 w-5" />}
          delay={0}
          gradient="from-blue-500 to-blue-700"
          textColor="text-white"
        />
        <AnimatedStatCard 
          title={t('deliveriesPending')}
          value={deliveries.pending}
          icon={<Clock className="h-5 w-5" />}
          delay={0.1}
          gradient="from-amber-500 to-amber-700"
          textColor="text-white"
        />
        <AnimatedStatCard 
          title={t('deliveriesCompleted')}
          value={deliveries.completed}
          icon={<CheckCircle className="h-5 w-5" />}
          delay={0.2}
          gradient="from-green-500 to-green-700"
          textColor="text-white"
        />
        <AnimatedStatCard 
          title={t('deliveriesFailed')}
          value={deliveries.failed}
          icon={<AlertTriangle className="h-5 w-5" />}
          delay={0.3}
          gradient="from-red-500 to-red-700"
          textColor="text-white"
        />
      </div>

      {/* Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <PerformanceCard
          title={t('onTimeRate')}
          value={`${performance.onTimeDeliveryRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={performance.onTimeDeliveryRate > 80 ? 'up' : 'down'}
          trendValue="+5%"
          gradient="from-purple-500 to-indigo-600"
        />
        <PerformanceCard
          title={t('activeDeliverers')}
          value={`${deliverers.active}/${deliverers.total}`}
          icon={<Truck className="h-5 w-5" />}
          trend="up"
          trendValue="+2"
          gradient="from-cyan-500 to-blue-600"
        />
        <PerformanceCard
          title={t('userActivity')}
          value={users.total}
          icon={<Users className="h-5 w-5" />}
          trend="up"
          trendValue="+3"
          gradient="from-emerald-500 to-teal-600"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {deliveries.trends && deliveries.trends.length > 0 ? (
          <Card variant="default" className="shadow-[var(--shadow-lg)]" animate={true}>
            <CardHeader title={t('deliveryTrends')} subtitle={t('chartLabels.dailyDeliveryTrends')} gradient={true} />
            <CardContent>
              <LineChart 
                data={deliveries.trends}
                lines={[
                  { dataKey: 'completed', name: t('chartLabels.completed'), color: 'var(--color-success)' },
                  { dataKey: 'pending', name: t('chartLabels.pending'), color: 'var(--color-warning)' }
                ]}
                xAxisDataKey="date"
                grid={true}
                animated={true}
              />
            </CardContent>
          </Card>
        ) : (
          <Card variant="default" className="shadow-[var(--shadow-lg)]">
            <CardHeader title={t('deliveryTrends')} />
            <CardContent className="flex items-center justify-center p-12">
              <p className="text-[var(--text-secondary)]">{t('noChartData')}</p>
            </CardContent>
          </Card>
        )}

        {deliveries.byStatus && deliveries.byStatus.length > 0 ? (
          <Card variant="default" className="shadow-[var(--shadow-lg)]" animate={true}>
            <CardHeader title={t('deliveryStatus')} subtitle={t('chartLabels.deliveryStatusBreakdown')} gradient={true} />
            <CardContent>
              <PieChart 
                data={deliveries.byStatus}
                nameKey="name"
                dataKey="value"
                colors={['var(--color-success)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-error)']}
                animated={true}
              />
            </CardContent>
          </Card>
        ) : (
          <Card variant="default" className="shadow-[var(--shadow-lg)]">
            <CardHeader title={t('deliveryStatus')} />
            <CardContent className="flex items-center justify-center p-12">
              <p className="text-[var(--text-secondary)]">{t('noChartData')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Animated stat card component with motion effects
const AnimatedStatCard = ({ title, value, icon, delay = 0, gradient, textColor = 'text-white' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`rounded-lg bg-gradient-to-br ${gradient} p-6 shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] transition-all duration-300 hover:-translate-y-1 ${textColor}`}
  >
    <div className="flex items-center justify-between">
      <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
        {icon}
      </div>
      <span className="text-3xl font-bold">{value}</span>
    </div>
    <div className="mt-2 text-sm font-medium opacity-90">{title}</div>
  </motion.div>
);

// Performance card with trend indicator
const PerformanceCard = ({ title, value, icon, trend, trendValue, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.4 }}
    className={`rounded-lg bg-gradient-to-br ${gradient} p-6 shadow-[var(--shadow-lg)] text-white`}
  >
    <div className="flex items-center justify-between">
      <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <div className={`flex items-center ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
          {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          <span className="text-xs font-medium">{trendValue}</span>
        </div>
      </div>
    </div>
    <div className="mt-2 text-sm font-medium opacity-90">{title}</div>
  </motion.div>
);

export default DashboardOverview;
