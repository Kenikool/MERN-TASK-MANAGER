import React, { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Activity,
  Zap,
  Award
} from 'lucide-react'

const ProductivityChart = ({ data, period = 'week' }) => {
  const [selectedMetric, setSelectedMetric] = useState('tasks')

  // Mock data for demonstration
  const mockData = {
    week: {
      tasks: [
        { label: 'Mon', completed: 5, planned: 6, efficiency: 83 },
        { label: 'Tue', completed: 8, planned: 8, efficiency: 100 },
        { label: 'Wed', completed: 3, planned: 5, efficiency: 60 },
        { label: 'Thu', completed: 7, planned: 7, efficiency: 100 },
        { label: 'Fri', completed: 6, planned: 8, efficiency: 75 },
        { label: 'Sat', completed: 2, planned: 3, efficiency: 67 },
        { label: 'Sun', completed: 1, planned: 2, efficiency: 50 }
      ],
      hours: [
        { label: 'Mon', logged: 8, planned: 8, efficiency: 100 },
        { label: 'Tue', logged: 7.5, planned: 8, efficiency: 94 },
        { label: 'Wed', logged: 6, planned: 8, efficiency: 75 },
        { label: 'Thu', logged: 8.5, planned: 8, efficiency: 106 },
        { label: 'Fri', logged: 7, planned: 8, efficiency: 88 },
        { label: 'Sat', logged: 3, planned: 4, efficiency: 75 },
        { label: 'Sun', logged: 2, planned: 2, efficiency: 100 }
      ]
    }
  }

  const chartData = data || mockData[period]?.[selectedMetric] || mockData.week.tasks

  const metrics = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary'
    },
    {
      id: 'hours',
      label: 'Hours',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning'
    }
  ]

  const getMaxValue = () => {
    return Math.max(...chartData.map(item => Math.max(item.completed || item.logged, item.planned)))
  }

  const getAverageEfficiency = () => {
    const total = chartData.reduce((sum, item) => sum + item.efficiency, 0)
    return Math.round(total / chartData.length)
  }

  const getTrend = () => {
    if (chartData.length < 2) return { direction: 'neutral', value: 0 }
    
    const recent = chartData.slice(-3).reduce((sum, item) => sum + item.efficiency, 0) / 3
    const previous = chartData.slice(0, -3).reduce((sum, item) => sum + item.efficiency, 0) / (chartData.length - 3)
    
    const change = recent - previous
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: Math.abs(Math.round(change))
    }
  }

  const trend = getTrend()
  const maxValue = getMaxValue()
  const avgEfficiency = getAverageEfficiency()

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Productivity Analytics</h2>
              <p className="text-base-content/60 text-sm">
                Track your performance over time
              </p>
            </div>
          </div>

          {/* Metric Selector */}
          <div className="join">
            {metrics.map(metric => {
              const Icon = metric.icon
              return (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id)}
                  className={`btn join-item btn-sm ${
                    selectedMetric === metric.id ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {metric.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-primary">
              <Activity className="w-8 h-8" />
            </div>
            <div className="stat-title">Average Efficiency</div>
            <div className="stat-value text-primary">{avgEfficiency}%</div>
            <div className={`stat-desc flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-success' : 
              trend.direction === 'down' ? 'text-error' : 'text-base-content/60'
            }`}>
              {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
              {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
              {trend.value > 0 ? `${trend.value}% from last period` : 'No change'}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-success">
              <Target className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Completed</div>
            <div className="stat-value text-success">
              {chartData.reduce((sum, item) => sum + (item.completed || item.logged), 0)}
            </div>
            <div className="stat-desc">
              {selectedMetric === 'tasks' ? 'tasks this week' : 'hours logged'}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-warning">
              <Zap className="w-8 h-8" />
            </div>
            <div className="stat-title">Best Day</div>
            <div className="stat-value text-warning">
              {chartData.reduce((best, item) => 
                item.efficiency > best.efficiency ? item : best
              ).label}
            </div>
            <div className="stat-desc">
              {chartData.reduce((best, item) => 
                item.efficiency > best.efficiency ? item : best
              ).efficiency}% efficiency
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-base-300 rounded"></div>
              <span className="text-sm">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success rounded-full"></div>
              <span className="text-sm">Efficiency</span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="relative h-64 bg-base-200 rounded-lg p-4">
            <div className="flex items-end justify-between h-full gap-2">
              {chartData.map((item, index) => {
                const completedHeight = ((item.completed || item.logged) / maxValue) * 100
                const plannedHeight = (item.planned / maxValue) * 100
                const efficiencyHeight = (item.efficiency / 100) * 100

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    {/* Efficiency Indicator */}
                    <div className="relative w-full h-2 bg-base-300 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.efficiency >= 90 ? 'bg-success' :
                          item.efficiency >= 70 ? 'bg-warning' : 'bg-error'
                        }`}
                        style={{ width: `${item.efficiency}%` }}
                      ></div>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative flex-1 w-full flex items-end justify-center">
                      <div className="relative w-8 h-full flex items-end">
                        {/* Planned Bar (Background) */}
                        <div 
                          className="absolute bottom-0 w-full bg-base-300 rounded-t transition-all duration-500"
                          style={{ height: `${plannedHeight}%` }}
                        ></div>
                        
                        {/* Completed Bar (Foreground) */}
                        <div 
                          className="absolute bottom-0 w-full bg-primary rounded-t transition-all duration-700"
                          style={{ height: `${completedHeight}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="text-center">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-base-content/60">
                        {item.completed || item.logged}/{item.planned}
                      </div>
                      <div className={`text-xs font-medium ${
                        item.efficiency >= 90 ? 'text-success' :
                        item.efficiency >= 70 ? 'text-warning' : 'text-error'
                      }`}>
                        {item.efficiency}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-4 bottom-16 flex flex-col justify-between text-xs text-base-content/60">
            <span>{maxValue}</span>
            <span>{Math.round(maxValue * 0.75)}</span>
            <span>{Math.round(maxValue * 0.5)}</span>
            <span>{Math.round(maxValue * 0.25)}</span>
            <span>0</span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Insights & Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Performance Summary</h4>
              <ul className="space-y-1 text-base-content/70">
                <li>• Average efficiency: {avgEfficiency}%</li>
                <li>• Best performing day: {chartData.reduce((best, item) => 
                  item.efficiency > best.efficiency ? item : best
                ).label}</li>
                <li>• Total {selectedMetric}: {chartData.reduce((sum, item) => 
                  sum + (item.completed || item.logged), 0)}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1 text-base-content/70">
                {avgEfficiency < 70 && (
                  <li>• Consider breaking down large tasks</li>
                )}
                {trend.direction === 'down' && (
                  <li>• Review recent workflow changes</li>
                )}
                <li>• Maintain consistent daily planning</li>
                <li>• Track time for better estimates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductivityChart