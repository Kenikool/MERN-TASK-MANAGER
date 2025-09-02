import Stripe from 'stripe'
import checkoutSdk from '@paypal/checkout-server-sdk'
import User from '../models/User.model.js'

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
// Initialize PayPal SDK
const { core, orders } = checkoutSdk

// Initialize PayPal
const paypalEnvironment = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  ? (process.env.PAYPAL_MODE === 'live' 
      ? new core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET))
  : null

const paypalClient = paypalEnvironment ? new core.PayPalHttpClient(paypalEnvironment) : null

// Get payment service status
export const getPaymentStatus = (req, res) => {
  res.json({
    success: true,
    services: {
      stripe: {
        configured: !!stripe,
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      },
      paypal: {
        configured: !!paypalClient,
        hasClientId: !!process.env.PAYPAL_CLIENT_ID,
        hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.PAYPAL_MODE || 'sandbox'
      }
    }
  })
}

// Create Stripe payment intent
export const createStripePaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Please configure STRIPE_SECRET_KEY in environment variables.'
      })
    }

    const { amount, currency = 'USD', planId } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      })
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user.id,
        planId: planId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    console.error('Stripe payment intent creation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    })
  }
}

// Confirm Stripe payment
export const confirmStripePayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured'
      })
    }

    const { paymentIntentId } = req.body
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      })
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status === 'succeeded') {
      // Update user subscription
      const planId = paymentIntent.metadata.planId
      if (planId && planId !== 'unknown') {
        await updateUserSubscription(req.user.id, planId, 'stripe', {
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        })
      }
      
      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        paymentIntent
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: paymentIntent.status
      })
    }
  } catch (error) {
    console.error('Stripe payment confirmation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment'
    })
  }
}

