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
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" data-testid="hero-section">
      {/* Movie/TV Background */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1489599511207-4c26a3ae9441?ixlib=rb-4.0.3&auto=format&fit=crop&w=2970&q=80" 
          alt="Premium cinema experience" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-900/30" />
      </div>
      
      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-white drop-shadow-2xl" data-testid="hero-title">
            Stream Movies & TV Shows{' '}
            <span className="alfredflix-text-gradient">
              Like Never Before
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-200 mb-8 leading-relaxed drop-shadow-lg" data-testid="hero-description">
            🎬 <strong>4K Ultra HD Movies</strong> • 📺 <strong>Latest TV Shows</strong> • 🚫 <strong>Zero Ads</strong> • 📱 <strong>All Devices</strong>
          </p>
          
          <p className="text-lg text-zinc-300 mb-8 leading-relaxed">
            Join thousands enjoying unlimited premium streaming with crystal-clear quality and instant access to the latest releases.
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
