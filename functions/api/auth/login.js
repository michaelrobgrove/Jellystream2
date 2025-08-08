// Login endpoint
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // Authenticate with Jellyfin server
    const jellyfinAuth = await fetch(`${env.JELLYFIN_SERVER_URL}/Users/authenticatebyname`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': `MediaBrowser Client="AlfredFlix", Device="Web", DeviceId="alfredflix-web", Version="1.0.0"`
      },
      body: JSON.stringify({
        Username: username,
        Pw: password
      })
    });
    
    if (jellyfinAuth.ok) {
      const jellyfinUser = await jellyfinAuth.json();
      
      return Response.json({
        success: true,
        user: {
          id: jellyfinUser.User.Id,
          username: jellyfinUser.User.Name,
          email: jellyfinUser.User.Email || '',
          planType: 'standard'
        },
        accessToken: jellyfinUser.AccessToken
      });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}