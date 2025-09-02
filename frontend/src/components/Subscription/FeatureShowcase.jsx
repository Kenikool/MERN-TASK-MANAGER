import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  Zap,
  Star,
  Shield,
  Brain,
  Users,
  Clock,
  BarChart3,
  Database,
  Cpu,
  Globe,
  FileText,
  Calendar,
  MessageSquare,
  Video,
  Smartphone,
  Lock,
  Headphones,
  Palette,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  Bell,
  Eye,
  Target,
  TrendingUp,
  Layers,
  GitBranch,
  Workflow,
  Briefcase,
  Award,
  Bookmark,
  Tag,
  Link,
  Share2,
  Archive,
  RefreshCw,
  Maximize2,
  PieChart,
  Activity,
  Gauge,
  Lightbulb,
  Rocket,
  Sparkles,
  Wand2,
  Bot,
  Mic,
  Camera,
  Map,
  Compass,
  Navigation,
  Radar
} from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'

const FeatureShowcase = () => {
  const navigate = useNavigate()
  const { getCurrentPlan, plans } = useSubscription()
  const [activeCategory, setActiveCategory] = useState('productivity')
  
  const currentPlan = getCurrentPlan()

  const featureCategories = {
    productivity: {
      name: 'Productivity & Tasks',
      icon: <Target className="w-5 h-5" />,
      features: {
        free: [
          { icon: <FileText className="w-4 h-4" />, name: 'Basic Task Creation', description: 'Create simple tasks with titles and descriptions' },
          { icon: <Calendar className="w-4 h-4" />, name: 'Due Dates', description: 'Set basic due dates for tasks' },
          { icon: <Tag className="w-4 h-4" />, name: 'Simple Labels', description: 'Basic task categorization' },
          { icon: <Eye className="w-4 h-4" />, name: 'Task Views', description: 'List and grid view for tasks' },
          { icon: <Search className="w-4 h-4" />, name: 'Basic Search', description: 'Search tasks by title' }
        ],
        basic: [
          { icon: <Clock className="w-4 h-4" />, name: 'Time Tracking', description: 'Track time spent on tasks with start/stop timer' },
          { icon: <Bell className="w-4 h-4" />, name: 'Notifications', description: 'Email and push notifications for deadlines' },
          { icon: <Filter className="w-4 h-4" />, name: 'Advanced Filters', description: 'Filter tasks by status, priority, assignee' },
          { icon: <Calendar className="w-4 h-4" />, name: 'Calendar Integration', description: 'View tasks in calendar format' },
          { icon: <Archive className="w-4 h-4" />, name: 'Task Templates', description: 'Create reusable task templates' },
          { icon: <Bookmark className="w-4 h-4" />, name: 'Favorites', description: 'Mark important tasks as favorites' }
        ],
        pro: [
          { icon: <Layers className="w-4 h-4" />, name: 'Subtasks & Dependencies', description: 'Create complex task hierarchies' },
          { icon: <GitBranch className="w-4 h-4" />, name: 'Task Dependencies', description: 'Link tasks with dependencies' },
          { icon: <Workflow className="w-4 h-4" />, name: 'Custom Workflows', description: 'Create custom task workflows' },
          { icon: <Settings className="w-4 h-4" />, name: 'Custom Fields', description: 'Add custom fields to tasks' },
          { icon: <RefreshCw className="w-4 h-4" />, name: 'Recurring Tasks', description: 'Set up recurring task schedules' },
          { icon: <Gauge className="w-4 h-4" />, name: 'Productivity Metrics', description: 'Detailed productivity analytics' }
        ],
        premium: [
          { icon: <Bot className="w-4 h-4" />, name: 'AI Task Assistant', description: 'AI-powered task suggestions and optimization' },
          { icon: <Wand2 className="w-4 h-4" />, name: 'Smart Automation', description: 'Automate repetitive tasks with AI' },
          { icon: <Lightbulb className="w-4 h-4" />, name: 'Intelligent Insights', description: 'AI-driven productivity insights' },
          { icon: <Rocket className="w-4 h-4" />, name: 'Predictive Analytics', description: 'Predict project completion times' },
          { icon: <Sparkles className="w-4 h-4" />, name: 'Smart Prioritization', description: 'AI automatically prioritizes tasks' },
          { icon: <Radar className="w-4 h-4" />, name: 'Advanced Forecasting', description: 'Predict workload and capacity' }
        ]
      }
    },
    collaboration: {
      name: 'Team & Collaboration',
      icon: <Users className="w-5 h-5" />,
      features: {
        free: [
          { icon: <Users className="w-4 h-4" />, name: 'Solo Workspace', description: 'Personal task management' },
          { icon: <Share2 className="w-4 h-4" />, name: 'Basic Sharing', description: 'Share tasks via link' }
        ],
        basic: [
          { icon: <Users className="w-4 h-4" />, name: 'Small Teams (3)', description: 'Collaborate with up to 3 team members' },
          { icon: <MessageSquare className="w-4 h-4" />, name: 'Task Comments', description: 'Comment and discuss on tasks' },
          { icon: <Bell className="w-4 h-4" />, name: 'Team Notifications', description: 'Get notified of team activities' },
          { icon: <Eye className="w-4 h-4" />, name: 'Activity Feed', description: 'See team activity in real-time' }
        ],
        pro: [
          { icon: <Users className="w-4 h-4" />, name: 'Medium Teams (10)', description: 'Collaborate with up to 10 team members' },
          { icon: <Video className="w-4 h-4" />, name: 'Video Calls', description: 'Integrated video conferencing' },
          { icon: <FileText className="w-4 h-4" />, name: 'Document Collaboration', description: 'Real-time document editing' },
          { icon: <Briefcase className="w-4 h-4" />, name: 'Team Workspaces', description: 'Separate workspaces for different teams' },
          { icon: <Award className="w-4 h-4" />, name: 'Role Management', description: 'Advanced permission and role system' },
          { icon: <Activity className="w-4 h-4" />, name: 'Team Analytics', description: 'Team performance analytics' }
        ],
        premium: [
          { icon: <Users className="w-4 h-4" />, name: 'Unlimited Teams', description: 'No limit on team size' },
          { icon: <Globe className="w-4 h-4" />, name: 'Multi-Organization', description: 'Manage multiple organizations' },
          { icon: <Shield className="w-4 h-4" />, name: 'Enterprise Security', description: 'Advanced security features' },
          { icon: <Cpu className="w-4 h-4" />, name: 'API Access', description: 'Full API access for integrations' },
          { icon: <Palette className="w-4 h-4" />, name: 'White-label', description: 'Custom branding and white-label options' },
          { icon: <Headphones className="w-4 h-4" />, name: 'Dedicated Support', description: '24/7 dedicated support team' }
        ]
      }
    },
    analytics: {
      name: 'Analytics & Reporting',
      icon: <BarChart3 className="w-5 h-5" />,
      features: {
        free: [
          { icon: <BarChart3 className="w-4 h-4" />, name: 'Basic Stats', description: 'Simple task completion statistics' },
          { icon: <Calendar className="w-4 h-4" />, name: 'Weekly Summary', description: 'Basic weekly progress summary' }
        ],
        basic: [
          { icon: <PieChart className="w-4 h-4" />, name: 'Visual Charts', description: 'Interactive charts and graphs' },
          { icon: <TrendingUp className="w-4 h-4" />, name: 'Trend Analysis', description: 'Track productivity trends over time' },
          { icon: <Download className="w-4 h-4" />, name: 'Export Reports', description: 'Export reports to PDF/Excel' },
          { icon: <Clock className="w-4 h-4" />, name: 'Time Reports', description: 'Detailed time tracking reports' }
        ],
        pro: [
          { icon: <Gauge className="w-4 h-4" />, name: 'Advanced Dashboards', description: 'Customizable analytics dashboards' },
          { icon: <Target className="w-4 h-4" />, name: 'Goal Tracking', description: 'Set and track productivity goals' },
          { icon: <Activity className="w-4 h-4" />, name: 'Performance Metrics', description: 'Detailed performance analytics' },
          { icon: <Compass className="w-4 h-4" />, name: 'Burndown Charts', description: 'Project progress visualization' },
          { icon: <Map className="w-4 h-4" />, name: 'Resource Planning', description: 'Resource allocation analytics' }
        ],
        premium: [
          { icon: <Brain className="w-4 h-4" />, name: 'AI-Powered Insights', description: 'Machine learning insights and predictions' },
          { icon: <Rocket className="w-4 h-4" />, name: 'Predictive Analytics', description: 'Predict future performance and bottlenecks' },
          { icon: <Navigation className="w-4 h-4" />, name: 'Strategic Planning', description: 'Long-term strategic planning tools' },
          { icon: <Maximize2 className="w-4 h-4" />, name: 'Executive Dashboards', description: 'High-level executive reporting' },
          { icon: <Radar className="w-4 h-4" />, name: 'Risk Analysis', description: 'Project risk assessment and mitigation' }
        ]
      }
    },
    integrations: {
      name: 'Integrations & API',
      icon: <Globe className="w-5 h-5" />,
      features: {
        free: [
          { icon: <Calendar className="w-4 h-4" />, name: 'Basic Calendar', description: 'Simple calendar view' },
          { icon: <Bell className="w-4 h-4" />, name: 'Email Notifications', description: 'Basic email notifications' }
        ],
        basic: [
          { icon: <Calendar className="w-4 h-4" />, name: 'Google Calendar', description: 'Sync with Google Calendar' },
          { icon: <MessageSquare className="w-4 h-4" />, name: 'Slack Integration', description: 'Connect with Slack workspace' },
          { icon: <Upload className="w-4 h-4" />, name: 'File Attachments', description: 'Attach files to tasks' },
          { icon: <Smartphone className="w-4 h-4" />, name: 'Mobile App', description: 'iOS and Android mobile apps' }
        ],
        pro: [
          { icon: <Globe className="w-4 h-4" />, name: 'Multiple Integrations', description: 'Connect with 20+ popular tools' },
          { icon: <Database className="w-4 h-4" />, name: 'Data Sync', description: 'Two-way data synchronization' },
          { icon: <Link className="w-4 h-4" />, name: 'Webhooks', description: 'Custom webhook integrations' },
          { icon: <Settings className="w-4 h-4" />, name: 'Custom Integrations', description: 'Build custom integrations' },
          { icon: <RefreshCw className="w-4 h-4" />, name: 'Auto-sync', description: 'Automatic data synchronization' }
        ],
        premium: [
          { icon: <Cpu className="w-4 h-4" />, name: 'Full API Access', description: 'Complete REST and GraphQL API' },
          { icon: <Globe className="w-4 h-4" />, name: 'Enterprise Integrations', description: 'SAP, Salesforce, and enterprise tools' },
          { icon: <Shield className="w-4 h-4" />, name: 'SSO Integration', description: 'Single Sign-On with SAML/OAuth' },
          { icon: <Database className="w-4 h-4" />, name: 'Data Warehouse', description: 'Connect to data warehouses' },
          { icon: <Workflow className="w-4 h-4" />, name: 'Custom Workflows', description: 'Build complex automated workflows' }
        ]
      }
    },
    ai: {
      name: 'AI & Automation',
      icon: <Brain className="w-5 h-5" />,
      features: {
        free: [
          { icon: <Search className="w-4 h-4" />, name: 'Basic Search', description: 'Simple text search functionality' }
        ],
        basic: [
          { icon: <Bot className="w-4 h-4" />, name: 'AI Suggestions', description: '5 AI-powered task suggestions per month' },
          { icon: <Lightbulb className="w-4 h-4" />, name: 'Smart Reminders', description: 'Intelligent reminder scheduling' },
          { icon: <Target className="w-4 h-4" />, name: 'Priority Suggestions', description: 'AI suggests task priorities' }
        ],
        pro: [
          { icon: <Brain className="w-4 h-4" />, name: 'Advanced AI (25/month)', description: '25 AI requests for optimization and insights' },
          { icon: <Wand2 className="w-4 h-4" />, name: 'Smart Scheduling', description: 'AI optimizes your schedule' },
          { icon: <Activity className="w-4 h-4" />, name: 'Productivity Analysis', description: 'AI analyzes work patterns' },
          { icon: <Mic className="w-4 h-4" />, name: 'Voice Commands', description: 'Voice-activated task creation' },
          { icon: <Camera className="w-4 h-4" />, name: 'Smart Capture', description: 'AI extracts tasks from images/documents' }
        ],
        premium: [
          { icon: <Sparkles className="w-4 h-4" />, name: 'Unlimited AI', description: 'Unlimited AI requests and features' },
          { icon: <Rocket className="w-4 h-4" />, name: 'Predictive AI', description: 'Predict project outcomes and risks' },
          { icon: <Workflow className="w-4 h-4" />, name: 'AI Automation', description: 'Fully automated workflows' },
          { icon: <Navigation className="w-4 h-4" />, name: 'Strategic AI', description: 'AI-powered strategic planning' },
          { icon: <Radar className="w-4 h-4" />, name: 'AI Coach', description: 'Personal AI productivity coach' },
          { icon: <Bot className="w-4 h-4" />, name: 'Custom AI Models', description: 'Train custom AI models for your workflow' }
        ]
      }
    }
  }

  const categories = Object.keys(featureCategories)

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'free': return 'border-base-300 bg-base-100'
      case 'basic': return 'border-primary bg-primary/5'
      case 'pro': return 'border-secondary bg-secondary/5'
      case 'premium': return 'border-accent bg-accent/5'
      default: return 'border-base-300 bg-base-100'
    }
  }

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'free': return <Shield className="w-5 h-5" />
      case 'basic': return <Zap className="w-5 h-5" />
      case 'pro': return <Star className="w-5 h-5" />
      case 'premium': return <Crown className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Feature Showcase</h1>
        <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
          Discover all the powerful features available across our subscription plans
        </p>
      </div>

      {/* Current Plan Status */}
      <div className="card bg-base-100 shadow-sm border">
        <div className="card-body p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-primary">
                {getPlanIcon(currentPlan?.id)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Current Plan: {currentPlan?.name}</h3>
                <p className="text-base-content/60">
                  {currentPlan?.price === 0 ? 'Free forever' : `$${currentPlan?.price}/month`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/subscription/plans')}
              className="btn btn-primary"
            >
              {currentPlan?.id === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => {
          const categoryData = featureCategories[category]
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`btn btn-sm ${
                activeCategory === category ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {categoryData.icon}
              <span className="ml-2">{categoryData.name}</span>
            </button>
          )
        })}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(plans).map(([planId, planData]) => {
          const features = featureCategories[activeCategory].features[planId] || []
          
          return (
            <div
              key={planId}
              className={`card border-2 ${getPlanColor(planId)} ${
                planId === currentPlan?.id ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="card-body p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="mb-3">
                    {getPlanIcon(planId)}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{planData.name}</h3>
                  <div className="text-2xl font-bold">
                    {planData.price === 0 ? 'Free' : `$${planData.price}`}
                    {planData.price > 0 && <span className="text-sm font-normal">/month</span>}
                  </div>
                  {planId === currentPlan?.id && (
                    <div className="badge badge-primary badge-sm mt-2">Current Plan</div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-primary mt-0.5">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{feature.name}</h4>
                        <p className="text-xs text-base-content/60 mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  {planId === currentPlan?.id ? (
                    <button className="btn btn-outline w-full" disabled>
                      Current Plan
                    </button>
                  ) : planId === 'free' ? (
                    <button 
                      onClick={() => navigate('/subscription/plans')}
                      className="btn btn-ghost w-full"
                    >
                      Downgrade
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/subscription/plans')}
                      className="btn btn-primary w-full"
                    >
                      Upgrade to {planData.name}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-primary" />
              <h3 className="text-lg font-bold">AI-Powered</h3>
            </div>
            <p className="text-base-content/70">
              Leverage artificial intelligence to optimize your workflow, predict bottlenecks, and boost productivity.
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-secondary" />
              <h3 className="text-lg font-bold">Team Collaboration</h3>
            </div>
            <p className="text-base-content/70">
              Work seamlessly with your team through real-time collaboration, video calls, and shared workspaces.
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-accent" />
              <h3 className="text-lg font-bold">Advanced Analytics</h3>
            </div>
            <p className="text-base-content/70">
              Get deep insights into your productivity with advanced analytics, custom dashboards, and predictive reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureShowcase