#!/bin/bash

echo "🚀 Installing Payment Gateway Dependencies..."

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install stripe @paypal/checkout-server-sdk

# Frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install @stripe/stripe-js @stripe/react-stripe-js

echo "✅ All payment dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your Stripe and PayPal API keys in environment variables"
echo "2. Update frontend/.env with VITE_STRIPE_PUBLISHABLE_KEY and VITE_PAYPAL_CLIENT_ID"
echo "3. Update backend/.env with STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET"
echo "4. Test the payment system with sandbox/test credentials"
echo ""
echo "See PAYMENT_GATEWAY_SETUP_GUIDE.md for detailed configuration instructions."