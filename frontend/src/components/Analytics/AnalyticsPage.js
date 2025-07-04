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
import './AnalyticsPage.css';

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
      <div className='analytics-page'>
        <div className='analytics-loading'>
          <div className='loading-spinner'></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='analytics-page'>
      <div className='analytics-header'>
        <div className='analytics-title'>
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive delivery and performance analytics</p>
        </div>
        <div className='analytics-actions'>
          <button
            onClick={handleRefresh}
            className='refresh-btn'
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className='export-btn'>
            <Download />
            Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='kpi-grid'>
        <div className='kpi-card'>
          <div className='kpi-icon delivered'>
            <Package />
          </div>
          <div className='kpi-content'>
            <h3>{overallStats.totalDeliveries || 0}</h3>
            <p>Total Deliveries</p>
            <span className='kpi-change positive'>
              +{overallStats.deliveryBreakdown?.delivered || 0} delivered
            </span>
          </div>
        </div>

        <div className='kpi-card'>
          <div className='kpi-icon success'>
            <CheckCircle />
          </div>
          <div className='kpi-content'>
            <h3>{overallStats.deliveryRate || 0}%</h3>
            <p>Delivery Success Rate</p>
            <span className='kpi-change positive'>
              {overallStats.deliveryBreakdown?.delivered || 0} successful
            </span>
          </div>
        </div>

        <div className='kpi-card'>
          <div className='kpi-icon active'>
            <Users />
          </div>
          <div className='kpi-content'>
            <h3>{overallStats.activeDeliverers || 0}</h3>
            <p>Active Deliverers</p>
            <span className='kpi-change'>
              of {overallStats.totalDeliverers || 0} total
            </span>
          </div>
        </div>

        <div className='kpi-card'>
          <div className='kpi-icon pending'>
            <Clock />
          </div>
          <div className='kpi-content'>
            <h3>{overallStats.deliveryBreakdown?.pending || 0}</h3>
            <p>Pending Deliveries</p>
            <span className='kpi-change'>
              {overallStats.deliveryBreakdown?.inTransit || 0} in transit
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className='charts-grid'>
        {/* Delivery Status Distribution */}
        <div className='chart-card'>
          <div className='chart-header'>
            <h3>Delivery Status Distribution</h3>
            <p>Current breakdown of all deliveries</p>
          </div>
          <div className='chart-content'>
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
        </div>

        {/* Delivery Trends */}
        <div className='chart-card chart-card-large'>
          <div className='chart-header'>
            <h3>Delivery Trends</h3>
            <p>{deliveryTrends.period}</p>
          </div>
          <div className='chart-content'>
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
        </div>

        {/* Priority Statistics */}
        <div className='chart-card'>
          <div className='chart-header'>
            <h3>Priority Statistics</h3>
            <p>Delivery completion by priority</p>
          </div>
          <div className='chart-content'>
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
        </div>

        {/* Date Range Filter */}
        <div className='chart-card'>
          <div className='chart-header'>
            <h3>Custom Date Range</h3>
            <p>Filter deliveries by date range</p>
          </div>
          <div className='chart-content'>
            <div className='date-range-form'>
              <div className='form-group'>
                <label>Start Date:</label>
                <input
                  type='date'
                  value={dateRange.startDate}
                  onChange={e =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>
              <div className='form-group'>
                <label>End Date:</label>
                <input
                  type='date'
                  value={dateRange.endDate}
                  onChange={e =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
              <div className='form-group'>
                <label>Group by:</label>
                <select
                  value={dateRange.groupBy}
                  onChange={e =>
                    setDateRange({ ...dateRange, groupBy: e.target.value })
                  }
                >
                  <option value='day'>Day</option>
                  <option value='week'>Week</option>
                  <option value='month'>Month</option>
                </select>
              </div>
              <button onClick={fetchDateRangeData} className='filter-btn'>
                <Filter />
                Apply Filter
              </button>
            </div>

            {dateRangeStats.data && (
              <div className='date-range-results'>
                <h4>
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
        </div>
      </div>

      {/* Deliverer Performance Table */}
      <div className='performance-section'>
        <div className='section-header'>
          <h3>Deliverer Performance</h3>
          <p>Top performing deliverers ranked by total deliveries</p>
        </div>
        <div className='performance-table-container'>
          <table className='performance-table'>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Deliverer</th>
                <th>Total Deliveries</th>
                <th>Success Rate</th>
                <th>Delivered</th>
                <th>Pending</th>
                <th>In Transit</th>
                <th>Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {delivererPerformance.slice(0, 10).map((deliverer, index) => (
                <tr key={deliverer.delivererId}>
                  <td>
                    <span
                      className={`rank rank-${index < 3 ? index + 1 : 'other'}`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td>
                    <div className='deliverer-info'>
                      <strong>{deliverer.delivererName}</strong>
                      <span>{deliverer.delivererEmail}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{deliverer.totalDeliveries}</strong>
                  </td>
                  <td>
                    <span
                      className={`success-rate ${deliverer.successRate >= 90 ? 'excellent' : deliverer.successRate >= 70 ? 'good' : 'needs-improvement'}`}
                    >
                      {deliverer.successRate}%
                    </span>
                  </td>
                  <td>
                    <span className='status-badge delivered'>
                      {deliverer.delivered}
                    </span>
                  </td>
                  <td>
                    <span className='status-badge pending'>
                      {deliverer.pending}
                    </span>
                  </td>
                  <td>
                    <span className='status-badge in-transit'>
                      {deliverer.inTransit}
                    </span>
                  </td>
                  <td>
                    <span className='status-badge cancelled'>
                      {deliverer.cancelled}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
