import { updateUserSubscription } from './payment.controller.js'

// Initialize a Paystack transaction
export const initializePaystack = async (req, res) => {
  try {
    const { amount, planId } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' })
    }
    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required' })
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: req.user.email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        metadata: {
          userId: req.user.id,
          planId
        }
      })
    })

    const data = await response.json()
    if (!data.status) {
      return res.status(400).json({ success: false, message: data.message || 'Paystack initialization failed' })
    }

    return res.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference
    })
  } catch (error) {
    console.error('Paystack initialization error:', error)
    return res.status(500).json({ success: false, message: 'Failed to initialize Paystack transaction' })
  }
}

// Verify a Paystack transaction
export const verifyPaystack = async (req, res) => {
  try {
    const { reference } = req.query
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Transaction reference is required' })
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    })

    const data = await response.json()
    if (!data.status) {
      return res.status(400).json({ success: false, message: data.message })
    }

    // On success, update user subscription
    const { amount, metadata, status } = data.data
    if (status === 'success' && metadata.userId && metadata.planId) {
      await updateUserSubscription(
        metadata.userId,
        metadata.planId,
        'paystack',
        { transactionId: reference, amount: amount / 100, currency: data.data.currency }
      )
    }

    return res.json({ success: true, data: data.data })
  } catch (error) {
    console.error('Paystack verify error:', error)
    return res.status(500).json({ success: false, message: 'Failed to verify Paystack transaction' })
  }
}