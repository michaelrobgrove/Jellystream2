// Validate Stripe coupon
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    const body = await request.json();
    const { code } = body;
    
    try {
      const coupon = await stripe.coupons.retrieve(code);
      
      if (coupon.valid) {
        return Response.json({
          valid: true,
          coupon: {
            id: coupon.id,
            name: coupon.name,
            percentOff: coupon.percent_off,
            amountOff: coupon.amount_off,
            currency: coupon.currency,
          }
        });
      } else {
        return Response.json({ valid: false, error: 'Coupon is not valid' });
      }
      
    } catch (error) {
      return Response.json({ valid: false, error: 'Coupon not found' });
    }
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    return Response.json({ error: 'Validation failed' }, { status: 500 });
  }
}
