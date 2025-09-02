import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { subscriptionAPI } from '../utils/api'
import toast from 'react-hot-toast'

const SubscriptionContext = createContext()

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [features, setFeatures] = useState({})

  // Subscription plans
  const plans = {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        'Up to 5 tasks',
        'Basic task management',
        'Simple dashboard',
        'Email support'
      ],
      limits: {
        tasks: 5,
        projects: 1,
        storage: 100, // MB
        aiRequests: 0,
        teamMembers: 1,
        timeTracking: false,
        advancedReports: false,
        customFields: false,
        apiAccess: false
      }
    },
    basic: {
      id: 'basic',
      name: 'Basic',
      price: 1,
      features: [
        'Up to 50 tasks',
        'Advanced task management',
        'Time tracking',
        '5 AI requests/month',
        'Basic analytics',
        'Priority support'
      ],
      limits: {
        tasks: 50,
        projects: 5,
        storage: 1000, // MB
        aiRequests: 5,
        teamMembers: 3,
        timeTracking: true,
        advancedReports: false,
        customFields: false,
        apiAccess: false
      }
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 2,
      features: [
        'Up to 200 tasks',
        'Advanced analytics',
        'Custom fields',
        '25 AI requests/month',
        'Team collaboration',
        'Advanced reports',
        'Priority support'
      ],
      limits: {
        tasks: 200,
        projects: 20,
        storage: 5000, // MB
        aiRequests: 25,
        teamMembers: 10,
        timeTracking: true,
        advancedReports: true,
        customFields: true,
        apiAccess: false
      }
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      price: 3,
      features: [
        'Unlimited tasks',
        'Unlimited projects',
        'Unlimited AI requests',
        'Advanced AI features',
        'API access',
        'Custom integrations',
        'White-label options',
        '24/7 support'
      ],
      limits: {
        tasks: -1, // unlimited
        projects: -1,
        storage: 20000, // MB
        aiRequests: -1,
        teamMembers: -1,
        timeTracking: true,
        advancedReports: true,
        customFields: true,
        apiAccess: true
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await subscriptionAPI.getCurrentSubscription()
      setSubscription(response.data.subscription)
      setFeatures(response.data.features)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // Set default free plan
      setSubscription({
        plan: 'free',
        status: 'active',
        expiresAt: null
      })
      setFeatures(plans.free.limits)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPlan = () => {
    return plans[subscription?.plan || 'free']
  }

  const hasFeature = (feature) => {
    const currentPlan = getCurrentPlan()
    return currentPlan.limits[feature] === true || currentPlan.limits[feature] === -1
  }

  const getFeatureLimit = (feature) => {
    const currentPlan = getCurrentPlan()
    return currentPlan.limits[feature]
  }

  const canUseFeature = (feature, currentUsage = 0) => {
    const limit = getFeatureLimit(feature)
    if (limit === -1) return true // unlimited
    if (limit === false) return false // not allowed
    if (typeof limit === 'number') return currentUsage < limit
    return true
  }

  const getRemainingUsage = (feature, currentUsage = 0) => {
    const limit = getFeatureLimit(feature)
    if (limit === -1) return 'Unlimited'
    if (limit === false) return 0
    if (typeof limit === 'number') return Math.max(0, limit - currentUsage)
    return 0
  }

  const upgradeSubscription = async (planId, paymentMethod = 'stripe') => {
    try {
      // For now, we'll handle payment through the PaymentModal
      // This function can be used for direct upgrades without payment
      const response = await subscriptionAPI.updateSubscription({
        plan: planId,
        paymentMethod
      })
      
      if (response.data.success) {
        await fetchSubscription()
        return response.data
      }
      
      throw new Error(response.data.message || 'Failed to upgrade subscription')
    } catch (error) {
      console.error('Upgrade subscription error:', error)
      toast.error(error.response?.data?.message || 'Failed to upgrade subscription')
      throw error
    }
  }

  const cancelSubscription = async () => {
    try {
      await subscriptionAPI.cancelSubscription()
      toast.success('Subscription cancelled successfully')
      await fetchSubscription()
    } catch (error) {
      toast.error('Failed to cancel subscription')
      throw error
    }
  }

  const resumeSubscription = async () => {
    try {
      await subscriptionAPI.resumeSubscription()
      toast.success('Subscription resumed successfully')
      await fetchSubscription()
    } catch (error) {
      toast.error('Failed to resume subscription')
      throw error
    }
  }

  const value = {
    subscription,
    loading,
    features,
    plans,
    getCurrentPlan,
    hasFeature,
    getFeatureLimit,
    canUseFeature,
    getRemainingUsage,
    upgradeSubscription,
    cancelSubscription,
    resumeSubscription,
    fetchSubscription
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return context
}

export default SubscriptionContext