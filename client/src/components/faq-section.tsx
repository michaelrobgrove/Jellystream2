import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    question: 'What makes AlfredFlix different from other streaming services?',
    answer: 'AlfredFlix focuses on quality over quantity. We provide a carefully curated library of premium content without advertisements, ensuring every viewing experience is exceptional. Our concierge approach means no endless scrolling – just thoughtfully selected entertainment.'
  },
  {
    question: 'Can I upgrade or downgrade my subscription plan?',
    answer: 'Absolutely. You can change your subscription plan at any time from your account settings. Upgrades take effect immediately, while downgrades will apply at your next billing cycle to ensure you get full value from your current plan.'
  },
  {
    question: 'What devices support AlfredFlix?',
    answer: 'AlfredFlix works seamlessly across web browsers, iOS and Android mobile devices, smart TVs, Android TV, Roku, and more. We also offer dedicated apps for the best experience on each platform.'
  },
  {
    question: 'Is there really no advertising?',
    answer: 'Correct. AlfredFlix is completely advertisement-free. We believe premium entertainment should never be interrupted by commercials. Your subscription covers all costs, ensuring an uninterrupted viewing experience.'
  },
  {
    question: 'Can I download content for offline viewing?',
    answer: 'Yes, both Standard and Premium subscribers can download content for offline viewing on mobile devices and tablets. This feature is perfect for travel or areas with limited internet connectivity.'
  },
  {
    question: 'What\'s included with Premium vs Standard?',
    answer: 'Standard includes 1080p HD streaming and 2 simultaneous streams. Premium adds 4K Ultra HD quality, 4 simultaneous streams, and early access to new releases. Both plans include offline downloads and ad-free viewing.'
  },
  {
    question: 'How does the content curation work?',
    answer: 'Our team of entertainment experts carefully selects each title based on critical acclaim, cultural significance, and viewer satisfaction. We prioritize quality storytelling and cinematic excellence over trending content.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'New customers can use referral codes to get their first month for just $1. Referral codes are available from existing members, or use FREEMONTH for a free first month (limited availability).'
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you won\'t be charged for the following month.'
  },
  {
    question: 'Do you offer family or group plans?',
    answer: 'Our Premium plan supports up to 4 simultaneous streams, making it perfect for families. We\'re also developing dedicated family plans with additional features – stay tuned for updates.'
  }
];

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-20 bg-zinc-900" id="faq" data-testid="faq-section">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-4" data-testid="faq-title">
            Frequently Asked{' '}
            <span className="alfredflix-text-gradient">
              Questions
            </span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto" data-testid="faq-description">
            Find answers to common questions about AlfredFlix. Our concierge team is always here to help.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card 
              key={index}
              className="luxury-card transition-all duration-300 hover:border-amber-500/30"
              data-testid={`faq-item-${index}`}
            >
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-zinc-800/30 transition-colors rounded-lg"
                  onClick={() => toggleItem(index)}
                  data-testid={`faq-toggle-${index}`}
                >
                  <h3 className="font-semibold text-lg text-white pr-4" data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </h3>
                  {openItems.includes(index) ? (
                    <ChevronUp className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-6 pb-6 pt-0" data-testid={`faq-answer-${index}`}>
                    <p className="text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-semibold text-xl mb-4 text-white">
              Still have questions?
            </h3>
            <p className="text-zinc-400 mb-6">
              Our concierge team is standing by to provide personalized assistance. 
              Reach out and experience the AlfredFlix difference in customer service.
            </p>
            <a 
              href="#contact" 
              className="inline-flex items-center px-8 py-3 rounded-lg alfredflix-gradient text-zinc-900 font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              data-testid="faq-contact-button"
            >
              Contact Our Concierge Team
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}