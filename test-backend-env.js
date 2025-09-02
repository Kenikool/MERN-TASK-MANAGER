import dotenv from 'dotenv'

// Test loading environment variables the same way the server does
console.log('🧪 Testing Backend Environment Loading')
console.log('=====================================')

// Load from root directory (same as server)
dotenv.config({ path: '../.env' })

console.log('\n📊 Environment Variables Status:')
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set')
console.log('- PORT:', process.env.PORT || 'not set')
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set ✅' : 'Missing ❌')
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌')

console.log('\n💳 Stripe Configuration:')
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set ✅' : 'Missing ❌')
console.log('- STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'Set ✅' : 'Missing ❌')
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set ✅' : 'Missing ❌')

console.log('\n💰 PayPal Configuration:')
console.log('- PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? 'Set ✅' : 'Missing ❌')
console.log('- PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌')
console.log('- PAYPAL_MODE:', process.env.PAYPAL_MODE || 'sandbox (default)')

console.log('\n☁️ Cloudinary Configuration:')
console.log('- CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set ✅' : 'Missing ❌')
console.log('- CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set ✅' : 'Missing ❌')
console.log('- CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set ✅' : 'Missing ❌')

console.log('\n🔍 Current Working Directory:', process.cwd())
console.log('📁 Looking for .env at:', '../.env')

console.log('\n=====================================')
console.log('✅ Backend environment test complete!')

// Test if we can initialize payment services
console.log('\n🧪 Testing Payment Service Initialization:')

try {
  // Test Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('✅ Stripe credentials available - service can initialize')
  } else {
    console.log('❌ Stripe credentials missing - service will fail')
  }

  // Test PayPal
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    console.log('✅ PayPal credentials available - service can initialize')
  } else {
    console.log('❌ PayPal credentials missing - service will fail')
  }
} catch (error) {
  console.error('❌ Error testing payment services:', error.message)
}