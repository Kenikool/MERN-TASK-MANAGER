import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  Target,
  DollarSign,
  Activity
} from 'lucide-react';

import { analyticsAPI } from '../../utils/api';

const AnalyticsDashboard = ({ projectId = null, userId = null }) => {
  const [period, setPeriod] = useState('30d');

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', 'dashboard', { period, projectId, userId }],
    queryFn: () => analyticsAPI.getDashboard({ period, projectId, userId }).then(res => res.data.data)
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="skeleton h-6 w-1/3 mb-4"></div>
              <div className="skeleton h-64 w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-base-content mb-2">Error Loading Analytics</h2>
        <p className="text-base-content/60">
          There was an error loading your analytics data. Please try again.
        </p>
      </div>
    );
  }

  const {
    taskStats,
    completionTrend,
    priorityDistribution,
    projectPerformance,
    teamPerformance,
    timeStats,
    productivityMetrics
  } = analytics;

  // Prepare chart data
  const completionTrendData = completionTrend.map(item => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: item.count
  }));

  const priorityData = priorityDistribution.map(item => ({
    name: item._id,
    value: item.count,
    color: {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    }[item._id] || '#6b7280'
  }));

  const projectData = projectPerformance.slice(0, 5).map(item => ({
    name: item.project.name,
    completionRate: Math.round(item.completionRate),
    totalTasks: item.totalTasks,
    completedTasks: item.completedTasks,
    color: item.project.color
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-lg border border-base-300">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getChangeIcon = (value) => {
    return value >= 0 ? (
      <TrendingUp className="w-4 h-4 text-success" />
    ) : (
      <TrendingDown className="w-4 h-4 text-error" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-base-content">Analytics Dashboard</h2>
        <div className="join">
          {['7d', '30d', '90d', '1y'].map(p => (
            <button
              key={p}
              className={`join-item btn btn-sm ${period === p ? 'btn-active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 Days' : 
               p === '30d' ? '30 Days' : 
               p === '90d' ? '90 Days' : 
               '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-primary">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Tasks Completed</div>
          <div className="stat-value text-primary">
            {taskStats.completed || 0}
          </div>
          <div className="stat-desc">
            {taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% completion rate
          </div>
        </div>

        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-info">
            <Activity className="w-8 h-8" />
          </div>
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-info">
            {taskStats.inProgress || 0}
          </div>
          <div className="stat-desc">
            {taskStats.review || 0} in review
          </div>
        </div>

        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-warning">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="stat-title">Overdue</div>
          <div className="stat-value text-warning">
            {taskStats.overdue || 0}
          </div>
          <div className="stat-desc">
            {taskStats.total ? Math.round((taskStats.overdue / taskStats.total) * 100) : 0}% of total
          </div>
        </div>

        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-success">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title">Hours Tracked</div>
          <div className="stat-value text-success">
            {timeStats.totalDuration ? Math.round(timeStats.totalDuration / 3600) : 0}h
          </div>
          <div className="stat-desc">
            {timeStats.billableDuration ? Math.round(timeStats.billableDuration / 3600) : 0}h billable
          </div>
        </div>
      </div>

      {/* Productivity Metrics */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title mb-4">Productivity Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {productivityMetrics.tasksPerDay?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-base-content/60">Tasks/Day</div>
            </div>
            
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {productivityMetrics.completionRate?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-base-content/60">Completion Rate</div>
            </div>
            
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-info mb-1">
                {productivityMetrics.averageTaskTime?.toFixed(1) || '0.0'}h
              </div>
              <div className="text-sm text-base-content/60">Avg Task Time</div>
            </div>
            
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-warning mb-1">
                {productivityMetrics.timeAccuracy?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-base-content/60">Time Accuracy</div>
            </div>
            
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold text-error mb-1">
                {productivityMetrics.overdueRate?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-base-content/60">Overdue Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Task Completion Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--p))"
                    fill="hsl(var(--p))"
                    fillOpacity={0.6}
                    name="Completed Tasks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Priority Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Project Performance */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Project Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="completionRate"
                    fill="hsl(var(--p))"
                    name="Completion Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        {teamPerformance && teamPerformance.length > 0 && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title mb-4">Team Performance</h3>
              <div className="space-y-3">
                {teamPerformance.slice(0, 5).map((member, index) => (
                  <div key={member.user._id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          {member.user.avatar ? (
                            <img src={member.user.avatar} alt={member.user.name} />
                          ) : (
                            <div className="bg-neutral text-neutral-content w-10 h-10 rounded-full flex items-center justify-center">
                              {member.user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-base-content/60">
                          {member.totalTasks} tasks • {member.totalHours?.toFixed(1) || 0}h
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {Math.round(member.completionRate)}%
                      </div>
                      <div className="text-xs text-base-content/60">completion</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Tracking Summary */}
      {timeStats && Object.keys(timeStats).length > 0 && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Time Tracking Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat">
                <div className="stat-title">Total Hours</div>
                <div className="stat-value text-primary">
                  {timeStats.totalDuration ? (timeStats.totalDuration / 3600).toFixed(1) : '0.0'}h
                </div>
                <div className="stat-desc">
                  {timeStats.totalEntries || 0} entries
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Billable Hours</div>
                <div className="stat-value text-success">
                  {timeStats.billableDuration ? (timeStats.billableDuration / 3600).toFixed(1) : '0.0'}h
                </div>
                <div className="stat-desc">
                  {timeStats.totalDuration ? 
                    Math.round((timeStats.billableDuration / timeStats.totalDuration) * 100) : 0}% billable
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Earnings</div>
                <div className="stat-value text-warning">
                  ${timeStats.totalEarnings?.toFixed(2) || '0.00'}
                </div>
                <div className="stat-desc">
                  From billable hours
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Avg Session</div>
                <div className="stat-value text-info">
                  {timeStats.totalEntries > 0 ? 
                    ((timeStats.totalDuration / timeStats.totalEntries) / 3600).toFixed(1) : '0.0'}h
                </div>
                <div className="stat-desc">
                  Per time entry
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;