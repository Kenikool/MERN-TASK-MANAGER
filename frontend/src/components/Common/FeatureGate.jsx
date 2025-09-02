import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  Crown,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  X
} from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'

const FeatureGate = ({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true,
  className = '',
  requiredPlan = 'basic'
}) => {
  const navigate = useNavigate()
  const { hasFeature, getCurrentPlan, plans } = useSubscription()
  
  const currentPlan = getCurrentPlan()
  const hasAccess = hasFeature(feature)
  
  if (hasAccess) {
    return children
  }

  if (fallback) {
    return fallback
  }

  if (!showUpgrade) {
    return null
  }

  const requiredPlanData = plans[requiredPlan]
  
  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'basic': return <Zap className="w-5 h-5" />
      case 'pro': return <Star className="w-5 h-5" />
      case 'premium': return <Crown className="w-5 h-5" />
      default: return <Lock className="w-5 h-5" />
    }
  }

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'basic': return 'text-primary'
      case 'pro': return 'text-secondary'
      case 'premium': return 'text-accent'
      default: return 'text-base-content'
    }
  }

  const getFeatureDescription = (feature) => {
    const descriptions = {
      'timeTracking': 'Track time spent on tasks and projects',
      'advancedReports': 'Generate detailed analytics and reports',
      'customFields': 'Add custom fields to tasks and projects',
      'apiAccess': 'Access our REST API for integrations',
      'aiRequests': 'Use AI-powered features and insights',
      'teamMembers': 'Collaborate with unlimited team members',
      'storage': 'Store more files and attachments'
    }
    return descriptions[feature] || 'Access premium features'
  }

  return (
    <div className={`card bg-base-100 border-2 border-dashed border-base-300 ${className}`}>
      <div className="card-body text-center p-8">
        <div className={`mx-auto mb-4 ${getPlanColor(requiredPlan)}`}>
          {getPlanIcon(requiredPlan)}
        </div>
        
        <h3 className="text-xl font-bold mb-2">
          {requiredPlanData?.name} Feature
        </h3>
        
        <p className="text-base-content/70 mb-4">
          {getFeatureDescription(feature)}
        </p>
        
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Current Plan</span>
            <span className="badge badge-outline">{currentPlan.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Required Plan</span>
            <span className={`badge ${
              requiredPlan === 'basic' ? 'badge-primary' :
              requiredPlan === 'pro' ? 'badge-secondary' : 'badge-accent'
            }`}>
              {requiredPlanData?.name}
            </span>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="text-left mb-6">
          <h4 className="font-semibold mb-3">What you'll get:</h4>
          <div className="space-y-2">
            {requiredPlanData?.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/subscription/plans')}
            className="btn btn-primary flex-1"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          
          <button
            onClick={() => navigate('/subscription/plans')}
            className="btn btn-outline flex-1"
          >
            Compare Plans
          </button>
        </div>

        <p className="text-xs text-base-content/60 mt-4">
          Starting at ${requiredPlanData?.price}/month
        </p>
      </div>
    </div>
  )
}

// Usage limit component
export const UsageLimitGate = ({ 
  feature, 
  currentUsage, 
  children, 
  className = '' 
}) => {
  const navigate = useNavigate()
  const { canUseFeature, getFeatureLimit, getCurrentPlan } = useSubscription()
  
  const limit = getFeatureLimit(feature)
  const canUse = canUseFeature(feature, currentUsage)
  const currentPlan = getCurrentPlan()
  
  if (canUse) {
    return children
  }

  const usagePercentage = limit > 0 ? (currentUsage / limit) * 100 : 100

  return (
    <div className={`card bg-base-100 border border-warning ${className}`}>
      <div className="card-body p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Usage Limit Reached</h3>
            <p className="text-sm text-base-content/60">
              You've reached your {feature} limit
            </p>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Usage</span>
            <span>{currentUsage} / {limit === -1 ? '∞' : limit}</span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2">
            <div 
              className="bg-warning h-2 rounded-full"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/subscription/plans')}
            className="btn btn-warning flex-1"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </button>
        </div>

        <p className="text-xs text-base-content/60 text-center mt-3">
          Upgrade to get higher limits or unlimited access
        </p>
      </div>
    </div>
  )
}

// Inline feature gate for smaller components
export const InlineFeatureGate = ({ 
  feature, 
  children, 
  requiredPlan = 'basic',
  size = 'sm' 
}) => {
  const navigate = useNavigate()
  const { hasFeature } = useSubscription()
  
  if (hasFeature(feature)) {
    return children
  }

  return (
    <div className="tooltip" data-tip={`Requires ${requiredPlan} plan`}>
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => navigate('/subscription/plans')}
            className={`btn btn-primary btn-${size} btn-circle`}
          >
            <Lock className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeatureGate