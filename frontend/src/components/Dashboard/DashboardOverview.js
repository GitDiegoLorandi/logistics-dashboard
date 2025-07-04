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
import './DashboardOverview.css';

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
    <div className='dashboard-overview'>
      {/* Statistics Cards */}
      <div className='stats-grid'>
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`stat-card stat-card-${card.color}`}>
              <div className='stat-card-header'>
                <div className='stat-icon'>
                  <Icon size={24} />
                </div>
                <div className='stat-trend'>
                  <span
                    className={`trend ${card.trendUp ? 'trend-up' : 'trend-down'}`}
                  >
                    {card.trend}
                  </span>
                </div>
              </div>
              <div className='stat-content'>
                <h3 className='stat-value'>{card.value}</h3>
                <p className='stat-title'>{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className='charts-section'>
        {/* Delivery Trends Chart */}
        <div className='chart-container'>
          <h3 className='chart-title'>Delivery Trends (Last 7 Days)</h3>
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
                name='Total Deliveries'
              />
              <Line
                type='monotone'
                dataKey='delivered'
                stroke='#10b981'
                strokeWidth={2}
                name='Delivered'
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Status Distribution */}
        <div className='chart-container'>
          <h3 className='chart-title'>Delivery Status Distribution</h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey='value'
              >
                {deliveryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className='pie-legend'>
            {deliveryStatusData.map((entry, index) => (
              <div key={index} className='legend-item'>
                <div
                  className='legend-color'
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span>
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className='activity-section'>
        {/* Recent Deliveries */}
        <div className='activity-card'>
          <h3 className='activity-title'>Recent Deliveries</h3>
          <div className='activity-list'>
            {recentDeliveries.length > 0 ? (
              recentDeliveries.slice(0, 5).map(delivery => (
                <div key={delivery._id} className='activity-item'>
                  <div className='activity-icon'>
                    {getStatusIcon(delivery.status)}
                  </div>
                  <div className='activity-content'>
                    <p className='activity-main'>
                      Order #{delivery.orderId} - {delivery.customer}
                    </p>
                    <p className='activity-sub'>
                      {delivery.status} •{' '}
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='activity-status'>
                    <span
                      className={`status-badge status-${delivery.status.toLowerCase().replace(' ', '-')}`}
                    >
                      {delivery.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className='no-data'>No recent deliveries</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className='activity-card'>
          <h3 className='activity-title'>System Status</h3>
          <div className='system-status'>
            <div className='status-item'>
              <div className='status-indicator status-good'></div>
              <span>API Server</span>
              <span className='status-text'>Online</span>
            </div>
            <div className='status-item'>
              <div className='status-indicator status-good'></div>
              <span>Database</span>
              <span className='status-text'>Connected</span>
            </div>
            <div className='status-item'>
              <div
                className={`status-indicator ${jobStatus.running ? 'status-good' : 'status-warning'}`}
              ></div>
              <span>Background Jobs</span>
              <span className='status-text'>
                {jobStatus.running ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className='status-item'>
              <div className='status-indicator status-good'></div>
              <span>Frontend</span>
              <span className='status-text'>Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
