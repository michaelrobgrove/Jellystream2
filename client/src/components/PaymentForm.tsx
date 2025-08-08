import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, CreditCard, Tag, Users } from 'lucide-react';

interface PaymentFormProps {
  plan: 'standard' | 'premium';
  onSuccess: () => void;
  onCancel: () => void;
}

interface DiscountDetails {
  type: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  description: string;
}

export default function PaymentForm({ plan, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    couponCode: ''
  });
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Discount state
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralMessage, setReferralMessage] = useState('');
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [discountDetails, setDiscountDetails] = useState<DiscountDetails | null>(null);
  
  // Price calculation
  const basePrice = plan === 'premium' ? 14.99 : 9.99;
  const finalPrice = discountDetails ? discountDetails.finalAmount / 100 : basePrice;

  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#fff',
        backgroundColor: '#1f1f1f',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#f59e0b',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      setReferralMessage('');
      return;
    }

    try {
      const response = await fetch('/api/validate-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      });
      
      const data = await response.json();
      setReferralValid(data.valid);
      setReferralMessage(data.message);
    } catch (error) {
      setReferralValid(false);
      setReferralMessage('Error validating referral code');
    }
  };

  const validateCouponCode = async (code: string) => {
    if (!code.trim()) {
      setCouponValid(null);
      setCouponMessage('');
      return;
    }

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon: code })
      });
      
      const data = await response.json();
      setCouponValid(data.valid);
      setCouponMessage(data.message);
    } catch (error) {
      setCouponValid(false);
      setCouponMessage('Error validating coupon code');
    }
  };

  // Update pricing when discounts change
  useEffect(() => {
    const updatePricing = async () => {
      if (formData.referralCode || formData.couponCode) {
        try {
          const response = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              plan,
              referralCode: formData.referralCode,
              couponCode: formData.couponCode
            })
          });
          
          const data = await response.json();
          if (data.discountDetails) {
            setDiscountDetails(data.discountDetails);
          } else {
            setDiscountDetails(null);
          }
        } catch (error) {
          console.error('Error calculating discount:', error);
          setDiscountDetails(null);
        }
      } else {
        setDiscountDetails(null);
      }
    };

    // Only update if we have valid codes
    if ((formData.referralCode && referralValid) || (formData.couponCode && couponValid)) {
      updatePricing();
    }
  }, [formData.referralCode, formData.couponCode, referralValid, couponValid, plan]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Handle special validation for referral and coupon codes
    if (field === 'referralCode') {
      validateReferralCode(value);
    } else if (field === 'couponCode') {
      validateCouponCode(value);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    // Validate form
    if (!validateForm()) {
      setError('Please correct the errors above');
      return;
    }

    setLoading(true);
    setError('');
    setPaymentProcessing(true);

    try {
      // Create payment intent with discount information
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan,
          referralCode: formData.referralCode,
          couponCode: formData.couponCode
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment setup failed');
      }

      const { clientSecret } = data;

      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Handle zero-amount payments (free subscriptions)
      const paymentAmount = discountDetails?.finalAmount || (basePrice * 100);
      
      if (paymentAmount === 0) {
        // For free subscriptions, we still need to confirm but with no actual payment
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: formData.email,
            }
          }
        });

        if (confirmError) {
          throw new Error(confirmError.message || 'Payment confirmation failed');
        }

        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.amount === 0)) {
          await completeSignup(paymentIntent.id);
        } else {
          throw new Error('Payment was not successful');
        }
      } else {
        // Standard payment confirmation
        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: formData.email,
            }
          }
        });

        if (paymentError) {
          throw new Error(paymentError.message || 'Payment failed');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          await completeSignup(paymentIntent.id);
        } else {
          throw new Error('Payment was not successful');
        }
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setPaymentProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (paymentIntentId: string) => {
    try {
      const response = await fetch('/api/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          planType: plan,
          referralCode: formData.referralCode,
          couponCode: formData.couponCode,
          paymentIntentId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Account creation failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('Signup completion error:', err);
      throw new Error(err.message || 'Failed to create account');
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Account Created!</h3>
            <p className="text-gray-400 mb-4">
              Welcome to AlfredFlix! Check your email for login details.
            </p>
            <p className="text-sm text-green-400">
              Redirecting to login...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-center">
          Create Your {plan === 'premium' ? 'Premium' : 'Standard'} Account
        </CardTitle>
        <CardDescription className="text-gray-400 text-center">
          Sign up for AlfredFlix streaming service
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={loading}
              />
              {validationErrors.username && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.username}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create password"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
              />
              {validationErrors.password && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
              />
              {validationErrors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Discount Codes */}
          <div className="space-y-3 border-t border-gray-700 pt-4">
            <div>
              <Label htmlFor="referralCode" className="text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Referral Code (Optional)
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code for $1 first month"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.referralCode}
                onChange={(e) => handleInputChange('referralCode', e.target.value)}
                disabled={loading}
              />
              {referralMessage && (
                <div className={`flex items-center gap-2 text-sm mt-1 ${
                  referralValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {referralValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {referralMessage}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="couponCode" className="text-white flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Coupon Code (Optional)
              </Label>
              <Input
                id="couponCode"
                type="text"
                placeholder="Enter coupon code"
                className="bg-gray-800 border-gray-700 text-white"
                value={formData.couponCode}
                onChange={(e) => handleInputChange('couponCode', e.target.value)}
                disabled={loading || (formData.referralCode && referralValid)} // Disable if referral is applied
              />
              {couponMessage && (
                <div className={`flex items-center gap-2 text-sm mt-1 ${
                  couponValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {couponValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {couponMessage}
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-3 border-t border-gray-700 pt-4">
            <Label className="text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Information
            </Label>
            <div className="p-3 bg-gray-800 border border-gray-700 rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">
                {plan === 'premium' ? 'Premium' : 'Standard'} Plan
              </span>
              {discountDetails ? (
                <div className="text-right">
                  <div className="text-gray-400 line-through text-sm">
                    ${(discountDetails.originalAmount / 100).toFixed(2)}
                  </div>
                  <div className="text-green-400 font-bold">
                    ${(discountDetails.finalAmount / 100).toFixed(2)}
                  </div>
                </div>
              ) : (
                <span className="text-white font-bold">${basePrice.toFixed(2)}</span>
              )}
            </div>
            {discountDetails && (
              <div className="text-sm text-green-400 mt-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {discountDetails.description}
                <span className="text-green-300">
                  (Save ${(discountDetails.discountAmount / 100).toFixed(2)})
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              First month billing. Recurring monthly thereafter.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3"
              disabled={!stripe || loading || paymentProcessing}
            >
              {paymentProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </div>
              ) : loading ? (
                'Creating Account...'
              ) : (
                `Pay ${finalPrice === 0 ? 'Free' : `${finalPrice.toFixed(2)}`} - Start Streaming`
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
              disabled={loading || paymentProcessing}
            >
              Cancel
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-gray-500 text-center">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>Powered by Stripe</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}