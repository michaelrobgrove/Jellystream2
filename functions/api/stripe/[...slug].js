// Cloudflare Pages Functions for Stripe payment routes
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = context.params.slug.join('/');
  
  // Set environment variables
  process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  
  try {
    if (slug === 'create-payment-intent') {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      
      const body = await request.json();
      const { amount } = body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      
      return Response.json({ clientSecret: paymentIntent.client_secret });
    }
    
    if (slug === 'get-or-create-subscription') {
      // Implement subscription logic
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      
      // You'll need to implement user authentication here
      // and database operations for subscription management
      
      return Response.json({ message: 'Subscription endpoint' });
    }
    
    return new Response('Not Found', { status: 404 });
    
  } catch (error) {
    console.error('Stripe error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}