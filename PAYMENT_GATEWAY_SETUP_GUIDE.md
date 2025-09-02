# Payment Gateway Configuration Guide

## Overview

Your Task Manager application already has a complete subscription system implemented with support for both **Stripe** and **PayPal** payment gateways. This guide will help you configure the payment gateways to enable real subscription payments.

## Current Implementation Status

✅ **Already Implemented:**
- Subscription plans (Free, Basic $1, Pro $2, Premium $3)
- Payment modal with Stripe and PayPal options
- Frontend payment integration
- Backend subscription management
- User subscription tracking
- Plan feature restrictions

❌ **Needs Configuration:**
- Stripe API keys
- PayPal API credentials
- Backend payment processing endpoints
- Webhook handling

## 1. Stripe Configuration

### Step 1: Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a Stripe account
3. Complete account verification

### Step 2: Get API Keys
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy your **Publishable Key** and **Secret Key**
3. For testing, use the test keys (they start with `pk_test_` and `sk_test_`)

### Step 3: Configure Frontend Environment Variables
Update `frontend/.env`:
```env
# Replace with your actual Stripe publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
```

### Step 4: Configure Backend Environment Variables
Add to `backend/.env`:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Step 5: Create Backend Stripe Routes
Create `backend/routes/payment.route.js`:
```javascript
import express from 'express'
import Stripe from 'stripe'
import { protect } from '../middleware/auth.js'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create payment intent
router.post('/stripe/create-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user.id,
      },
    })

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Stripe webhook
router.post('/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object
      // Update user subscription in database
      console.log('PaymentIntent was successful!')
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({received: true})
})

export default router
```

## 2. PayPal Configuration

### Step 1: Create PayPal Developer Account
1. Go to [https://developer.paypal.com](https://developer.paypal.com)
2. Sign up for a developer account
3. Create a new application

### Step 2: Get API Credentials
1. Go to PayPal Developer Dashboard → My Apps & Credentials
2. Create a new app or use the default one
3. Copy your **Client ID** and **Client Secret**

### Step 3: Configure Frontend Environment Variables
Update `frontend/.env`:
```env
# Replace with your actual PayPal client ID
VITE_PAYPAL_CLIENT_ID=AQi-BQR6u4KXj7k8XVtjNvzqg9WMdtnF...
```

### Step 4: Configure Backend Environment Variables
Add to `backend/.env`:
```env
# PayPal Configuration
PAYPAL_CLIENT_ID=AQi-BQR6u4KXj7k8XVtjNvzqg9WMdtnF...
PAYPAL_CLIENT_SECRET=EHLhS0KuuSiHQK6GODdEKYvIKaVS...
PAYPAL_MODE=sandbox  # Use 'live' for production
```

### Step 5: Add PayPal Routes to Backend
Add to `backend/routes/payment.route.js`:
```javascript
import paypal from '@paypal/checkout-server-sdk'

// PayPal environment
const environment = process.env.PAYPAL_MODE === 'live' 
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)

const client = new paypal.core.PayPalHttpClient(environment)

// Create PayPal order
router.post('/paypal/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body
    
    const request = new paypal.orders.OrdersCreateRequest()
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString()
        }
      }]
    })

    const order = await client.execute(request)
    
    res.json({
      success: true,
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Capture PayPal order
router.post('/paypal/capture-order', protect, async (req, res) => {
  try {
    const { orderId } = req.body
    
    const request = new paypal.orders.OrdersCaptureRequest(orderId)
    request.requestBody({})
    
    const capture = await client.execute(request)
    
    res.json({
      success: true,
      capture: capture.result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})
```

## 3. Install Required Dependencies

### Backend Dependencies
```bash
cd backend
npm install stripe @paypal/checkout-server-sdk
```

### Frontend Dependencies
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 4. Update Backend Server Configuration

Add payment routes to `backend/server.js`:
```javascript
import paymentRoutes from './routes/payment.route.js'

// Add this line with other route imports
app.use('/api/payment', paymentRoutes)
```

## 5. Environment Variables Summary

### Frontend `.env`
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Payment Gateway Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id

# Subscription Configuration
VITE_SUBSCRIPTION_ENABLED=true
VITE_TRIAL_PERIOD_DAYS=14
```

### Backend `.env`
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Subscription Configuration
SUBSCRIPTION_ENABLED=true
TRIAL_PERIOD_DAYS=14
```

## 6. Testing the Payment System

### Test with Stripe
1. Use test card numbers:
   - **Success**: `4242424242424242`
   - **Decline**: `4000000000000002`
   - **Requires 3D Secure**: `4000002500003155`

2. Use any future expiry date and any 3-digit CVC

### Test with PayPal
1. Use PayPal sandbox accounts
2. Create test buyer and seller accounts in PayPal Developer Dashboard

## 7. Webhook Configuration

### Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payment/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook secret to your environment variables

### PayPal Webhooks
1. Go to PayPal Developer Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment/paypal/webhook`
3. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

## 8. Production Deployment

### Before Going Live:
1. **Replace test keys** with live keys
2. **Set up SSL certificate** (required for payments)
3. **Configure production webhooks**
4. **Test thoroughly** with small amounts
5. **Set up monitoring** and error tracking
6. **Implement proper logging**

### Security Considerations:
- Never expose secret keys in frontend code
- Validate all payments on the server side
- Implement proper error handling
- Use HTTPS for all payment-related requests
- Store sensitive data securely

## 9. Current Subscription Plans

Your app already has these plans configured:

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 tasks, 2 projects, 1 team member |
| **Basic** | $1/month | 50 tasks, 10 projects, 3 team members, time tracking |
| **Pro** | $2/month | 200 tasks, 50 projects, 10 team members, advanced reports |
| **Premium** | $3/month | Unlimited everything, API access |

## 10. Next Steps

1. **Get API credentials** from Stripe and PayPal
2. **Update environment variables** with real credentials
3. **Install dependencies** listed above
4. **Create payment routes** in backend
5. **Test with sandbox/test mode**
6. **Set up webhooks** for production
7. **Deploy and test** end-to-end

## Support

If you encounter issues:
- Check browser console for frontend errors
- Check server logs for backend errors
- Verify API credentials are correct
- Ensure webhooks are properly configured
- Test with different payment methods

Your subscription system is already well-implemented - you just need to configure the payment gateways with real credentials! 🚀