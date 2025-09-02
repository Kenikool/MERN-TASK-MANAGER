import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getPaymentStatus,
  createStripePaymentIntent,
  confirmStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  getPaymentHistory,
  refundPayment,
  handleStripeWebhook,
  handlePayPalWebhook
} from '../controllers/payment.controller.js'

import {
  initializePaystack,
  verifyPaystack
} from '../controllers/paystack.controller.js'

const router = express.Router()
// Paystack routes
router.post('/paystack/initialize', protect, initializePaystack)
router.get('/paystack/verify', protect, verifyPaystack)

// existing routes


// Test endpoint to check payment service status
router.get('/status', getPaymentStatus)

// Create Stripe payment intent
router.post('/stripe/create-intent', protect, createStripePaymentIntent)

// Confirm Stripe payment
router.post('/stripe/confirm', protect, confirmStripePayment)

// Create PayPal order
router.post('/paypal/create-order', protect, createPayPalOrder)

// Capture PayPal order
router.post('/paypal/capture-order', protect, capturePayPalOrder)

// Get payment history
router.get('/history', protect, getPaymentHistory)

// Refund payment (admin only)
router.post('/refund', protect, refundPayment)

// Stripe webhook handler
router.post('/stripe/webhook', express.raw({type: 'application/json'}), handleStripeWebhook)

// PayPal webhook handler
router.post('/paypal/webhook', express.raw({type: 'application/json'}), handlePayPalWebhook)



export default router