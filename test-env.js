import dotenv from 'dotenv'

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' })

// Also try loading from current directory if backend/.env doesn't exist
if (!process.env.MONGODB_URI) {
  console.log('⚠️ Trying to load from current directory...')
  dotenv.config({ path: './.env' })
}

console.log('🔍 Environment Variables Test')
console.log('================================')

console.log('\n📊 Database:')
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Missing')

console.log('\n🔐 JWT:')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing')

console.log('\n💳 Stripe:')
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing')
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Missing')
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing')

console.log('\n💰 PayPal:')
console.log('PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? 'Set' : 'Missing')
console.log('PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? 'Set' : 'Missing')
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE || 'sandbox (default)')

console.log('\n☁️ Cloudinary:')
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing')
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing')
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing')

console.log('\n🌐 Server:')
console.log('PORT:', process.env.PORT || '5000 (default)')
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'Not set')
console.log('NODE_ENV:', process.env.NODE_ENV || 'development (default)')

console.log('\n================================')
console.log('✅ Environment test complete!')