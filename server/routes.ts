import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validatedData);
      
      // In a real implementation, you might also send an email notification
      console.log(`📧 New contact message from ${message.email}: ${message.message}`);
      
      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid form data",
          errors: error.errors 
        });
      }
      
      console.error("Contact form error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send message" 
      });
    }
  });

  // Get contact messages (admin only)
  app.get("/api/admin/contact-messages", async (req, res) => {
    try {
      // In a real implementation, you'd add admin authentication here
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Failed to fetch contact messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Jellyfin proxy endpoints (to handle CORS and authentication)
  app.get("/api/jellyfin/*", (req, res) => {
    // In a real implementation, you might proxy requests to Jellyfin
    // to handle CORS issues or add additional authentication/authorization
    res.status(501).json({ message: "Jellyfin proxy not implemented" });
  });

  // TMDB proxy endpoints
  app.get("/api/tmdb/*", (req, res) => {
    // In a real implementation, you might proxy TMDB requests
    // to keep API keys server-side
    res.status(501).json({ message: "TMDB proxy not implemented" });
  });

  // Jellyseerr proxy endpoints
  app.post("/api/request/*", (req, res) => {
    // In a real implementation, you'd proxy content requests to Jellyseerr
    res.status(501).json({ message: "Jellyseerr proxy not implemented" });
  });

  // Placeholder image endpoint
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const { width, height } = req.params;
    // Return a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#27272a"/>
        <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#71717a" text-anchor="middle" dy=".3em">
          ${width}×${height}
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // Stripe payment endpoints
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { plan } = req.body;
      const amount = plan === 'premium' ? 1499 : 999; // $14.99 or $9.99 in cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          plan: plan || 'standard',
          type: 'subscription'
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating subscription: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
