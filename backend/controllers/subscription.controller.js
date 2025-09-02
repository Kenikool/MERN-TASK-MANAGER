import User from '../models/User.model.js'

// Get current subscription
export const getCurrentSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscription')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Default subscription if none exists
    const defaultSubscription = {
      plan: 'free',
      status: 'active',
      startDate: new Date(),
      endDate: null,
      features: {
        maxTasks: 5,
        maxProjects: 2,
        teamMembers: 1,
        timeTracking: false,
        advancedReports: false,
        aiFeatures: false,
        apiAccess: false
      }
    }

    const subscription = user.subscription || defaultSubscription

    res.json({
      success: true,
      subscription
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    })
  }
}

// Update subscription
export const updateSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body
    
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Define plan features
    const planFeatures = {
      free: {
        maxTasks: 5,
        maxProjects: 2,
        teamMembers: 1,
        timeTracking: false,
        advancedReports: false,
        aiFeatures: false,
        apiAccess: false
      },
      basic: {
        maxTasks: 50,
        maxProjects: 10,
        teamMembers: 3,
        timeTracking: true,
        advancedReports: false,
        aiFeatures: true,
        aiRequests: 5,
        apiAccess: false
      },
      pro: {
        maxTasks: 200,
        maxProjects: 50,
        teamMembers: 10,
        timeTracking: true,
        advancedReports: true,
        aiFeatures: true,
        aiRequests: 25,
        apiAccess: true
      },
      premium: {
        maxTasks: -1, // unlimited
        maxProjects: -1, // unlimited
        teamMembers: -1, // unlimited
        timeTracking: true,
        advancedReports: true,
        aiFeatures: true,
        aiRequests: -1, // unlimited
        apiAccess: true
      }
    }

    const features = planFeatures[plan] || planFeatures.free

    // Update user subscription
    user.subscription = {
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      features,
      paymentMethod: paymentMethod || null
    }

    await user.save()

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: user.subscription
    })
  } catch (error) {
    console.error('Update subscription error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    })
  }
}

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Set subscription to free plan
    user.subscription = {
      plan: 'free',
      status: 'cancelled',
      startDate: new Date(),
      endDate: null,
      features: {
        maxTasks: 5,
        maxProjects: 2,
        teamMembers: 1,
        timeTracking: false,
        advancedReports: false,
        aiFeatures: false,
        apiAccess: false
      }
    }

    await user.save()

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: user.subscription
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    })
  }
}

// Get subscription plans
export const getPlans = async (req, res) => {
  try {
    const plans = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'forever',
        features: {
          maxTasks: 5,
          maxProjects: 2,
          teamMembers: 1,
          timeTracking: false,
          advancedReports: false,
          aiFeatures: false,
          apiAccess: false
        },
        description: 'Perfect for personal use'
      },
      basic: {
        id: 'basic',
        name: 'Basic',
        price: 1,
        interval: 'month',
        features: {
          maxTasks: 50,
          maxProjects: 10,
          teamMembers: 3,
          timeTracking: true,
          advancedReports: false,
          aiFeatures: true,
          aiRequests: 5,
          apiAccess: false
        },
        description: 'Great for small teams'
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 2,
        interval: 'month',
        features: {
          maxTasks: 200,
          maxProjects: 50,
          teamMembers: 10,
          timeTracking: true,
          advancedReports: true,
          aiFeatures: true,
          aiRequests: 25,
          apiAccess: true
        },
        description: 'Perfect for growing teams'
      },
      premium: {
        id: 'premium',
        name: 'Premium',
        price: 3,
        interval: 'month',
        features: {
          maxTasks: -1,
          maxProjects: -1,
          teamMembers: -1,
          timeTracking: true,
          advancedReports: true,
          aiFeatures: true,
          aiRequests: -1,
          apiAccess: true
        },
        description: 'For large organizations'
      }
    }

    res.json({
      success: true,
      plans
    })
  } catch (error) {
    console.error('Get plans error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    })
  }
}

// Process payment (mock implementation)
export const processPayment = async (req, res) => {
  try {
    const { plan, paymentMethod, paymentToken } = req.body
    
    // Mock payment processing
    // In a real app, you would integrate with Stripe, PayPal, etc.
    
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update subscription after successful payment
    const planFeatures = {
      basic: {
        maxTasks: 50,
        maxProjects: 10,
        teamMembers: 3,
        timeTracking: true,
        advancedReports: false,
        aiFeatures: true,
        aiRequests: 5,
        apiAccess: false
      },
      pro: {
        maxTasks: 200,
        maxProjects: 50,
        teamMembers: 10,
        timeTracking: true,
        advancedReports: true,
        aiFeatures: true,
        aiRequests: 25,
        apiAccess: true
      },
      premium: {
        maxTasks: -1,
        maxProjects: -1,
        teamMembers: -1,
        timeTracking: true,
        advancedReports: true,
        aiFeatures: true,
        aiRequests: -1,
        apiAccess: true
      }
    }

    user.subscription = {
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      features: planFeatures[plan],
      paymentMethod,
      lastPayment: {
        amount: plan === 'basic' ? 1 : plan === 'pro' ? 2 : 3,
        date: new Date(),
        method: paymentMethod,
        transactionId: `txn_${Date.now()}`
      }
    }

    await user.save()

    res.json({
      success: true,
      message: 'Payment processed successfully',
      subscription: user.subscription
    })
  } catch (error) {
    console.error('Process payment error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed',
      error: error.message 
    })
  }
}