// Register endpoint
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { username, email, password, planType = 'standard' } = body;
    
    // Here you would:
    // 1. Create user in your database
    // 2. Create user in Jellyfin
    // 3. Set up Stripe customer
    
    // For now, return success
    return Response.json({ 
      success: true, 
      message: 'User registered successfully' 
    });
    
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}
