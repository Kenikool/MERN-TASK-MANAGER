# 🔗 Webhook Setup Guide

This guide will help you set up webhooks for payment processing with Stripe and PayPal.

## 🎯 What are Webhooks?

Webhooks are HTTP callbacks that payment providers send to your server when events occur (like successful payments). They ensure your application stays synchronized with payment status changes.

## 🔧 Stripe Webhook Setup

### 1. **Create Stripe Account**
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Sign up or log in to your account

### 2. **Get API Keys**
- Navigate to **Developers > API Keys**
- Copy your **Publishable Key** and **Secret Key**
- Add to your `.env` file:
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. **Create Webhook Endpoint**
- Go to **Developers > Webhooks**
- Click **Add endpoint**
- Enter your endpoint URL: `https://yourdomain.com/api/payment/stripe/webhook`
- Select events to listen for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 4. **Get Webhook Secret**
- After creating the webhook, click on it
- Copy the **Signing secret**
- Add to your `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. **Test Webhook (Development)**
For local development, use Stripe CLI:
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payment/stripe/webhook
```

## 💰 PayPal Webhook Setup

### 1. **Create PayPal Developer Account**
- Go to [PayPal Developer](https://developer.paypal.com)
- Sign up or log in

### 2. **Create Application**
- Go to **My Apps & Credentials**
- Click **Create App**
- Choose **Default Application**
- Select **Sandbox** for testing

### 3. **Get API Credentials**
- Copy **Client ID** and **Client Secret**
- Add to your `.env` file:
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

### 4. **Create Webhook**
- In PayPal Developer Dashboard, go to **Webhooks**
- Click **Create Webhook**
- Enter webhook URL: `https://yourdomain.com/api/payment/paypal/webhook`
- Select events:
  - `PAYMENT.CAPTURE.COMPLETED`
  - `PAYMENT.CAPTURE.DENIED`
  - `BILLING.SUBSCRIPTION.CREATED`
  - `BILLING.SUBSCRIPTION.CANCELLED`

### 5. **Webhook Verification**
PayPal webhooks include verification headers. Your endpoint should verify the webhook signature.

## 🚀 Local Development Setup

### 1. **Environment Variables**
Create a `.env` file in your backend directory:
```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Application URLs
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

### 2. **Ngrok for Local Webhooks**
For local testing, use ngrok to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 5000

# Use the ngrok URL for webhook endpoints
# Example: https://abc123.ngrok.io/api/payment/stripe/webhook
```

### 3. **Test Webhook Endpoints**
Test your webhook endpoints:
```bash
# Test Stripe webhook
curl -X POST http://localhost:5000/api/payment/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Test PayPal webhook
curl -X POST http://localhost:5000/api/payment/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## 🔒 Production Setup

### 1. **Secure Webhook Endpoints**
- Always verify webhook signatures
- Use HTTPS for all webhook URLs
- Implement rate limiting
- Log all webhook events

### 2. **Environment Configuration**
```env
# Production Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production PayPal
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_MODE=live

# Production URLs
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com
```

### 3. **Webhook URLs**
- Stripe: `https://api.yourdomain.com/api/payment/stripe/webhook`
- PayPal: `https://api.yourdomain.com/api/payment/paypal/webhook`

## 🧪 Testing Webhooks

### 1. **Stripe Test Cards**
Use Stripe test cards for testing:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`

### 2. **PayPal Sandbox**
Use PayPal sandbox accounts for testing:
- Create test buyer and seller accounts
- Use sandbox credentials for testing

### 3. **Webhook Testing Tools**
- [Webhook.site](https://webhook.site) - Test webhook endpoints
- [ngrok](https://ngrok.com) - Expose local server
- [Postman](https://postman.com) - Test API endpoints

## 🔍 Troubleshooting

### Common Issues:

1. **503 Service Unavailable**
   - Check if payment credentials are configured
   - Verify environment variables are loaded
   - Check server logs for specific errors

2. **Webhook Signature Verification Failed**
   - Ensure webhook secret is correct
   - Check that raw body is used for verification
   - Verify webhook endpoint URL

3. **CORS Issues**
   - Add webhook URLs to CORS whitelist
   - Ensure proper headers are set

4. **Timeout Issues**
   - Implement proper error handling
   - Add retry logic for failed webhooks
   - Use queue system for processing

## 📚 Additional Resources

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [PayPal Webhook Documentation](https://developer.paypal.com/docs/api/webhooks/)
- [Webhook Security Best Practices](https://stripe.com/docs/webhooks/best-practices)

## 🆘 Need Help?

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Test with webhook testing tools
4. Check payment provider documentation
5. Contact support if needed

---

**Note**: Always use test/sandbox credentials during development and switch to live credentials only in production.