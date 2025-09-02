import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  Target,
  FileText,
  PieChart,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

const Reports = () => {
  const [dateRange, setDateRange] = useState('last-30-days')
  const [reportType, setReportType] = useState('overview')

  const handleGenerateReport = () => {
    toast.info('Report generation feature coming soon!')
  }

  const handleExportReport = () => {
    toast.info('Export feature coming soon!')
  }

  // Mock data for demonstration
  const stats = {
    totalTasks: 156,
    completedTasks: 124,
    overdueTasks: 8,
    activeProjects: 12,
    teamMembers: 24,
    avgCompletionTime: '2.3 days',
    productivity: 87,
    efficiency: 92
  }

  const reportTypes = [
    {
      id: 'overview',
      name: 'Overview Report',
      description: 'General performance metrics and statistics',
      icon: BarChart3
    },
    {
      id: 'tasks',
      name: 'Task Report',
      description: 'Detailed task completion and performance data',
      icon: CheckSquare
    },
    {
      id: 'projects',
      name: 'Project Report',
      description: 'Project progress and milestone tracking',
      icon: Target
    },
    {
      id: 'team',
      name: 'Team Report',
      description: 'Team productivity and workload analysis',
      icon: Users
    },
    {
      id: 'time',
      name: 'Time Report',
      description: 'Time tracking and efficiency metrics',
      icon: Clock
    }
  ]

  return (
    <>
      <Helmet>
        <title>Reports - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-base-content/60">
              Track performance and generate insights from your data
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportReport}
              className="btn btn-outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button 
              onClick={handleGenerateReport}
              className="btn btn-primary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <p className="text-xs text-success">+12% from last month</p>
                </div>
                <CheckSquare className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-success">{stats.completedTasks}</p>
                  <p className="text-xs text-success">+8% from last month</p>
                </div>
                <Target className="w-8 h-8 text-success" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Productivity</p>
                  <p className="text-2xl font-bold text-info">{stats.productivity}%</p>
                  <p className="text-xs text-success">+5% from last month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-info" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Avg. Completion</p>
                  <p className="text-2xl font-bold text-warning">{stats.avgCompletionTime}</p>
                  <p className="text-xs text-error">-0.2 days from last month</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Filter className="w-5 h-5" />
              Report Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Range */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Date Range</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="last-7-days">Last 7 days</option>
                  <option value="last-30-days">Last 30 days</option>
                  <option value="last-90-days">Last 90 days</option>
                  <option value="last-year">Last year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {/* Report Type */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Report Type</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Export Format</span>
                </label>
                <select className="select select-bordered">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map(type => {
            const Icon = type.icon
            return (
              <div 
                key={type.id}
                className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 ${
                  reportType === type.id ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => setReportType(type.id)}
              >
                <div className="card-body p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                  </div>
                  <p className="text-base-content/60 text-sm">{type.description}</p>
                  
                  <div className="mt-4">
                    <button 
                      className="btn btn-outline btn-sm w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGenerateReport()
                      }}
                    >
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chart Placeholder */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <PieChart className="w-5 h-5" />
              Performance Overview
            </h2>
            
            <div className="bg-base-200 rounded-lg p-12 text-center">
              <Activity className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Interactive Charts Coming Soon</h3>
              <p className="text-base-content/60">
                Advanced analytics and interactive charts will be available in the next update.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Recent Reports</h2>
            
            <div className="text-center py-8 text-base-content/60">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first report to see it here</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Reports