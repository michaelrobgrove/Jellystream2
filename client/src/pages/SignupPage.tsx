// Updated client/src/pages/SignupPage.tsx
import { useState, Suspense } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useLocation } from 'wouter';
import ErrorBoundary, { PaymentErrorFallback, PaymentLoading } from '@/components/ErrorBoundary';
import PaymentForm from '@/components/PaymentForm';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const plans = {
  standard: {
    name: 'Standard',
    price: 9.99,
    description: 'Perfect for individual streaming',
    features: [
      'HD streaming quality',
      'Access to movies and TV shows',
      'Stream on 2 devices',
      'Cancel anytime'
    ],
    icon: Star,
    popular: false
  },
  premium: {
    name: 'Premium',
    price: 14.99,
    description: 'Best for families and 4K lovers',
    features: [
      'Ultra HD (4K) streaming',
      'Access to all content including UHD',
      'Stream on 4 devices',
      'Priority customer support',
      'Cancel anytime'
    ],
    icon: Crown,
    popular: true
  }
};

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePlanSelect = (plan: 'standard' | 'premium') => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    // Redirect to login page after successful signup
    setLocation('/login?signup=success');
  };

  const handleCancel = () => {
    setShowPayment(false);
    setSelectedPlan(null);
  };

  const handleBackHome = () => {
    setLocation('/');
  };

  // Plan selection view
  if (!showPayment || !selectedPlan) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-amber-500">AlfredFlix</span> Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start your streaming journey today. No contracts, cancel anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
            {Object.entries(plans).map(([key, plan]) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={key} 
                  className={`relative bg-gray-900 border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                    plan.popular 
                      ? 'border-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handlePlanSelect(key as 'standard' | 'premium')}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black font-bold">
                      <Zap className="w-3 h-3 mr-1" />
                      MOST POPULAR
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${
                        plan.popular ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-800 text-gray-400'
                      }`}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-400 text-lg">/month</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-gray-300">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full text-lg py-6 font-semibold transition-all duration-300 ${
                        plan.popular
                          ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg hover:shadow-xl'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      Choose {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features comparison */}
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-6">Why Choose AlfredFlix?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-amber-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                <h4 className="font-semibold mb-2">Fast Streaming</h4>
                <p className="text-gray-400 text-sm">
                  Lightning-fast servers for buffer-free streaming
                </p>
              </div>
              
              <div>
                <div className="bg-blue-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-semibold mb-2">Premium Content</h4>
                <p className="text-gray-400 text-sm">
                  Extensive library of movies and TV shows
                </p>
              </div>
              
              <div>
                <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="font-semibold mb-2">No Contracts</h4>
                <p className="text-gray-400 text-sm">
                  Cancel anytime, no hidden fees
                </p>
              </div>
            </div>
          </div>

          {/* Back button */}
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleBackHome}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment view with error boundary
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <ErrorBoundary fallback={<PaymentErrorFallback retry={handleCancel} />}>
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
          {/* Plan Summary */}
          <div className="order-2 lg:order-1">
            <Card className="bg-gray-900 border-gray-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
                <CardDescription className="text-gray-400">
                  You're signing up for AlfredFlix {plans[selectedPlan].name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      {selectedPlan === 'premium' ? (
                        <Crown className="w-6 h-6 text-amber-500" />
                      ) : (
                        <Star className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {plans[selectedPlan].name} Plan
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {plans[selectedPlan].description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-medium text-white mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {plans[selectedPlan].features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4 text-center">
                    <p className="text-sm text-gray-400 mb-2">Starting at</p>
                    <p className="text-3xl font-bold text-white">
                      ${plans[selectedPlan].price}/month
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Cancel anytime • No setup fees • Secure payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <Suspense fallback={<PaymentLoading message="Loading payment form..." />}>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  plan={selectedPlan}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                />
              </Elements>
            </Suspense>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}