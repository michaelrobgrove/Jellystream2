import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Marcus Chen',
    title: 'Film Enthusiast',
    location: 'San Francisco, CA',
    content: 'AlfredFlix has completely transformed my viewing experience. The quality is exceptional, and I never have to worry about ads interrupting my favorite films. It\'s like having a personal cinema curator.',
    rating: 5,
    plan: 'Premium'
  },
  {
    name: 'Sarah Williams',
    title: 'Content Creator',
    location: 'New York, NY',
    content: 'The 4K quality and seamless streaming make this platform perfect for my work and leisure. The selection is incredibly thoughtful – every recommendation feels personally chosen.',
    rating: 5,
    plan: 'Premium'
  },
  {
    name: 'James Rodriguez',
    title: 'Software Engineer',
    location: 'Austin, TX',
    content: 'Finally, a streaming service that respects my time and intelligence. No endless scrolling, no ads, just quality content delivered flawlessly across all my devices.',
    rating: 5,
    plan: 'Standard'
  },
  {
    name: 'Emma Thompson',
    title: 'Designer',
    location: 'London, UK',
    content: 'The attention to detail in both the content curation and platform design is remarkable. AlfredFlix feels like luxury streaming should – refined and effortless.',
    rating: 5,
    plan: 'Premium'
  },
  {
    name: 'David Park',
    title: 'Entrepreneur',
    location: 'Toronto, CA',
    content: 'Worth every penny. The offline viewing feature is perfect for my travels, and the quality never disappoints. This is how streaming should be done.',
    rating: 5,
    plan: 'Standard'
  },
  {
    name: 'Lisa Anderson',
    title: 'Marketing Director',
    location: 'Chicago, IL',
    content: 'The concierge approach to content curation saves me hours of browsing. Every evening feels like a premium cinema experience from the comfort of home.',
    rating: 5,
    plan: 'Premium'
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-zinc-800/30" id="testimonials" data-testid="testimonials-section">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-4" data-testid="testimonials-title">
            Cherished by{' '}
            <span className="alfredflix-text-gradient">
              Connoisseurs
            </span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto" data-testid="testimonials-description">
            Discover why discerning viewers have chosen AlfredFlix as their preferred cinematic sanctuary.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={`${testimonial.name}-${index}`}
              className="luxury-card group hover:border-amber-500/30 transition-all duration-300"
              data-testid={`testimonial-${index}`}
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Quote className="w-8 h-8 text-amber-500 opacity-50" />
                  <div className="ml-auto flex items-center space-x-1">
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                    ))}
                  </div>
                </div>
                
                <p className="text-zinc-300 leading-relaxed mb-6" data-testid={`testimonial-content-${index}`}>
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white" data-testid={`testimonial-name-${index}`}>
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-zinc-400" data-testid={`testimonial-title-${index}`}>
                      {testimonial.title}
                    </p>
                    <p className="text-xs text-zinc-500" data-testid={`testimonial-location-${index}`}>
                      {testimonial.location}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    testimonial.plan === 'Premium' 
                      ? 'alfredflix-gradient text-zinc-900' 
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {testimonial.plan}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-sm mb-8">
            Trusted by over 10,000 satisfied subscribers worldwide
          </p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-zinc-600">★★★★★</div>
            <div className="text-zinc-600">|</div>
            <div className="text-sm text-zinc-600">4.9/5 Average Rating</div>
            <div className="text-zinc-600">|</div>
            <div className="text-sm text-zinc-600">99% Customer Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}