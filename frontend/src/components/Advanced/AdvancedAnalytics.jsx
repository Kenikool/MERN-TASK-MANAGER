import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Users,
  Calendar,
  Activity,
  Gauge,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Rocket,
  Star,
  Crown
} from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'
import FeatureGate from '../Common/FeatureGate'

const AdvancedAnalytics = () => {
  const { hasFeature, getCurrentPlan } = useSubscription()
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('productivity')
  const [isLoading, setIsLoading] = useState(false)
  
  const currentPlan = getCurrentPlan()

  // Mock analytics data - replace with real API calls
  const [analyticsData] = useState({
    productivity: {
      score: 87,
      trend: 12,
      weeklyData: [65, 72, 78, 85, 82, 89, 87],
      insights: [
        'Your productivity increased by 12% this week',
        'Best performance on Tuesday and Friday',
        'Consider scheduling important tasks in the morning'
      ]
    },
    tasks: {
      completed: 45,
      pending: 12,
      overdue: 3,
      completionRate: 88,
      avgCompletionTime: 2.4,
      weeklyCompletion: [8, 12, 6, 9, 11, 7, 5]
    },
    time: {
      totalHours: 42.5,
      billableHours: 38.2,
      efficiency: 89.9,
      dailyAverage: 6.1,
      weeklyData: [7.2, 8.1, 6.8, 5.9, 7.5, 6.2, 0.8]
    },
    team: {
      members: 8,
      activeMembers: 6,
      collaboration: 92,
      avgResponseTime: 1.2,
      teamVelocity: 78
    },
    projects: {
      active: 5,
      completed: 12,
      onTrack: 4,
      atRisk: 1,
      avgDuration: 18.5
    }
  })

  const [predictions] = useState({
    projectCompletion: {
      'Project Alpha': { completion: '2024-02-15', confidence: 85 },
      'Mobile App': { completion: '2024-03-01', confidence: 72 },
      'Website Redesign': { completion: '2024-02-28', confidence: 91 }
    },
    workload: {
      nextWeek: 'High',
      nextMonth: 'Moderate',
      burnoutRisk: 'Low'
    },
    recommendations: [
      'Schedule lighter workload for next Tuesday',
      'Consider delegating UI tasks to reduce bottleneck',
      'Team velocity suggests adding 1 more developer'
    ]
  })

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const exportReport = () => {
    // Simulate report export
    const reportData = {
      timeRange,
      generatedAt: new Date().toISOString(),
      analytics: analyticsData,
      predictions: hasFeature('advancedReports') ? predictions : null
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'productivity': return <Gauge className="w-5 h-5" />
      case 'tasks': return <CheckCircle className="w-5 h-5" />
      case 'time': return <Clock className="w-5 h-5" />
      case 'team': return <Users className="w-5 h-5" />
      case 'projects': return <Target className="w-5 h-5" />
      default: return <BarChart3 className="w-5 h-5" />
    }
  }

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-success" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-error" />
    return <Activity className="w-4 h-4 text-base-content/60" />
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-error'
  }

  if (!hasFeature('advancedReports') && currentPlan?.id === 'free') {
    return (
      <FeatureGate 
        feature="advancedReports" 
        requiredPlan="basic"
        className="min-h-96"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-base-content/60">
            Deep insights into your productivity and performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <button 
            onClick={refreshData}
            className="btn btn-outline btn-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
          
          <button 
            onClick={exportReport}
            className="btn btn-primary btn-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Plan Features Notice */}
      <div className="alert alert-info">
        <Star className="w-4 h-4" />
        <div>
          <div className="font-medium">
            {currentPlan?.name} Plan Analytics
          </div>
          <div className="text-sm">
            {currentPlan?.id === 'basic' && 'Basic analytics with visual charts and trend analysis'}
            {currentPlan?.id === 'pro' && 'Advanced analytics with custom dashboards and goal tracking'}
            {currentPlan?.id === 'premium' && 'AI-powered insights with predictive analytics and strategic planning'}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">Productivity Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analyticsData.productivity.score)}`}>
                  {analyticsData.productivity.score}%
                </p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(analyticsData.productivity.trend)}
                <span className="text-sm font-medium">
                  {analyticsData.productivity.trend > 0 ? '+' : ''}{analyticsData.productivity.trend}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">Tasks Completed</p>
                <p className="text-2xl font-bold">{analyticsData.tasks.completed}</p>
              </div>
              <div className="text-success">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">Time Tracked</p>
                <p className="text-2xl font-bold">{analyticsData.time.totalHours}h</p>
              </div>
              <div className="text-primary">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base-content/60 text-sm">Team Efficiency</p>
                <p className="text-2xl font-bold">{analyticsData.team.collaboration}%</p>
              </div>
              <div className="text-secondary">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(analyticsData).map(metric => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`btn btn-sm ${
              selectedMetric === metric ? 'btn-primary' : 'btn-outline'
            }`}
          >
            {getMetricIcon(metric)}
            <span className="ml-2 capitalize">{metric}</span>
          </button>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Area */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="font-semibold mb-4 capitalize">{selectedMetric} Trends</h3>
            
            {/* Mock Chart */}
            <div className="h-64 bg-base-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
                <p className="text-base-content/60">
                  Interactive {selectedMetric} chart would appear here
                </p>
                <p className="text-sm text-base-content/40 mt-2">
                  Data visualization with Chart.js or Recharts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Key Insights</h3>
            
            <div className="space-y-3">
              {analyticsData.productivity.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>

            {hasFeature('advancedReports') && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">AI Recommendations</h4>
                <div className="space-y-2">
                  {predictions.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Features for Pro/Premium */}
      {hasFeature('advancedReports') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goal Tracking */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold mb-4">Goal Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Tasks</span>
                    <span>45/50</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time Goal</span>
                    <span>42.5/40h</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quality Score</span>
                    <span>87/90</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full" style={{ width: '97%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold mb-4">Team Performance</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Members</span>
                  <span className="font-medium">{analyticsData.team.activeMembers}/{analyticsData.team.members}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="font-medium">{analyticsData.team.avgResponseTime}h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Team Velocity</span>
                  <span className="font-medium">{analyticsData.team.teamVelocity} pts</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Collaboration Score</span>
                  <span className={`font-medium ${getScoreColor(analyticsData.team.collaboration)}`}>
                    {analyticsData.team.collaboration}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h3 className="font-semibold mb-4">Risk Assessment</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-sm font-medium">Low Burnout Risk</p>
                    <p className="text-xs text-base-content/60">Team workload is sustainable</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <div>
                    <p className="text-sm font-medium">1 Project At Risk</p>
                    <p className="text-xs text-base-content/60">Mobile App behind schedule</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-info/10 border border-info/20 rounded-lg">
                  <Eye className="w-4 h-4 text-info" />
                  <div>
                    <p className="text-sm font-medium">Monitor Workload</p>
                    <p className="text-xs text-base-content/60">Next week projected high</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium AI Features */}
      {currentPlan?.id === 'premium' && (
        <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-accent" />
              <h3 className="font-semibold">AI-Powered Predictions</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-base-100 rounded-lg p-4">
                <h4 className="font-medium mb-2">Project Completion</h4>
                {Object.entries(predictions.projectCompletion).map(([project, data]) => (
                  <div key={project} className="flex justify-between text-sm mb-1">
                    <span>{project}</span>
                    <span className="font-medium">{data.confidence}% confident</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-base-100 rounded-lg p-4">
                <h4 className="font-medium mb-2">Workload Forecast</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Next Week:</span>
                    <span className="font-medium text-error">{predictions.workload.nextWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Month:</span>
                    <span className="font-medium text-warning">{predictions.workload.nextMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Burnout Risk:</span>
                    <span className="font-medium text-success">{predictions.workload.burnoutRisk}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-base-100 rounded-lg p-4">
                <h4 className="font-medium mb-2">Strategic Insights</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Rocket className="w-4 h-4 text-accent" />
                  <span>Optimal team size: 9-10 members</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Brain className="w-4 h-4 text-accent" />
                  <span>Best productivity: Tue-Thu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedAnalytics