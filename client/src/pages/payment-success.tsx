import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Crown, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        // Get payment intent from URL
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntentId = urlParams.get('payment_intent');
        const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
        
        if (!paymentIntentId) {
          throw new Error('Payment information not found');
        }

        // Get pending signup data
        const pendingSignupData = sessionStorage.getItem('pendingSignup');
        if (!pendingSignupData) {
          throw new Error('Signup information not found');
        }

        const signupData = JSON.parse(pendingSignupData);
        
        // Create user account now that payment succeeded
        const response = await apiRequest('POST', '/api/complete-signup', {
          ...signupData,
          paymentIntentId,
          paymentIntentClientSecret
        });

        const result = await response.json();
        
        if (result.success) {
          // Clear pending signup data
          sessionStorage.removeItem('pendingSignup');
          
          toast({
            title: "Welcome to AlfredFlix!",
            description: "Your account has been created and your subscription is active.",
          });
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            setLocation('/dashboard');
          }, 2000);
        } else {
          throw new Error(result.message || 'Account creation failed');
        }
      } catch (error: any) {
        console.error('Payment success processing error:', error);
        setError(error.message);
        
        toast({
          title: "Account Setup Error",
          description: "Payment succeeded but account creation failed. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentSuccess();
  }, [setLocation, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full bg-zinc-800 border-red-500/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">✗</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Setup Error</h1>
            <p className="text-zinc-400 mb-6">{error}</p>
            <p className="text-sm text-zinc-500">
              Your payment was successful. Please contact support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full bg-zinc-800 border-green-500/20">
        <CardContent className="p-8 text-center">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Setting Up Your Account</h1>
              <p className="text-zinc-400 mb-6">
                Payment successful! We're creating your account and setting up your subscription...
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Welcome to AlfredFlix!</h1>
              <p className="text-zinc-400 mb-6">
                Your account has been created and your subscription is now active. 
                Redirecting you to your dashboard...
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="text-amber-500 font-semibold">Premium Access Activated</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}