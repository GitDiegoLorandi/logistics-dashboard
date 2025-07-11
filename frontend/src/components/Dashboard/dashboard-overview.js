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
  Truck
} from 'lucide-react';
import { statisticsAPI } from '../../services/api';
import ResponsiveChartCard from '../UI/data-visualization/charts/responsive-chart-card';
import ErrorMessage from '../UI/error-message';

/**
 * Dashboard overview component
 */
const DashboardOverview = () => {
  const { t } = useTranslation(['dashboard', 'common', 'navigation']);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback data for development/demo purposes
  const fallbackData = {
    deliveries: {
      total: 1248,
      pending: 124,
      inTransit: 56,
      completed: 1068,
      failed: 24,
      byStatus: [
        { name: 'Pending', value: 124 },
        { name: 'In Transit', value: 56 },
        { name: 'Completed', value: 1068 },
        { name: 'Failed', value: 24 }
      ],
      byPriority: [
        { name: 'Low', value: 456 },
        { name: 'Medium', value: 524 },
        { name: 'High', value: 198 },
        { name: 'Urgent', value: 70 }
      ],
      trends: [
        { date: '2025-07-01', completed: 42, pending: 18 },
        { date: '2025-07-02', completed: 38, pending: 15 },
        { date: '2025-07-03', completed: 45, pending: 12 },
        { date: '2025-07-04', completed: 40, pending: 10 },
        { date: '2025-07-05', completed: 35, pending: 14 },
        { date: '2025-07-06', completed: 48, pending: 16 },
        { date: '2025-07-07', completed: 52, pending: 19 }
      ]
    },
    deliverers: {
      total: 48,
      active: 32,
      inactive: 16,
      onDelivery: 24
    },
    users: {
      total: 156,
      admins: 4,
      managers: 12,
      operators: 140
    },
    performance: {
      onTimeDeliveryRate: 94.2,
      averageDeliveryTime: 28.5,
      customerSatisfaction: 4.7
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch statistics from API
        const data = await statisticsAPI.getOverall();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        // Use fallback data on error
        setStats(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Use fallback data if API call fails or during development
  const data = stats || fallbackData;

  // Handle retry on error
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Retry fetching data
    statisticsAPI.getOverall()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load dashboard data');
        // Use fallback data on error
        setStats(fallbackData);
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Ensure we have the expected data structure
  const deliveries = data?.deliveries || fallbackData.deliveries;
  const deliverers = data?.deliverers || fallbackData.deliverers;
  const users = data?.users || fallbackData.users;
  const performance = data?.performance || fallbackData.performance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('summary')}</p>
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
        <ResponsiveChartCard
          title={t('deliveryTrends')}
          subtitle={t('chartLabels.dailyDeliveryTrends')}
        >
          {/* Chart would go here - using placeholder for now */}
          <div className="flex items-center justify-center h-full bg-muted/20 rounded-md">
            <div className="text-center p-4">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('chartLabels.completedVsPending')}</p>
            </div>
          </div>
        </ResponsiveChartCard>
        <ResponsiveChartCard
          title={t('deliveryStatus')}
          subtitle={t('chartLabels.statusDistribution')}
        >
          {/* Chart would go here - using placeholder for now */}
          <div className="flex items-center justify-center h-full bg-muted/20 rounded-md">
            <div className="text-center p-4">
              <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('chartLabels.statusBreakdown')}</p>
            </div>
          </div>
        </ResponsiveChartCard>
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
          value={users.total}
          subvalue={`${users.admins} ${t('users.admin', { ns: 'common' })}, ${users.managers} ${t('users.manager', { ns: 'common' })}`}
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
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        {subvalue && <p className="text-xs text-muted-foreground mt-1">{subvalue}</p>}
      </div>
      <div className={`rounded-full p-2 ${iconClassName}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default DashboardOverview;
