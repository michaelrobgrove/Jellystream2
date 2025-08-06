import { Crown, Zap, Shield, Monitor, Smartphone, Tv } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Crown,
    title: 'Premium Quality',
    description: 'Experience cinema in stunning 4K Ultra HD with lossless audio. Every frame delivered exactly as the creators intended.',
    highlight: true
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Instant streaming with our optimized content delivery network. No buffering, no waiting, just pure entertainment.',
    highlight: false
  },
  {
    icon: Shield,
    title: 'Ad-Free Experience',
    description: 'Enjoy uninterrupted viewing without a single advertisement. Your cinematic journey remains completely immersive.',
    highlight: false
  },
  {
    icon: Monitor,
    title: 'Multi-Device Access',
    description: 'Stream seamlessly across web browsers, mobile devices, and smart TVs. Your library follows you everywhere.',
    highlight: false
  },
  {
    icon: Smartphone,
    title: 'Offline Viewing',
    description: 'Download your favorite content for offline enjoyment. Perfect for travel or areas with limited connectivity.',
    highlight: false
  },
  {
    icon: Tv,
    title: 'Curated Library',
    description: 'Hand-selected films and shows chosen by entertainment connoisseurs. Quality over quantity, always.',
    highlight: true
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-zinc-900" id="features" data-testid="features-section">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-4" data-testid="features-title">
            Engineered for{' '}
            <span className="alfredflix-text-gradient">
              Excellence
            </span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto" data-testid="features-description">
            Every aspect of AlfredFlix has been crafted to deliver the ultimate viewing experience, 
            from our curated content library to our cutting-edge streaming technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className={`luxury-card group hover:border-amber-500/30 transition-all duration-300 ${
                feature.highlight ? 'border-amber-500/20' : ''
              }`}
              data-testid={`feature-${index}`}
            >
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-xl mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                  feature.highlight 
                    ? 'alfredflix-gradient' 
                    : 'bg-zinc-800 group-hover:bg-zinc-700'
                }`}>
                  <feature.icon 
                    className={`w-8 h-8 ${
                      feature.highlight 
                        ? 'text-zinc-900' 
                        : 'text-amber-500 group-hover:text-amber-400'
                    }`} 
                  />
                </div>
                <h3 className="font-semibold text-xl mb-3 text-white" data-testid={`feature-title-${index}`}>
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed" data-testid={`feature-description-${index}`}>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl font-bold mb-2 alfredflix-text-gradient">
              99.9%
            </div>
            <p className="text-zinc-400 text-sm">Uptime Guarantee</p>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl font-bold mb-2 alfredflix-text-gradient">
              4K
            </div>
            <p className="text-zinc-400 text-sm">Ultra HD Quality</p>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl font-bold mb-2 alfredflix-text-gradient">
              24/7
            </div>
            <p className="text-zinc-400 text-sm">Concierge Support</p>
          </div>
          <div className="text-center">
            <div className="font-serif text-3xl md:text-4xl font-bold mb-2 alfredflix-text-gradient">
              ∞
            </div>
            <p className="text-zinc-400 text-sm">Unlimited Streaming</p>
          </div>
        </div>
      </div>
    </section>
  );
}