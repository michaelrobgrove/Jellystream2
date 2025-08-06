import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Crown, CreditCard, User, Shield, AlertTriangle } from 'lucide-react';

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      // TODO: Implement password change API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePlanChange = (newPlan: 'standard' | 'premium') => {
    if (newPlan === 'premium') {
      window.location.href = '/subscribe';
    } else {
      // Handle downgrade
      toast({
        title: "Contact Support",
        description: "Please contact support to downgrade your plan",
      });
    }
  };

  const handleCancelSubscription = () => {
    toast({
      title: "Contact Support",
      description: "Please contact support to cancel your subscription",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900" data-testid="account-page">
      <Navigation />
      
      <div className="container mx-auto px-4 lg:px-6 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="account-title">
              Account Settings
            </h1>
            <p className="text-zinc-400">
              Manage your AlfredFlix account, subscription, and preferences
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Information */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Username</Label>
                  <Input 
                    value={user.Name || user.username || ''} 
                    disabled 
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Email</Label>
                  <Input 
                    value={user.email || `${user.username}@alfredflix.com`} 
                    disabled 
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Account Type</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={user.planType === 'premium' ? 'default' : 'secondary'}
                      className={user.planType === 'premium' ? 'bg-amber-500 text-black' : ''}
                    >
                      {user.planType === 'premium' ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </>
                      ) : (
                        'Standard'
                      )}
                    </Badge>
                    {user.isAdmin && (
                      <Badge className="bg-red-500">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="current-password" className="text-zinc-300">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password" className="text-zinc-300">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-zinc-300">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Management */}
          <Card className="bg-zinc-800 border-zinc-700 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <CreditCard className="w-5 h-5" />
                <span>Subscription Management</span>
              </CardTitle>
              <CardDescription>Manage your AlfredFlix subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-white mb-4">Current Plan</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg">
                      <div>
                        <p className="font-medium text-white capitalize">
                          {user.planType} Plan
                        </p>
                        <p className="text-sm text-zinc-400">
                          {user.planType === 'premium' 
                            ? '$14.99/month - 4K UHD, 4 concurrent streams' 
                            : '$9.99/month - HD quality, 2 concurrent streams'
                          }
                        </p>
                      </div>
                      <Badge variant={user.planType === 'premium' ? 'default' : 'secondary'}>
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-4">Plan Options</h3>
                  <div className="space-y-3">
                    {user.planType === 'standard' ? (
                      <Button 
                        onClick={() => handlePlanChange('premium')}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handlePlanChange('standard')}
                        variant="outline"
                        className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        Downgrade to Standard
                      </Button>
                    )}
                    
                    <Separator className="bg-zinc-700" />
                    
                    <Button 
                      onClick={handleCancelSubscription}
                      variant="destructive"
                      className="w-full"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}