// Create Stripe payment intent
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    const body = await request.json();
    const { amount, currency = 'usd', couponCode } = body;
    
    let finalAmount = amount;
    
    // Handle coupon validation if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          if (coupon.percent_off) {
            finalAmount = amount * (1 - coupon.percent_off / 100);
          } else if (coupon.amount_off) {
            finalAmount = Math.max(50, amount - coupon.amount_off);
          }
        }
      } catch (couponError) {
        console.error('Coupon validation error:', couponError);
      }
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: currency,
      metadata: {
        couponCode: couponCode || ''
      }
    });
    
    return Response.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount
    });
    
  } catch (error) {
    console.error('Stripe payment error:', error);
    return Response.json({ error: 'Payment creation failed' }, { status: 500 });
  }
}