// Create PayPal order
export const createPayPalOrder = async (req, res) => {
  try {
    if (!paypalClient) {
      console.log('⚠️ PayPal not configured - missing credentials')
      return res.status(503).json({
        success: false,
        message: 'PayPal is not configured. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in environment variables.',
        details: {
          hasClientId: !!process.env.PAYPAL_CLIENT_ID,
          hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
          mode: process.env.PAYPAL_MODE || 'sandbox'
        }
      })
    }

    const { amount, currency = 'USD', planId } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      })
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      })
    }

    const request = new orders.OrdersCreateRequest()
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString()
        },
        description: `Task Manager ${planId} Plan Subscription`,
        custom_id: `${req.user.id}|${planId}`
      }],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/subscription/success`,
        cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
        brand_name: 'Task Manager Pro',
        user_action: 'PAY_NOW'
      }
    })

    const order = await paypalClient.execute(request)
    
    res.json({
      success: true,
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href
    })
  } catch (error) {
    console.error('PayPal order creation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create PayPal order'
    })
  }
}

// Capture PayPal order
export const capturePayPalOrder = async (req, res) => {
  try {
    if (!paypalClient) {
      return res.status(503).json({
        success: false,
        message: 'PayPal is not configured'
      })
    }

    const { orderId, planId } = req.body
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      })
    }
    
    const request = new orders.OrdersCaptureRequest(orderId)
    request.requestBody({})
    
    const capture = await paypalClient.execute(request)
    
    if (capture.result.status === 'COMPLETED') {
      // Update user subscription
      if (planId) {
        await updateUserSubscription(req.user.id, planId, 'paypal', {
          transactionId: capture.result.id,
          amount: parseFloat(capture.result.purchase_units[0].amount.value),
          currency: capture.result.purchase_units[0].amount.currency_code
        })
      }
      
      res.json({
        success: true,
        message: 'Payment captured successfully',
        capture: capture.result
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment capture failed',
        status: capture.result.status
      })
    }
  } catch (error) {
    console.error('PayPal capture error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to capture PayPal payment'
    })
  }
}

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    
    const user = await User.findById(req.user.id).select('subscription')
    
    if (!user || !user.subscription || !user.subscription.paymentHistory) {
      return res.json({
        success: true,
        payments: [],
        total: 0,
        page: parseInt(page),
        totalPages: 0
      })
    }

    const payments = user.subscription.paymentHistory || []
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const paginatedPayments = payments.slice(startIndex, endIndex)

    res.json({
      success: true,
      payments: paginatedPayments,
      total: payments.length,
      page: parseInt(page),
      totalPages: Math.ceil(payments.length / limit)
    })
  } catch (error) {
    console.error('Get payment history error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment history'
    })
  }
}

// Refund payment (admin only)
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason = 'requested_by_customer' } = req.body
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      })
    }

    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured'
      })
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if specified
      reason
    })

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund
    })
  } catch (error) {
    console.error('Refund error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    })
  }
}

// Helper function to update user subscription
async function updateUserSubscription(userId, planId, paymentMethod, paymentDetails = {}) {
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
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

    const features = planFeatures[planId] || planFeatures.free
    const planPrices = { free: 0, basic: 1, pro: 2, premium: 3 }

    // Initialize subscription if it doesn't exist
    if (!user.subscription) {
      user.subscription = {
        paymentHistory: []
      }
    }

    // Update subscription
    user.subscription.plan = planId
    user.subscription.status = 'active'
    user.subscription.startDate = new Date()
    user.subscription.endDate = planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    user.subscription.features = features
    user.subscription.paymentMethod = paymentMethod

    // Add payment to history
    if (paymentMethod !== 'free' && paymentDetails.transactionId) {
      const paymentRecord = {
        transactionId: paymentDetails.transactionId,
        amount: paymentDetails.amount || planPrices[planId] || 0,
        currency: paymentDetails.currency || 'USD',
        method: paymentMethod,
        planId,
        date: new Date(),
        status: 'completed'
      }

      if (!user.subscription.paymentHistory) {
        user.subscription.paymentHistory = []
      }
      user.subscription.paymentHistory.unshift(paymentRecord)

      // Keep only last 50 payment records
      if (user.subscription.paymentHistory.length > 50) {
        user.subscription.paymentHistory = user.subscription.paymentHistory.slice(0, 50)
      }
    }

    await user.save()
    console.log(`Subscription updated for user ${userId} to plan ${planId}`)
    
    return user.subscription
  } catch (error) {
    console.error('Update subscription error:', error)
    throw error
  }
}

// Stripe webhook handler
export const handleStripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Stripe webhook not configured')
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('PaymentIntent succeeded:', paymentIntent.id)
        
        // Update subscription if metadata contains planId
        if (paymentIntent.metadata.userId && paymentIntent.metadata.planId) {
          await updateUserSubscription(
            paymentIntent.metadata.userId, 
            paymentIntent.metadata.planId, 
            'stripe',
            {
              transactionId: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency
            }
          )
        }
        break
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('PaymentIntent failed:', failedPayment.id)
        break
        
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return res.status(500).send('Webhook processing failed')
  }

  res.json({received: true})
}

// PayPal webhook handler
export const handlePayPalWebhook = async (req, res) => {
  try {
    if (!paypalClient) {
      return res.status(503).send('PayPal webhook not configured')
    }

    const event = req.body
    console.log('PayPal webhook received:', event.event_type)

    // Handle different PayPal events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const payment = event.resource
        console.log('PayPal payment completed:', payment.id)
        
        // Extract user info from payment metadata if available
        if (payment.custom_id) {
          const [userId, planId] = payment.custom_id.split('|')
          if (userId && planId) {
            await updateUserSubscription(userId, planId, 'paypal', {
              transactionId: payment.id,
              amount: parseFloat(payment.amount.value),
              currency: payment.amount.currency_code
            })
          }
        }
        break
        
      case 'PAYMENT.CAPTURE.DENIED':
        console.log('PayPal payment denied:', event.resource.id)
        break
        
      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`)
    }

    res.json({received: true})
  } catch (error) {
    console.error('PayPal webhook processing error:', error)
    res.status(500).send('PayPal webhook processing failed')
  }
}

export { updateUserSubscription }