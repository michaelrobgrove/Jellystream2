import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { HeroSection } from '@/components/hero-section';
import { PricingSection } from '@/components/pricing-section';
import { ContactSection } from '@/components/contact-section';
import { AuthModal } from '@/components/auth-modal';
import { FeaturesSection } from '@/components/features-section';
import { FAQSection } from '@/components/faq-section';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-900" data-testid="home-page">
      <Navigation onAuthModal={() => setShowAuthModal(true)} />
      
      <HeroSection onGetStarted={() => setShowAuthModal(true)} />
      
      {/* About Section */}
      <section className="py-20 bg-zinc-800/50" id="about">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-8" data-testid="about-title">
              Your Personal{' '}
              <span className="alfredflix-text-gradient">
                Cinematic Concierge
              </span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed" data-testid="about-description">
              At AlfredFLIX, we believe your entertainment experience should be as refined as your tastes. 
              Say goodbye to endless scrolling and disruptive advertisements. We are your dedicated cinematic concierge, 
              presenting a meticulously handpicked library of films and shows, ensuring every selection feels like 
              a bespoke recommendation crafted just for you.
            </p>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mt-6">
              Experience the convenience of content you truly desire, always delivered without upcharges or hidden fees. 
              We are at your service, always.
            </p>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800/50 py-12">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg alfredflix-gradient flex items-center justify-center">
                  <span className="text-zinc-900 font-bold text-lg">A</span>
                </div>
                <span className="font-serif text-xl font-semibold alfredflix-text-gradient">
                  AlfredFlix
                </span>
              </div>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                Your curated cinematic sanctuary. Experience entertainment as it was always intended – 
                without interruptions, at your service.
              </p>
              <p className="text-zinc-500 text-sm">
                &copy; 2025 AlfredFlix. All rights reserved.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#about" className="hover:text-amber-500 transition-colors">About</a></li>
                <li><a href="#features" className="hover:text-amber-500 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-amber-500 transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-amber-500 transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#contact" className="hover:text-amber-500 transition-colors">Contact</a></li>
                <li><a href="/login" className="hover:text-amber-500 transition-colors">Sign In</a></li>
                <li><span className="text-zinc-500">Help Center</span></li>
                <li><span className="text-zinc-500">Status</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 pt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Powered by premium streaming technology. Built for discerning viewers.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </div>
  );
}
