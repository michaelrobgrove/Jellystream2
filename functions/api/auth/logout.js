// Logout endpoint
export async function onRequestPost(context) {
  try {
    // Since we're using JWT tokens, logout is handled client-side
    // But we can still provide an endpoint for consistency
    return Response.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}
