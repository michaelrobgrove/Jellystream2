import { useState } from 'react';
import { Check, Star, Crown, Monitor, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SignupModal } from '@/components/signup-modal';

const plans = [
  {
    name: 'Standard',
    price: '$9.99',
    description: 'Perfect for casual viewers',
    popular: false,
    features: [
      '1080p Full HD Streaming',
      '2 Simultaneous Streams',
      'Zero Advertisements',
      'Offline Downloads',
      'Content Requests (10/month)',
      'All Devices Supported'
    ],
    icon: Monitor
  },
  {
    name: 'Premium',
    price: '$14.99',
    description: 'Ultimate viewing experience',
    popular: true,
    features: [
      '4K Ultra HD Streaming',
      '4 Simultaneous Streams',
      'Zero Advertisements',  
      'Offline Downloads',
      'Unlimited Content Requests',
      'Early Access to New Releases'
    ],
    icon: Crown
  }
];

export function PricingSection() {
  const [showSignup, setShowSignup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard');

  const handlePlanSelect = (plan: 'standard' | 'premium') => {
    setSelectedPlan(plan);
    setShowSignup(true);
  };

  return (
    <section className="py-20 bg-zinc-800/30" id="pricing" data-testid="pricing-section">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-white" data-testid="pricing-title">
            Choose Your{' '}
            <span className="alfredflix-text-gradient">
              Streaming Plan
            </span>
          </h2>
          <p className="text-xl text-zinc-300 mb-8">
            Start with a 7-day free trial. Cancel anytime.
          </p>
          
          {/* Special Offers */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-400 font-medium">
                Refer friends: Get $5 credit + they get $1 first month
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-400 font-medium">
                Instant access • No setup fees
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.name}
                className={`luxury-card relative transform hover:scale-105 transition-all duration-300 ${
                  plan.popular ? 'border-amber-500/40 shadow-2xl shadow-amber-500/10' : 'border-zinc-700/50'
                }`}
                data-testid={`plan-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="alfredflix-gradient text-zinc-900 px-4 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
                    <IconComponent className="w-8 h-8 text-zinc-900" />
                  </div>
                  
                  <h3 className="font-serif text-2xl font-bold text-white mb-2" data-testid={`plan-name-${plan.name.toLowerCase()}`}>
                    {plan.name}
                  </h3>
                  
                  <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-5xl font-bold alfredflix-text-gradient" data-testid={`plan-price-${plan.name.toLowerCase()}`}>
                      {plan.price}
                    </span>
                    <span className="text-lg text-zinc-400 font-normal">/month</span>
                </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-300 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handlePlanSelect(plan.name.toLowerCase() as 'standard' | 'premium')}
                    className={`w-full font-bold py-4 text-lg transition-all duration-300 ${
                      plan.popular 
                        ? 'alfredflix-gradient text-zinc-900 hover:shadow-xl hover:shadow-amber-500/40 transform hover:scale-105' 
                        : 'bg-zinc-700 text-white hover:bg-zinc-600 border-2 border-zinc-600 hover:border-zinc-500'
                    }`}
                    data-testid={`select-plan-${plan.name.toLowerCase()}`}
                  >
                    Start {plan.name} Plan
                    {plan.name === 'Premium' && <Crown className="w-4 h-4 ml-2" />}
                  </Button>
                  
                  <p className="text-center text-xs text-zinc-500 mt-3">
                    7-day free trial • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <SignupModal 
          open={showSignup} 
          onOpenChange={setShowSignup}
          plan={selectedPlan}
        />
      </div>
    </section>
  );
}
