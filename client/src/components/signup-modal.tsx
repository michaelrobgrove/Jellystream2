import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Crown, Gift, Users } from 'lucide-react';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: 'standard' | 'premium';
}

export function SignupModal({ open, onOpenChange, plan = 'standard' }: SignupModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    referralCode: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user account with referral
      const response = await apiRequest('POST', '/api/register', {
        ...formData,
        planType: plan
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Account Created!",
          description: formData.referralCode 
            ? "Welcome! Your referral bonus has been applied. Redirecting to payment..."
            : "Welcome to AlfredFlix! Redirecting to payment...",
        });

        // Redirect to subscription page with coupon
        const params = new URLSearchParams({
          plan,
          ...(couponCode && { coupon: couponCode }),
          ...(formData.referralCode && { referral: 'true' })
        });
        
        window.location.href = `/subscribe?${params.toString()}`;
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const planDetails = {
    standard: { name: 'Standard', price: '$9.99', originalPrice: '$9.99' },
    premium: { name: 'Premium', price: '$14.99', originalPrice: '$14.99' }
  };

  const selectedPlan = planDetails[plan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded alfredflix-gradient flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-sm">A</span>
            </div>
            <span>Start Your Premium Experience</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Selection Display */}
          <Card className="luxury-card border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {plan === 'premium' && <Crown className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="font-semibold">{selectedPlan.name} Plan</p>
                    <p className="text-sm text-zinc-400">
                      {plan === 'standard' 
                        ? '1080p HD • 2 Streams • No Ads' 
                        : '4K Ultra HD • 4 Streams • No Ads • Early Access'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold alfredflix-text-gradient">{selectedPlan.price}</p>
                  <p className="text-xs text-zinc-400">per month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-600 text-white"
                required
                data-testid="signup-username"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-600 text-white"
                required
                data-testid="signup-email"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="bg-zinc-800 border-zinc-600 text-white"
                required
                data-testid="signup-password"
              />
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <Label htmlFor="referralCode" className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Referral Code (Optional)</span>
            </Label>
            <Input
              id="referralCode"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleInputChange}
              placeholder="Enter friend's username"
              className="bg-zinc-800 border-zinc-600 text-white"
              data-testid="signup-referral"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Get your first month for just $1 when referred by a friend!
            </p>
          </div>

          {/* Coupon Code */}
          <div>
            <Label htmlFor="couponCode" className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>Coupon Code (Optional)</span>
            </Label>
            <Input
              id="couponCode"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="bg-zinc-800 border-zinc-600 text-white"
              data-testid="signup-coupon"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full alfredflix-gradient text-zinc-900 hover:shadow-lg transition-all duration-300 py-6 text-lg font-semibold"
            data-testid="signup-submit"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              `Continue to Payment - ${selectedPlan.price}/month`
            )}
          </Button>

          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            Your subscription will start after payment confirmation.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}