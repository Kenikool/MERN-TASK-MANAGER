import React, { useState, useEffect } from 'react'
import {
  X,
  CreditCard,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { paymentAPI } from '../../utils/api'
import toast from 'react-hot-toast'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...')

const PaymentModal = ({ isOpen, onClose, plan, isAnnual, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const amount = isAnnual ? Math.round(plan.price * 12 * 0.8) : plan.price

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Plan Summary */}
          <div className="bg-base-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{plan.name} Plan</span>
              <span className="text-lg font-bold">${amount}</span>
            </div>
            <div className="text-sm text-base-content/60">
              {isAnnual ? 'Billed annually' : 'Billed monthly'}
              {isAnnual && (
                <span className="text-success ml-2">(20% savings)</span>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200">
                <input
                  type="radio"
                  name="payment-method"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio radio-primary"
                />
                <CreditCard className="w-5 h-5" />
                <span>Credit/Debit Card</span>
                <div className="ml-auto flex gap-1">
                  <img src="/visa.png" alt="Visa" className="h-6" />
                  <img src="/mastercard.png" alt="Mastercard" className="h-6" />
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200">
                <input
                  type="radio"
                  name="payment-method"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio radio-primary"
                />
                <img src="/paypal.png" alt="PayPal" className="w-5 h-5" />
                <span>PayPal</span>
              </label>
            </div>
          </div>

          {/* Payment Form */}
          <Elements stripe={stripePromise}>
            <PaymentForm
              paymentMethod={paymentMethod}
              amount={amount}
              plan={plan}
              isAnnual={isAnnual}
              onSuccess={onPaymentSuccess}
              onClose={onClose}
            />
          </Elements>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-base-content/60 mt-4">
            <Shield className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const PaymentForm = ({ paymentMethod, amount, plan, isAnnual, onSuccess, onClose }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe is not properly initialized')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        setError('Card element not found')
        return
      }
      
      // Create payment intent with planId
      const { data } = await paymentAPI.createStripePaymentIntent(amount, 'USD', plan.id)
      
      if (!data.success) {
        setError(data.message || 'Failed to create payment intent')
        return
      }
      
      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Customer Name', // You can get this from user context
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message)
      } else if (paymentIntent.status === 'succeeded') {
        await onSuccess('stripe')
        onClose()
      } else {
        setError(`Payment status: ${paymentIntent.status}`)
      }
    } catch (err) {
      console.error('Stripe payment error:', err)
      setError(err.response?.data?.message || err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePayPalPayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create PayPal order with planId
      const { data } = await paymentAPI.createPayPalOrder(amount, 'USD', plan.id)
      
      if (!data.success) {
        setError(data.message || 'Failed to create PayPal order')
        setLoading(false)
        return
      }
      
      if (!data.approvalUrl) {
        setError('PayPal approval URL not received')
        setLoading(false)
        return
      }
      
      // Redirect to PayPal
      window.location.href = data.approvalUrl
    } catch (err) {
      console.error('PayPal payment error:', err)
      setError(err.response?.data?.message || err.message || 'PayPal payment failed')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (paymentMethod === 'stripe') {
      await handleStripePayment()
    } else if (paymentMethod === 'paypal') {
      await handlePayPalPayment()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Stripe Card Element */}
      {paymentMethod === 'stripe' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Card Information
          </label>
          <div className="p-3 border border-base-300 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || (paymentMethod === 'stripe' && !stripe)}
        className="btn btn-primary w-full"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Pay ${amount} {paymentMethod === 'paypal' ? 'with PayPal' : 'with Card'}
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-base-content/60 text-center mt-4">
        By completing this purchase, you agree to our{' '}
        <a href="/terms" className="link">Terms of Service</a> and{' '}
        <a href="/privacy" className="link">Privacy Policy</a>
      </p>
    </form>
  )
}

export default PaymentModal