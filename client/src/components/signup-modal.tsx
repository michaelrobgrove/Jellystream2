import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Crown, Gift, Users } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: 'standard' | 'premium';
}

function SignupForm({ plan }: { plan: 'standard' | 'premium' }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    referralCode: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<any>(null);
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const plans = {
    standard: { name: 'Standard Plan', price: '$9.99', amount: 999 },
    premium: { name: 'Premium Plan', price: '$14.99', amount: 1499 }
  };

  const selectedPlan = plans[plan];

  // Calculate final price with discounts
  const calculateDiscountedPrice = () => {
    let amount = selectedPlan.amount;
    
    // Apply referral discount first (highest priority - $1 first month)
    if (referralValid && formData.referralCode) {
      return '$1.00';
    }
    
    // Apply coupon discount if no referral
    if (couponValid && couponDiscount && !formData.referralCode) {
      if (couponDiscount.percent_off) {
        const discountAmount = amount * (couponDiscount.percent_off / 100);
        const finalAmount = amount - discountAmount;
        return `$${(finalAmount / 100).toFixed(2)}`;
      } else if (couponDiscount.amount_off) {
        const finalAmount = Math.max(0, amount - couponDiscount.amount_off);
        return `$${(finalAmount / 100).toFixed(2)}`;
      }
    }
    
    return null;
  };

  // Update discounted price when validation states change
  useEffect(() => {
    const newPrice = calculateDiscountedPrice();
    setDiscountedPrice(newPrice);
  }, [referralValid, couponValid, couponDiscount, formData.referralCode]);

  // Show warning about pricing when discounts are applied
  useEffect(() => {
    if (referralValid || couponValid) {
      toast({
        title: "Discount Applied!",
        description: `The payment amount will be ${discountedPrice || selectedPlan.price} when you submit the form.`,
        duration: 3000,
      });
    }
  }, [referralValid, couponValid, discountedPrice, selectedPlan.price, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'referralCode') {
      // Clear coupon when referral is entered
      if (value && couponCode) {
        setCouponCode('');
        setCouponValid(null);
        setCouponDiscount(null);
      }
      
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Reset referral validation when field changes
      if (value !== formData.referralCode) {
        setReferralValid(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Clear referral when coupon is entered
    if (value && formData.referralCode) {
      setFormData(prev => ({ ...prev, referralCode: '' }));
      setReferralValid(null);
    }
    
    setCouponCode(value);
    
    // Reset coupon validation when field changes
    if (value !== couponCode) {
      setCouponValid(null);
      setCouponDiscount(null);
    }
  };

  // Debounced validation for referral code
  useEffect(() => {
    if (!formData.referralCode) {
      setReferralValid(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setValidatingReferral(true);
      try {
        const response = await apiRequest('POST', '/api/validate-referral', {
          referralCode: formData.referralCode
        });
        const result = await response.json();
        setReferralValid(result.valid);
      } catch (error) {
        setReferralValid(false);
      } finally {
        setValidatingReferral(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.referralCode]);

  // Debounced validation for coupon code
  useEffect(() => {
    if (!couponCode) {
      setCouponValid(null);
      setCouponDiscount(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setValidatingCoupon(true);
      try {
        const response = await apiRequest('POST', '/api/validate-coupon', {
          coupon: couponCode
        });
        const result = await response.json();
        setCouponValid(result.valid);
        if (result.valid && result.discount) {
          setCouponDiscount(result.discount);
        }
      } catch (error) {
        setCouponValid(false);
        setCouponDiscount(null);
      } finally {
        setValidatingCoupon(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [couponCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment system not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store signup data for after payment success
      const signupData = {
        ...formData,
        planType: plan,
        referralCode: formData.referralCode || undefined,
        couponCode: couponCode || undefined
      };
      
      sessionStorage.setItem('pendingSignup', JSON.stringify(signupData));

      // Create new payment intent with correct discounted amount
      const updateResponse = await apiRequest('POST', '/api/create-subscription', {
        plan,
        referralCode: formData.referralCode || '',
        couponCode: couponCode || ''
      });
      const updateResult = await updateResponse.json();
      
      // Use the new payment intent client secret for confirmation
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        
        // Handle specific error types
        let errorMessage = "Payment was declined or cancelled";
        if (error.type === 'card_error') {
          errorMessage = error.message || "Your card was declined";
        } else if (error.type === 'authentication_error') {
          errorMessage = "Authentication failed. Please try again";
        } else if (error.code === 'payment_intent_authentication_failure') {
          errorMessage = "Payment authentication failed";
        }
        
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Stay on form to allow retry
        return;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const finalPrice = discountedPrice || selectedPlan.price;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Selection Display */}
      <Card className="bg-zinc-800 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{selectedPlan.name}</h3>
                <p className="text-sm text-zinc-400">
                  {plan === 'standard' 
                    ? '1080p HD • 2 Streams • No Ads' 
                    : '4K Ultra HD • 4 Streams • No Ads • Early Access'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              {discountedPrice ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-end space-x-2">
                    <p className="text-xl font-bold text-amber-500">{discountedPrice}</p>
                    <p className="text-sm text-zinc-500 line-through">{selectedPlan.price}</p>
                  </div>
                  <p className="text-xs text-zinc-400">per month</p>
                  <p className="text-xs text-amber-500">
                    {referralValid && 'Referral discount applied!'}
                    {couponValid && !formData.referralCode && 'Coupon discount applied!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-amber-500">{selectedPlan.price}</p>
                  <p className="text-xs text-zinc-400">per month</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Account Information</h4>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-zinc-300">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose your username"
              className="bg-zinc-800 border-zinc-600 text-white"
              required
              data-testid="signup-username"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="bg-zinc-800 border-zinc-600 text-white"
              required
              data-testid="signup-email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              className="bg-zinc-800 border-zinc-600 text-white"
              required
              data-testid="signup-password"
            />
          </div>
        </div>
      </div>

      {/* Discounts Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Discounts (Choose One)</h4>
        
        {/* Referral Code */}
        <div>
          <Label htmlFor="referralCode" className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Referral Code (Optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="referralCode"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleInputChange}
              placeholder="Enter friend's username"
              disabled={!!couponCode}
              className={`bg-zinc-800 border-zinc-600 text-white pr-8 ${
                couponCode ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                referralValid === true ? 'border-green-500' : 
                referralValid === false ? 'border-red-500' : ''
              }`}
              data-testid="signup-referral"
            />
            {validatingReferral && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {referralValid === true && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">✓</div>
            )}
            {referralValid === false && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">✗</div>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {couponCode ? (
              <span className="text-zinc-500">Remove coupon code to use referral</span>
            ) : referralValid === true ? (
              <span className="text-green-500">Valid referral - Get your first month for $1!</span>
            ) : referralValid === false ? (
              <span className="text-red-500">Invalid referral code</span>
            ) : (
              'Get your first month for just $1 when referred by a friend!'
            )}
          </p>
        </div>

        {/* Coupon Code */}
        <div>
          <Label htmlFor="couponCode" className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-amber-500" />
            <span>Coupon Code (Optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="couponCode"
              value={couponCode}
              onChange={handleCouponChange}
              placeholder="Enter coupon code"
              disabled={!!formData.referralCode}
              className={`bg-zinc-800 border-zinc-600 text-white pr-8 ${
                formData.referralCode ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                couponValid === true ? 'border-green-500' : 
                couponValid === false ? 'border-red-500' : ''
              }`}
              data-testid="signup-coupon"
            />
            {validatingCoupon && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {couponValid === true && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">✓</div>
            )}
            {couponValid === false && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">✗</div>
            )}
          </div>
          {formData.referralCode ? (
            <p className="text-xs text-zinc-500 mt-1">Remove referral code to use coupon</p>
          ) : couponValid === true ? (
            <p className="text-xs text-green-500 mt-1">Valid coupon - Discount applied!</p>
          ) : couponValid === false ? (
            <p className="text-xs text-red-500 mt-1">Invalid coupon code</p>
          ) : null}
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Payment Information</h4>
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-600">
          <PaymentElement />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3"
        data-testid="signup-submit"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <span>Processing Payment...</span>
          </div>
        ) : (
          `Subscribe for ${finalPrice}/month`
        )}
      </Button>

      <p className="text-xs text-zinc-400 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy. Your 
        subscription will start after payment confirmation.
      </p>
    </form>
  );
}

export function SignupModal({ open, onOpenChange, plan = 'standard' }: SignupModalProps) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!open) return;

    // Create payment intent when modal opens
    const createPaymentIntent = async () => {
      try {
        // Reset client secret on each open
        setClientSecret("");
        
        const response = await apiRequest('POST', '/api/create-subscription', {
          plan
          // Note: Discounts will be applied when user enters codes
        });
        const result = await response.json();
        setClientSecret(result.clientSecret);
      } catch (error) {
        console.error('Failed to create payment intent:', error);
      }
    };

    createPaymentIntent();
  }, [open, plan]);

  if (!clientSecret) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-700 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Start Your Premium Experience
          </DialogTitle>
        </DialogHeader>
        
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SignupForm plan={plan} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}