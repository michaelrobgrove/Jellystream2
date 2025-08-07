import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clear any pending signup data since payment was cancelled
    sessionStorage.removeItem('pendingSignup');
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-zinc-800 border-zinc-700">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Your payment was cancelled. No charges were made to your account.
            You can try again at any time.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation('/')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              data-testid="return-home-button"
            >
              Return to Home
            </Button>
            
            <Button 
              onClick={() => setLocation('/#pricing')}
              variant="outline"
              className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              data-testid="view-plans-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Plans Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}