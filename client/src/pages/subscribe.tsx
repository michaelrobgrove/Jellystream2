import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Monitor, Zap, Shield } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ plan }: { plan: 'standard' | 'premium' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to AlfredFlix!",
        description: "Your subscription is now active. Enjoy premium streaming.",
      });
      setLocation('/dashboard');
    }
    
    setIsLoading(false);
  };

  const planDetails = {
    standard: {
      name: 'Standard',
      price: '$9.99',
      features: ['1080p HD Streaming', '2 Simultaneous Streams', 'Offline Downloads', 'Ad-Free Experience']
    },
    premium: {
      name: 'Premium',
      price: '$14.99',
      features: ['4K Ultra HD Streaming', '4 Simultaneous Streams', 'Offline Downloads', 'Ad-Free Experience', 'Early Access to New Releases']
    }
  };

  const selectedPlan = planDetails[plan];

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg alfredflix-gradient flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-lg">A</span>
            </div>
            <span className="font-serif text-2xl font-semibold alfredflix-text-gradient">
              AlfredFlix
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-white mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-zinc-400">
            Join thousands of satisfied subscribers enjoying premium entertainment
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="luxury-card border-amber-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {selectedPlan.name} Plan
                </CardTitle>
                {plan === 'premium' && (
                  <Badge className="alfredflix-gradient text-zinc-900">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold alfredflix-text-gradient">
                {selectedPlan.price}
                <span className="text-lg text-zinc-400 font-normal">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-zinc-300">
                    <Check className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-zinc-700">
                <div className="flex items-center space-x-4 text-sm text-zinc-400">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    Secure Payment
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Instant Access
                  </div>
                  <div className="flex items-center">
                    <Monitor className="w-4 h-4 mr-1" />
                    All Devices
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-white">Payment Details</CardTitle>
              <p className="text-zinc-400 text-sm">
                Secure payment powered by Stripe. Cancel anytime.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="payment-element-container">
                  <PaymentElement 
                    options={{
                      layout: 'tabs',
                      paymentMethodOrder: ['card', 'paypal', 'link']
                    }}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={!stripe || isLoading}
                  className="w-full alfredflix-gradient text-zinc-900 hover:shadow-lg transition-all duration-300 py-6 text-lg font-semibold"
                  data-testid="subscribe-button"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Start ${selectedPlan.name} Plan - ${selectedPlan.price}/month`
                  )}
                </Button>

                <p className="text-xs text-zinc-500 text-center leading-relaxed">
                  By subscribing, you agree to our Terms of Service and Privacy Policy. 
                  Your subscription will automatically renew monthly. Cancel anytime from your account settings.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm mb-4">
            Trusted by over 10,000 satisfied subscribers worldwide
          </p>
          <div className="flex items-center justify-center space-x-6 text-xs text-zinc-600">
            <span>🔒 SSL Secured</span>
            <span>💳 Stripe Protected</span>
            <span>⭐ 4.9/5 Rating</span>
            <span>🛡️ Money-Back Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [plan, setPlan] = useState<'standard' | 'premium'>('standard');

  useEffect(() => {
    // Get plan and coupon from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan') as 'standard' | 'premium';
    const couponParam = urlParams.get('coupon');
    const referralParam = urlParams.get('referral');
    
    if (planParam) {
      setPlan(planParam);
    }

    // Create subscription with coupon support
    const requestData: any = { plan: planParam || 'standard' };
    if (couponParam) requestData.coupon = couponParam;
    if (referralParam === 'true') requestData.isReferral = true;

    apiRequest("POST", "/api/create-subscription", requestData)
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Failed to create subscription:', error);
      });
  }, []);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Preparing your subscription...</p>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscribeForm plan={plan} />
    </Elements>
  );
}