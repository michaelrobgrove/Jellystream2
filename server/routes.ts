import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import axios from "axios";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Configure passport
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Invalid username or password' });
    }
    
    // Simple password check (in production, use proper hashing)
    if (user.password !== password) {
      return done(null, false, { message: 'Invalid username or password' });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/login", passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'Login successful' });
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

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

  // Admin user management routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/create-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { username, email, password, planType, isAdmin } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        email,
        password,
        planType,
        isAdmin: isAdmin || false,
        status: 'active'
      });

      res.json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { id } = req.params;
      
      // Prevent deleting yourself
      if (id === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/jellyfin-users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      const response = await axios.get(`${JELLYFIN_URL}/Users`, {
        headers: { 
          'X-Emby-Token': API_KEY,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix-Admin", Device="Web Browser", DeviceId="alfredflix-admin", Version="1.0.0"'
        }
      });

      const jellyfinUsers = response.data.map((user: any) => ({
        id: user.Id,
        name: user.Name,
        hasPassword: user.HasPassword,
        lastLoginDate: user.LastLoginDate,
        lastActivityDate: user.LastActivityDate,
        isAdmin: user.Policy?.IsAdministrator || false,
        isDisabled: user.Policy?.IsDisabled || false
      }));

      res.json(jellyfinUsers);
    } catch (error) {
      console.error('Failed to fetch Jellyfin users:', error);
      res.status(500).json({ error: "Failed to fetch Jellyfin users" });
    }
  });

  app.post("/api/admin/import-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { id, name, planType } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(name);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists in AlfredFlix" });
      }

      const user = await storage.createUser({
        username: name,
        email: `${name}@alfredflix.com`,
        password: 'temp_password_' + Math.random().toString(36).substring(7),
        planType: planType
      });

      // Update with Jellyfin user ID
      const updatedUser = await storage.updateUser(user.id, {
        jellyfinUserId: id
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Import user error:', error);
      res.status(500).json({ error: "Failed to import user" });
    }
  });

  // Configure user permissions based on plan type
  app.patch("/api/admin/jellyfin-user/:userId/permissions", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { userId } = req.params;
      const { planType } = req.body;
      
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      // Get current user data to preserve some settings
      const userResponse = await axios.get(`${JELLYFIN_URL}/Users/${userId}`, {
        headers: { 'X-Emby-Token': API_KEY }
      });
      
      const currentUser = userResponse.data;
      
      // Define permission sets based on plan type
      const standardPermissions = {
        IsAdministrator: false,
        IsHidden: true,
        IsDisabled: false,
        EnableRemoteAccess: true,
        EnableLiveTvAccess: false,
        EnableLiveTvManagement: false,
        EnableMediaPlayback: true,
        EnableAudioPlaybackTranscoding: true,
        EnableVideoPlaybackTranscoding: false,
        EnablePlaybackRemuxing: false,
        EnableContentDeletion: false,
        EnableContentDownloading: true,
        EnableSyncTranscoding: true,
        RemoteClientBitrateLimit: 50000000, // 50 Mbps
        MaxActiveSessions: 2,
        LoginAttemptsBeforeLockout: 3,
        EnabledFolders: [
          "f137a2dd21bbc1b99aa5c0f6bf02a805", // Movies
          "a656b907eb3a73532e40e44b968d0225"  // Shows
        ],
        EnableAllFolders: false,
        SyncPlayAccess: "JoinGroups",
        AuthenticationProviderId: currentUser.Policy.AuthenticationProviderId,
        PasswordResetProviderId: currentUser.Policy.PasswordResetProviderId
      };

      const premiumPermissions = {
        IsAdministrator: false,
        IsHidden: true,
        IsDisabled: false,
        EnableRemoteAccess: true,
        EnableLiveTvAccess: false,
        EnableLiveTvManagement: false,
        EnableMediaPlayback: true,
        EnableAudioPlaybackTranscoding: true,
        EnableVideoPlaybackTranscoding: false,
        EnablePlaybackRemuxing: false,
        EnableContentDeletion: false,
        EnableContentDownloading: true,
        EnableSyncTranscoding: true,
        RemoteClientBitrateLimit: 100000000, // 100 Mbps
        MaxActiveSessions: 4,
        LoginAttemptsBeforeLockout: 3,
        EnabledFolders: [
          "f137a2dd21bbc1b99aa5c0f6bf02a805", // Movies
          "a656b907eb3a73532e40e44b968d0225", // Shows
          "171db634ae2ae313edf438e829876c69", // UHD Movies
          "3b37f5f09c7109a66c0e5ba425175e64"  // UHD Shows
        ],
        EnableAllFolders: false,
        SyncPlayAccess: "JoinGroups",
        AuthenticationProviderId: currentUser.Policy.AuthenticationProviderId,
        PasswordResetProviderId: currentUser.Policy.PasswordResetProviderId
      };

      const permissions = planType === 'premium' ? premiumPermissions : standardPermissions;
      
      // Update user policy
      await axios.post(`${JELLYFIN_URL}/Users/${userId}/Policy`, permissions, {
        headers: { 
          'X-Emby-Token': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      res.json({ success: true, message: `User permissions updated for ${planType} plan` });
    } catch (error) {
      console.error('Failed to update user permissions:', error);
      res.status(500).json({ error: "Failed to update user permissions" });
    }
  });

  // Get Jellyfin libraries for access management
  app.get("/api/admin/jellyfin-libraries", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      const response = await axios.get(`${JELLYFIN_URL}/Library/VirtualFolders`, {
        headers: { 
          'X-Emby-Token': API_KEY,
          'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix-Admin", Device="Web Browser", DeviceId="alfredflix-admin", Version="1.0.0"'
        }
      });

      const libraries = response.data.map((library: any) => ({
        id: library.ItemId,
        name: library.Name,
        collectionType: library.CollectionType
      }));

      res.json(libraries);
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
      res.status(500).json({ error: "Failed to fetch libraries" });
    }
  });

  // Get available permission options for user configuration
  app.get("/api/admin/permission-options", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      // Get libraries for folder selection
      const librariesResponse = await axios.get(`${JELLYFIN_URL}/Library/VirtualFolders`, {
        headers: { 'X-Emby-Token': API_KEY }
      });

      const libraries = librariesResponse.data.map((lib: any) => ({
        id: lib.ItemId,
        name: lib.Name,
        collectionType: lib.CollectionType
      }));

      // Define configurable permission options
      const permissionOptions = {
        access: {
          enableRemoteAccess: { name: "Remote Access", description: "Allow access from outside network" },
          enableLiveTvAccess: { name: "Live TV Access", description: "Access to live TV features" },
          enableLiveTvManagement: { name: "Live TV Management", description: "Manage live TV settings" }
        },
        playback: {
          enableMediaPlayback: { name: "Media Playback", description: "Basic media playback" },
          enableAudioPlaybackTranscoding: { name: "Audio Transcoding", description: "Transcode audio files" },
          enableVideoPlaybackTranscoding: { name: "Video Transcoding", description: "Transcode video files" },
          enablePlaybackRemuxing: { name: "Playback Remuxing", description: "Remux media files" }
        },
        content: {
          enableContentDeletion: { name: "Content Deletion", description: "Delete media files" },
          enableContentDownloading: { name: "Content Downloading", description: "Download content for offline use" },
          enableSyncTranscoding: { name: "Sync Transcoding", description: "Transcode for sync" }
        },
        streaming: {
          remoteClientBitrateLimit: { 
            name: "Max Streaming Bitrate", 
            description: "Maximum streaming bitrate (Mbps)",
            type: "number",
            options: [
              { value: 1000000, label: "1 Mbps" },
              { value: 2000000, label: "2 Mbps" },
              { value: 4000000, label: "4 Mbps" },
              { value: 8000000, label: "8 Mbps" },
              { value: 15000000, label: "15 Mbps" },
              { value: 25000000, label: "25 Mbps" },
              { value: 50000000, label: "50 Mbps" },
              { value: 0, label: "No Limit" }
            ]
          },
          maxActiveSessions: {
            name: "Max Concurrent Sessions",
            description: "Maximum simultaneous streams",
            type: "number",
            options: [
              { value: 1, label: "1 session" },
              { value: 2, label: "2 sessions" },
              { value: 3, label: "3 sessions" },
              { value: 5, label: "5 sessions" },
              { value: 0, label: "Unlimited" }
            ]
          }
        },
        libraries: {
          enabledFolders: {
            name: "Library Access",
            description: "Which libraries user can access",
            type: "multiselect",
            options: libraries
          },
          enableAllFolders: { name: "Access All Libraries", description: "Grant access to all current and future libraries" }
        }
      };

      res.json(permissionOptions);
    } catch (error) {
      console.error('Failed to get permission options:', error);
      res.status(500).json({ error: "Failed to get permission options" });
    }
  });

  // Create new Jellyfin user
  app.post("/api/admin/create-jellyfin-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { username, password, planType } = req.body;
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      // Create user in Jellyfin with required fields
      const createResponse = await axios.post(`${JELLYFIN_URL}/Users/New`, {
        Name: username,
        Password: password,
        PasswordResetProviderId: 'Jellyfin.Server.Implementations.Users.DefaultPasswordResetProvider',
        AuthenticationProviderId: 'Jellyfin.Server.Implementations.Users.DefaultAuthenticationProvider'
      }, {
        headers: { 
          'X-Emby-Token': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const newUserId = createResponse.data.Id;
      
      // Set user policy based on plan type
      const isStandard = planType === 'standard';
      const policy = {
        IsAdministrator: false,
        IsHidden: false,
        IsDisabled: false,
        EnableRemoteAccess: true,
        EnableLiveTvAccess: true,
        EnableLiveTvManagement: false,
        EnableMediaPlayback: true,
        EnableAudioPlaybackTranscoding: true,
        EnableVideoPlaybackTranscoding: true,
        EnablePlaybackRemuxing: true,
        EnableContentDeletion: false,
        EnableContentDownloading: true,
        EnableSyncTranscoding: true,
        EnableMediaConversion: false,
        EnableAllDevices: true,
        EnableAllChannels: true,
        EnableAllFolders: !isStandard, // Standard users get restricted folders
        RemoteClientBitrateLimit: isStandard ? 15000000 : 50000000, // 15Mbps for standard, 50Mbps for premium
        EnablePublicSharing: false,
        InvalidLoginAttemptCount: 0,
        LoginAttemptsBeforeLockout: 3,
        MaxActiveSessions: isStandard ? 1 : 3
      };

      await axios.post(`${JELLYFIN_URL}/Users/${newUserId}/Policy`, policy, {
        headers: { 
          'X-Emby-Token': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      // Also create in AlfredFlix database
      const alfredUser = await storage.createUser({
        username,
        password,
        email: `${username}@alfredflix.com`,
        planType
      });

      await storage.updateUser(alfredUser.id, {
        jellyfinUserId: newUserId
      });

      res.json({ success: true, jellyfinId: newUserId, alfredUserId: alfredUser.id });
    } catch (error: any) {
      console.error('Failed to create Jellyfin user:', error.response?.data || error.message);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Make Jellyfin user admin
  app.post("/api/admin/make-jellyfin-admin", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { userId } = req.body;
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      // Get current user
      const userResponse = await axios.get(`${JELLYFIN_URL}/Users/${userId}`, {
        headers: { 'X-Emby-Token': API_KEY }
      });

      const user = userResponse.data;
      
      // Update policy to make admin
      const adminPolicy = {
        ...user.Policy,
        IsAdministrator: true,
        EnableRemoteAccess: true,
        EnableLiveTvManagement: true,
        EnableContentDeletion: true,
        EnableAllFolders: true,
        RemoteClientBitrateLimit: 0, // No limit for admins
        MaxActiveSessions: 0 // No limit
      };

      await axios.post(`${JELLYFIN_URL}/Users/${userId}/Policy`, adminPolicy, {
        headers: { 
          'X-Emby-Token': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      res.json({ success: true, message: "User made admin successfully" });
    } catch (error: any) {
      console.error('Failed to make user admin:', error.response?.data || error.message);
      res.status(500).json({ error: "Failed to update user permissions" });
    }
  });

  // Delete Jellyfin user
  app.delete("/api/admin/jellyfin-user/:userId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { userId } = req.params;
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      await axios.delete(`${JELLYFIN_URL}/Users/${userId}`, {
        headers: { 'X-Emby-Token': API_KEY }
      });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error('Failed to delete user:', error.response?.data || error.message);
      res.status(500).json({ error: "Failed to delete user" });
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
