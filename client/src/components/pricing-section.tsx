import { Check, Star } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const plans = [
  {
    name: 'Standard',
    price: '$9.99',
    cadPrice: '13.75 CAD',
    popular: false,
    features: [
      '1080p Full HD Content',
      '2 Simultaneous Streams',
      'Absolutely No Ads',
      'Manual Requests (Up to 10/month)',
      'Offline Viewing Included',
      'Android, Android TV, Web Compatible'
    ],
    stripeUrl: 'https://buy.stripe.com/5kQbJ2b5I1ehept7Q8efC00'
  },
  {
    name: 'Premium',
    price: '$14.99',
    cadPrice: '20.63 CAD',
    popular: true,
    features: [
      '4K Ultra HD Content',
      '4 Simultaneous Streams',
      'Absolutely No Ads',
      'Automatic, Unlimited Requests',
      'Offline Viewing Included',
      'Android, Android TV, Web Compatible'
    ],
    stripeUrl: 'https://buy.stripe.com/14AaEYc9M8GJ5SX4DWefC01'
  }
];

export function PricingSection() {
  return (
    <section className="py-20 bg-zinc-800/50" id="pricing" data-testid="pricing-section">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-4" data-testid="pricing-title">
            Choose Your{' '}
            <span className="alfredflix-text-gradient">
              Bespoke Experience
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`luxury-card relative ${plan.popular ? 'border-amber-500/30' : ''}`}
              data-testid={`plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="alfredflix-gradient text-zinc-900 px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <h3 className="font-serif text-2xl font-semibold mb-2" data-testid={`plan-name-${plan.name.toLowerCase()}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold" data-testid={`plan-price-${plan.name.toLowerCase()}`}>
                    {plan.price}
                  </span>
                  <span className="text-zinc-400">/month</span>
                  <p className="text-sm text-zinc-400 mt-1" data-testid={`plan-cad-price-${plan.name.toLowerCase()}`}>
                    {plan.cadPrice}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li 
                      key={index} 
                      className="flex items-center"
                      data-testid={`plan-feature-${plan.name.toLowerCase()}-${index}`}
                    >
                      <Check className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">
                        {feature.includes('4K Ultra HD') || feature.includes('4 Simultaneous') || feature.includes('Automatic, Unlimited') ? (
                          <strong>{feature}</strong>
                        ) : (
                          feature
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  asChild
                  className={`w-full py-3 font-medium ${
                    plan.popular 
                      ? 'alfredflix-gradient text-zinc-900 hover:shadow-lg hover:shadow-amber-500/25' 
                      : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                  } transition-all`}
                  data-testid={`select-plan-${plan.name.toLowerCase()}`}
                >
                  <Link href={`/subscribe?plan=${plan.name.toLowerCase()}`}>
                    Select {plan.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
