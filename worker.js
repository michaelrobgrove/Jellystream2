// Cloudflare Worker entry point for Express.js app
import { createServer } from 'http';
import app from './server/index.js';

const server = createServer(app);

export default {
  async fetch(request, env, ctx) {
    // Set environment variables from Cloudflare
    process.env.DATABASE_URL = env.DATABASE_URL;
    process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
    process.env.VITE_STRIPE_PUBLIC_KEY = env.VITE_STRIPE_PUBLIC_KEY;
    process.env.MAILGUN_API_KEY = env.MAILGUN_API_KEY;
    process.env.MAILGUN_DOMAIN = env.MAILGUN_DOMAIN;
    process.env.MAILGUN_FROM_EMAIL = env.MAILGUN_FROM_EMAIL;

    return new Promise((resolve) => {
      server.on('request', (req, res) => {
        // Convert Cloudflare request to Node.js format
        req.url = new URL(request.url).pathname + new URL(request.url).search;
        req.method = request.method;
        req.headers = Object.fromEntries(request.headers);

        // Handle the request with Express
        app(req, res);

        // Convert Node.js response to Cloudflare format
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve(new Response(body, {
            status: res.statusCode,
            headers: res.getHeaders()
          }));
        });
      });

      server.emit('request', {
        url: new URL(request.url).pathname + new URL(request.url).search,
        method: request.method,
        headers: Object.fromEntries(request.headers)
      }, {});
    });
  }
};