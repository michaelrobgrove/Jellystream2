# AlfredFlix Cloudflare Deployment Guide

## Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

## Option 1: Cloudflare Pages (Recommended)

This approach deploys your React frontend to Pages and converts your API routes to Cloudflare Functions.

### Steps:

1. **Build the frontend:**
```bash
npm run build:pages
```

2. **Set up environment variables:**
Go to your Cloudflare dashboard → Pages → Settings → Environment variables and add:
- `DATABASE_URL` - Your PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` - Your Stripe public key
- `MAILGUN_API_KEY` - Your Mailgun API key
- `MAILGUN_DOMAIN` - Your Mailgun domain
- `MAILGUN_FROM_EMAIL` - Your Mailgun from email

3. **Deploy to Pages:**
```bash
wrangler pages deploy dist
```

### Database Considerations:

Since your app uses PostgreSQL with Neon, you have two options:

**Option A: Keep Neon Database (Recommended)**
- Your existing Neon database will work fine
- Just use your existing `DATABASE_URL` in the environment variables
- No code changes needed

**Option B: Migrate to Cloudflare D1**
- Would require rewriting database code to use D1's SQL interface
- More work but potentially lower latency

### Limitations with Pages Approach:

1. **Session Management**: Express sessions won't work the same way. You'll need to:
   - Use JWT tokens instead of sessions
   - Or implement session storage with Cloudflare KV

2. **WebSocket Support**: Limited WebSocket support in Pages Functions

3. **API Route Conversion**: You'll need to convert your Express routes to individual function files (I've started this in the `functions/` directory)

## Option 2: Cloudflare Workers (More Complex)

This keeps your Express.js app mostly intact but requires more setup.

### Steps:

1. **Install additional dependencies:**
```bash
npm install @cloudflare/workers-types wrangler
```

2. **Deploy with Workers:**
```bash
wrangler deploy worker.js
```

### Challenges with Workers Approach:

1. **Node.js Compatibility**: Some Node.js modules might not work
2. **Database Connections**: Connection pooling needs to be handled differently
3. **File System**: No file system access (but you're not using files anyway)

## Recommended Approach for AlfredFlix

Given your application's complexity, I recommend **starting with Cloudflare Pages** because:

1. **Simpler to set up** - Just deploy the built React app
2. **Better for your use case** - Your app is mostly API-driven
3. **Keep existing database** - No need to migrate from Neon PostgreSQL
4. **Gradual migration** - You can move API routes one by one

## Migration Steps for Pages:

1. **Deploy the frontend first:**
   - Build and deploy your React app to Pages
   - Test that the UI loads correctly

2. **Migrate API routes gradually:**
   - Start with simple routes (like health checks)
   - Move authentication routes
   - Move Stripe payment routes
   - Move Jellyfin integration routes

3. **Update authentication:**
   - Switch from Express sessions to JWT tokens
   - Use Cloudflare KV for any session-like data

4. **Test thoroughly:**
   - Test all payment flows
   - Test Jellyfin integration
   - Test user registration/login

## Quick Start Commands:

```bash
# 1. Build frontend for Pages
vite build

# 2. Deploy to Pages (first time setup)
wrangler pages create alfredflix
wrangler pages deploy dist

# 3. Set environment variables in Cloudflare dashboard
# Then redeploy
wrangler pages deploy dist
```

## Next Steps After Deployment:

1. **Set up custom domain** in Cloudflare Pages dashboard
2. **Configure DNS** to point to your Pages deployment
3. **Set up monitoring** using Cloudflare Analytics
4. **Optimize performance** with Cloudflare's caching rules

Would you like me to help you with any specific part of this deployment process?