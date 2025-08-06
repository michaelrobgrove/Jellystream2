import { useState } from 'react';
import { Crown, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      await login(username, password);
      onOpenChange(false);
      setUsername('');
      setPassword('');
      
      toast({
        title: "Welcome Back",
        description: "Successfully signed in to your cinematic sanctuary.",
      });
    } catch (error) {
      setError('Invalid username or password. Please try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md luxury-card animate-scale-in" data-testid="auth-modal">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full alfredflix-gradient flex items-center justify-center">
            <Crown className="text-zinc-900 w-8 h-8" />
          </div>
          <DialogTitle className="font-serif text-2xl font-semibold" data-testid="auth-modal-title">
            Welcome Back
          </DialogTitle>
          <p className="text-zinc-400" data-testid="auth-modal-subtitle">
            Access your cinematic sanctuary
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700/50 focus:ring-amber-500/50"
              data-testid="input-username"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700/50 focus:ring-amber-500/50 pr-10"
                data-testid="input-password"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="toggle-password-visibility"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-zinc-400" />
                ) : (
                  <Eye className="h-4 w-4 text-zinc-400" />
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" data-testid="auth-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 alfredflix-gradient text-zinc-900 font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            data-testid="submit-login"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
