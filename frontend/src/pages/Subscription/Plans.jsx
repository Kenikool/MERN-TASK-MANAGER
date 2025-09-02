import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  CreditCard,
  Shield,
  Sparkles,
  Brain,
  BarChart3,
  Users,
  Clock,
  Database,
  Cpu,
  Globe
} from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'
import PaymentModal from '../../components/Payment/PaymentModal'
import toast from 'react-hot-toast'

const Plans = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { plans, subscription, upgradeSubscription, loading } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)

  const currentPlan = subscription?.plan || 'free'

  const handleSelectPlan = (planId) => {
    if (planId === 'free') {
      toast.info('You are already on the free plan')
      return
    }

    if (planId === currentPlan) {
      toast.info('You are already on this plan')
      return
    }

    setSelectedPlan(planId)
    setShowPaymentModal(true)
  }

  const handleUpgrade = async (paymentMethod) => {
    try {
      await upgradeSubscription(selectedPlan, paymentMethod)
      setShowPaymentModal(false)
      toast.success('Subscription upgraded successfully!')
    } catch (error) {
      toast.error('Failed to upgrade subscription')
    }
  }

  const getDiscountedPrice = (price) => {
    return isAnnual ? Math.round(price * 12 * 0.8) : price
  }

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'free': return <Shield className="w-8 h-8" />
      case 'basic': return <Zap className="w-8 h-8" />
      case 'pro': return <Star className="w-8 h-8" />
      case 'premium': return <Crown className="w-8 h-8" />
      default: return <Shield className="w-8 h-8" />
    }
  }

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'free': return 'text-base-content'
      case 'basic': return 'text-primary'
      case 'pro': return 'text-secondary'
      case 'premium': return 'text-accent'
      default: return 'text-base-content'
    }
  }

  const getPlanBadge = (planId) => {
    switch (planId) {
      case 'basic': return { text: 'Most Popular', color: 'badge-primary' }
      case 'pro': return { text: 'Best Value', color: 'badge-secondary' }
      case 'premium': return { text: 'Enterprise', color: 'badge-accent' }
      default: return null
    }
  }

  const featureIcons = {
    'tasks': <BarChart3 className="w-4 h-4" />,
    'projects': <Database className="w-4 h-4" />,
    'ai': <Brain className="w-4 h-4" />,
    'team': <Users className="w-4 h-4" />,
    'time': <Clock className="w-4 h-4" />,
    'api': <Cpu className="w-4 h-4" />,
    'support': <Globe className="w-4 h-4" />
  }

  return (
    <>
      <Helmet>
        <title>Subscription Plans - Task Management</title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Unlock powerful features and boost your productivity with our flexible pricing plans
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm ${!isAnnual ? 'font-semibold' : 'text-base-content/60'}`}>
              Monthly
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
            />
            <span className={`text-sm ${isAnnual ? 'font-semibold' : 'text-base-content/60'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="badge badge-success badge-sm">Save 20%</span>
            )}
          </div>
        </div>

        {/* Current Plan Info */}
        {subscription && (
          <div className="alert alert-info">
            <Sparkles className="w-5 h-5" />
            <span>
              You are currently on the <strong>{plans[currentPlan]?.name}</strong> plan.
              {subscription.status === 'cancelled' && (
                <span className="text-warning ml-2">
                  (Cancelled - expires {new Date(subscription.expiresAt).toLocaleDateString()})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(plans).map(([planId, plan]) => {
            const isCurrentPlan = planId === currentPlan
            const badge = getPlanBadge(planId)
            const price = getDiscountedPrice(plan.price)

            return (
              <div
                key={planId}
                className={`card bg-base-100 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  isCurrentPlan 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-base-300 hover:border-primary/50'
                } ${planId === 'pro' ? 'lg:scale-105' : ''}`}
              >
                <div className="card-body p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    {badge && (
                      <div className="mb-3">
                        <span className={`badge ${badge.color} badge-sm`}>
                          {badge.text}
                        </span>
                      </div>
                    )}
                    
                    <div className={`mb-3 ${getPlanColor(planId)}`}>
                      {getPlanIcon(planId)}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    
                    <div className="text-center">
                      {plan.price === 0 ? (
                        <div className="text-3xl font-bold">Free</div>
                      ) : (
                        <div>
                          <span className="text-4xl font-bold">${price}</span>
                          <span className="text-base-content/60">
                            /{isAnnual ? 'year' : 'month'}
                          </span>
                          {isAnnual && plan.price > 0 && (
                            <div className="text-sm text-success">
                              Save ${Math.round(plan.price * 12 * 0.2)}/year
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limits */}
                  <div className="space-y-2 mb-6 text-xs text-base-content/60">
                    <div className="flex justify-between">
                      <span>Tasks:</span>
                      <span>{plan.limits.tasks === -1 ? 'Unlimited' : plan.limits.tasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects:</span>
                      <span>{plan.limits.projects === -1 ? 'Unlimited' : plan.limits.projects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Requests:</span>
                      <span>{plan.limits.aiRequests === -1 ? 'Unlimited' : `${plan.limits.aiRequests}/month`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{plan.limits.storage / 1000}GB</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="card-actions">
                    {isCurrentPlan ? (
                      <button className="btn btn-outline w-full" disabled>
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </button>
                    ) : planId === 'free' ? (
                      <button 
                        className="btn btn-outline w-full"
                        onClick={() => navigate('/subscription/downgrade')}
                      >
                        Downgrade
                      </button>
                    ) : (
                      <button
                        className={`btn w-full ${
                          planId === 'pro' ? 'btn-primary' : 'btn-outline'
                        }`}
                        onClick={() => handleSelectPlan(planId)}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {currentPlan === 'free' ? 'Upgrade' : 'Change Plan'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Feature Comparison</h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th>Basic ($1)</th>
                    <th>Pro ($2)</th>
                    <th>Premium ($3)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Tasks</td>
                    <td>5</td>
                    <td>50</td>
                    <td>200</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Projects</td>
                    <td>1</td>
                    <td>5</td>
                    <td>20</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td className="font-medium">AI Requests/Month</td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td>5</td>
                    <td>25</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Time Tracking</td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td><Check className="w-4 h-4 text-success" /></td>
                    <td><Check className="w-4 h-4 text-success" /></td>
                    <td><Check className="w-4 h-4 text-success" /></td>
                  </tr>
                  <tr>
                    <td className="font-medium">Advanced Reports</td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td><Check className="w-4 h-4 text-success" /></td>
                    <td><Check className="w-4 h-4 text-success" /></td>
                  </tr>
                  <tr>
                    <td className="font-medium">API Access</td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td><X className="w-4 h-4 text-error" /></td>
                    <td><Check className="w-4 h-4 text-success" /></td>
                  </tr>
                  <tr>
                    <td className="font-medium">Team Members</td>
                    <td>1</td>
                    <td>3</td>
                    <td>10</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Storage</td>
                    <td>100MB</td>
                    <td>1GB</td>
                    <td>5GB</td>
                    <td>20GB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq-accordion" defaultChecked />
                <div className="collapse-title text-lg font-medium">
                  Can I change my plan anytime?
                </div>
                <div className="collapse-content">
                  <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be charged or credited accordingly.</p>
                </div>
              </div>

              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq-accordion" />
                <div className="collapse-title text-lg font-medium">
                  What payment methods do you accept?
                </div>
                <div className="collapse-content">
                  <p>We accept all major credit cards through Stripe and PayPal payments. All transactions are secure and encrypted.</p>
                </div>
              </div>

              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq-accordion" />
                <div className="collapse-title text-lg font-medium">
                  How do AI requests work?
                </div>
                <div className="collapse-content">
                  <p>AI requests include features like task suggestions, schedule optimization, and productivity insights. Each AI-powered action counts as one request.</p>
                </div>
              </div>

              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq-accordion" />
                <div className="collapse-title text-lg font-medium">
                  Is there a free trial?
                </div>
                <div className="collapse-content">
                  <p>Our free plan gives you access to basic features forever. You can upgrade anytime to unlock advanced features and higher limits.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={plans[selectedPlan]}
          isAnnual={isAnnual}
          onPaymentSuccess={handleUpgrade}
        />
      )}
    </>
  )
}

export default Plans