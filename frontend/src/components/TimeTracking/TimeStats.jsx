import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';

const TimeStats = ({ data, isLoading, period }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

  if (!data) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body text-center py-12">
          <BarChart className="w-16 h-16 mx-auto mb-4 text-base-content/40" />
          <h3 className="text-xl font-semibold text-base-content mb-2">
            No data available
          </h3>
          <p className="text-base-content/60">
            Start tracking time to see statistics here.
          </p>
        </div>
      </div>
    );
  }

  const { overall, daily, byProject, byTask } = data;

  // Prepare daily chart data
  const dailyChartData = daily.map(day => ({
    date: new Date(day._id).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    totalHours: day.totalHours,
    billableHours: day.billableHours,
    nonBillableHours: day.totalHours - day.billableHours
  }));

  // Prepare project pie chart data
  const projectChartData = byProject.slice(0, 5).map((project, index) => ({
    name: project.project.name,
    value: project.totalHours,
    color: project.project.color || `hsl(${index * 72}, 70%, 50%)`
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-base-100 p-3 rounded-lg shadow-lg border border-base-300">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}h
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatHours = (hours) => `${hours.toFixed(1)}h`;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Total Hours</p>
                <p className="text-2xl font-bold text-primary">
                  {formatHours(overall.totalHours)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary/60" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Billable Hours</p>
                <p className="text-2xl font-bold text-success">
                  {formatHours(overall.billableHours)}
                </p>
              </div>
              <Target className="w-8 h-8 text-success/60" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-info/10 to-info/5 border border-info/20">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Daily Average</p>
                <p className="text-2xl font-bold text-info">
                  {formatHours(overall.averagePerDay)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-info/60" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Productivity</p>
                <p className="text-2xl font-bold text-warning">
                  {overall.totalHours > 0 
                    ? Math.round((overall.billableHours / overall.totalHours) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Chart */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Daily Hours Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
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
                    dataKey="billableHours"
                    stackId="1"
                    stroke="hsl(var(--su))"
                    fill="hsl(var(--su))"
                    fillOpacity={0.6}
                    name="Billable"
                  />
                  <Area
                    type="monotone"
                    dataKey="nonBillableHours"
                    stackId="1"
                    stroke="hsl(var(--in))"
                    fill="hsl(var(--in))"
                    fillOpacity={0.6}
                    name="Non-billable"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Time by Project</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}h`}
                    labelLine={false}
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}h`, 'Hours']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Projects Table */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Top Projects</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Total Hours</th>
                    <th>Billable Hours</th>
                    <th>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {byProject.slice(0, 5).map((project) => (
                    <tr key={project.project._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.project.color }}
                          />
                          <span className="font-medium">
                            {project.project.name}
                          </span>
                        </div>
                      </td>
                      <td>{formatHours(project.totalHours)}</td>
                      <td>{formatHours(project.billableHours)}</td>
                      <td>{project.totalEntries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Tasks Table */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Top Tasks</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Total Hours</th>
                    <th>Billable Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {byTask.slice(0, 5).map((task) => (
                    <tr key={task.task._id}>
                      <td>
                        <span className="font-medium">
                          {task.task.title}
                        </span>
                      </td>
                      <td>{formatHours(task.totalHours)}</td>
                      <td>{formatHours(task.billableHours)}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          task.task.status === 'completed' ? 'badge-success' :
                          task.task.status === 'in-progress' ? 'badge-primary' :
                          task.task.status === 'review' ? 'badge-warning' :
                          'badge-ghost'
                        }`}>
                          {task.task.status.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="card-title mb-4">Productivity Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat">
              <div className="stat-title">Billable Ratio</div>
              <div className="stat-value text-success">
                {overall.totalHours > 0 
                  ? Math.round((overall.billableHours / overall.totalHours) * 100)
                  : 0}%
              </div>
              <div className="stat-desc">
                {overall.billableHours.toFixed(1)}h of {overall.totalHours.toFixed(1)}h
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Average Session</div>
              <div className="stat-value text-primary">
                {overall.totalEntries > 0 
                  ? formatHours(overall.totalHours / overall.totalEntries)
                  : '0h'
                }
              </div>
              <div className="stat-desc">
                Across {overall.totalEntries} sessions
              </div>
            </div>

            <div className="stat">
              <div className="stat-title">Total Earnings</div>
              <div className="stat-value text-warning">
                ${overall.totalEarnings.toFixed(2)}
              </div>
              <div className="stat-desc">
                From billable hours
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeStats;