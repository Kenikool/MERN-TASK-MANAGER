import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const API_BASE_URL = 'http://localhost:5000/api'

// Test payment system functionality
async function testPaymentSystem() {
  console.log('🧪 Testing Payment System...\n')

  try {
    // Test 1: Check payment service status
    console.log('1. Testing payment service status...')
    const statusResponse = await axios.get(`${API_BASE_URL}/payment/status`)
    console.log('✅ Payment status:', statusResponse.data)
    
    // Test 2: Check if Stripe is configured
    const stripeConfigured = statusResponse.data.services.stripe.configured
    const paypalConfigured = statusResponse.data.services.paypal.configured
    
    console.log(`\n2. Service Configuration:`)
    console.log(`   Stripe: ${stripeConfigured ? '✅ Configured' : '❌ Not configured'}`)
    console.log(`   PayPal: ${paypalConfigured ? '✅ Configured' : '❌ Not configured'}`)
    
    // Test 3: Check environment variables
    console.log(`\n3. Environment Variables:`)
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`)
    console.log(`   STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}`)
    console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`)
    console.log(`   PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`)
    console.log(`   PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`)
    console.log(`   CLIENT_URL: ${process.env.CLIENT_URL ? '✅ Set' : '❌ Missing'}`)
    
    // Test 4: Test database connection (if we can access user model)
    console.log(`\n4. Testing database connection...`)
    try {
      // This would require authentication, so we'll skip for now
      console.log('   ⚠️ Database test skipped (requires authentication)')
    } catch (error) {
      console.log('   ❌ Database connection failed:', error.message)
    }
    
    console.log(`\n🎉 Payment system test completed!`)
    
    // Summary
    console.log(`\n📊 Summary:`)
    console.log(`   - Payment API endpoint: ${stripeConfigured || paypalConfigured ? '✅ Working' : '❌ Issues found'}`)
    console.log(`   - Stripe integration: ${stripeConfigured ? '✅ Ready' : '❌ Needs configuration'}`)
    console.log(`   - PayPal integration: ${paypalConfigured ? '✅ Ready' : '❌ Needs configuration'}`)
    
    if (!stripeConfigured && !paypalConfigured) {
      console.log(`\n⚠️ Warning: No payment gateways are configured!`)
      console.log(`   Please check your environment variables.`)
    }
    
  } catch (error) {
    console.error('❌ Payment system test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   Make sure the backend server is running on port 5000')
    }
  }
}

// Test frontend environment variables
function testFrontendEnv() {
  console.log('\n🎨 Testing Frontend Environment...\n')
  
  // Read frontend .env file
  try {
    const fs = await import('fs')
    const frontendEnv = fs.readFileSync('./frontend/.env', 'utf8')
    
    console.log('Frontend .env file contents:')
    console.log(frontendEnv)
    
    // Check for required variables
    const requiredVars = [
      'VITE_API_URL',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_PAYPAL_CLIENT_ID'
    ]
    
    console.log('\nRequired frontend variables:')
    requiredVars.forEach(varName => {
      const hasVar = frontendEnv.includes(varName)
      console.log(`   ${varName}: ${hasVar ? '✅ Present' : '❌ Missing'}`)
    })
    
  } catch (error) {
    console.log('❌ Could not read frontend .env file:', error.message)
  }
}

// Run tests
async function runAllTests() {
  await testPaymentSystem()
  await testFrontendEnv()
  
  console.log('\n🔧 Next Steps:')
  console.log('1. Make sure backend server is running: npm run dev')
  console.log('2. Make sure frontend server is running: cd frontend && npm run dev')
  console.log('3. Test payment flow in the browser')
  console.log('4. Check browser console for any errors')
  console.log('5. Test with Stripe test cards: 4242424242424242')
}

runAllTests()