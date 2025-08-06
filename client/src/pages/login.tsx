import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Navigation } from '@/components/navigation';
import { AuthModal } from '@/components/auth-modal';
import { useAuth } from '@/hooks/use-auth';

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const handleModalClose = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900" data-testid="login-page">
      <Navigation />
      <AuthModal 
        open={showModal} 
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
