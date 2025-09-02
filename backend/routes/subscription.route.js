import express from 'express'
import {
  getCurrentSubscription,
  updateSubscription,
  cancelSubscription,
  getPlans,
  processPayment
} from '../controllers/subscription.controller.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Get current subscription
router.get('/current', protect, getCurrentSubscription)

// Get available plans
router.get('/plans', getPlans)

// Update subscription
router.put('/update', protect, updateSubscription)

// Cancel subscription
router.post('/cancel', protect, cancelSubscription)

// Process payment
router.post('/payment', protect, processPayment)

export default router