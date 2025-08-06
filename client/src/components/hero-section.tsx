import { ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-gradient min-h-screen flex items-center pt-16" data-testid="hero-section">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6 animate-slide-up" data-testid="hero-title">
            Your Curated{' '}
            <span className="alfredflix-text-gradient">
              Cinematic Sanctuary
            </span>{' '}
            Awaits.
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-400 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }} data-testid="hero-description">
            Discover a world of exceptional films and shows, hand-selected for the discerning viewer. 
            Experience entertainment as it was always intended – without interruptions, at your service.
          </p>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg"
              onClick={onGetStarted || scrollToPricing}
              className="alfredflix-gradient text-zinc-900 font-semibold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all group"
              data-testid="hero-cta-button"
            >
              <Crown className="w-5 h-5 mr-3" />
              Grant Access
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
