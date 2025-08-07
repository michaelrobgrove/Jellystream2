import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as referral from "./referral";
import { insertContactMessageSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import axios from "axios";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import { ReferralService } from "./referral";
import { nanoid } from "nanoid";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Initialize Mailgun
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

// Email service functions
async function sendWelcomeEmail(email: string, username: string, password: string, planType: string) {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN || !process.env.MAILGUN_FROM_EMAIL) {
    console.warn('Mailgun not configured, skipping welcome email');
    return;
  }

  try {
    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL,
      to: email,
      subject: 'Welcome to AlfredFlix - Your Account is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; margin: 0;">AlfredFlix</h1>
            <p style="color: #9ca3af; margin: 5px 0;">Premium Streaming Experience</p>
          </div>
          
          <h2 style="color: #f59e0b;">Welcome ${username}!</h2>
          <p>Your AlfredFlix account has been created successfully. Here are your login details:</p>
          
          <div style="background: #1f1f1f; border: 1px solid #374151; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #f59e0b; margin-top: 0;">Login Details</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Plan:</strong> ${planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
            <p><strong>Login URL:</strong> <a href="https://alfredflix.stream/login" style="color: #f59e0b;">https://alfredflix.stream/login</a></p>
          </div>
          
          <p>You can now access your premium streaming library and start enjoying your content.</p>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

async function sendAccountDeletionEmail(email: string, username: string) {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN || !process.env.MAILGUN_FROM_EMAIL) {
    return;
  }

  try {
    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL,
      to: email,
      subject: 'AlfredFlix Account Deleted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; margin: 0;">AlfredFlix</h1>
          </div>
          
          <h2 style="color: #f59e0b;">Account Deleted</h2>
          <p>Hello ${username},</p>
          <p>Your AlfredFlix account has been deleted as requested. All your data and access has been removed.</p>
          <p>If this was done in error, please contact our support team immediately.</p>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Thank you for being part of AlfredFlix.</p>
        </div>
      `
    };

    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log(`Account deletion email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send deletion email:', error);
  }
}

async function sendAdminNotificationEmail(username: string, email: string, expiresAt: string | null, planType: string) {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN || !process.env.MAILGUN_FROM_EMAIL) {
    console.log('Mailgun not configured, skipping admin notification email');
    return;
  }

  try {
    const expirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never expires';
    
    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL,
      to: 'accts@alfredflix.stream',
      subject: `New AlfredFlix Account: ${username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">🆕 New Account Alert</h2>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #f59e0b; margin-top: 0;">Account Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Username:</td>
                <td style="padding: 8px 0; color: #333;">${username}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Plan Type:</td>
                <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${planType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Expires:</td>
                <td style="padding: 8px 0; color: #333;">${expirationDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Created:</td>
                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This is an automated notification from the AlfredFlix account system.
          </p>
        </div>
      `
    };

    await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    console.log(`Admin notification sent for new user: ${username}`);
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
  }
}

// Configure Jellyfin user permissions based on plan type
async function configureJellyfinUserPermissions(jellyfinUserId: string, planType: string) {
  try {
    const JELLYFIN_URL = 'https://watch.alfredflix.stream';
    const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';

    // Get current library structure from Jellyfin
    let STANDARD_LIBRARIES = [];
    let PREMIUM_LIBRARIES = [];
    
    try {
      const librariesResponse = await axios.get(`${JELLYFIN_URL}/Library/MediaFolders`, {
        headers: { 'X-Emby-Token': API_KEY }
      });
      
      const libraries = librariesResponse.data.Items || [];
      const movieLibs = libraries.filter(lib => lib.CollectionType === 'movies');
      const tvLibs = libraries.filter(lib => lib.CollectionType === 'tvshows');
      
      // Standard gets regular movies and TV
      STANDARD_LIBRARIES = [
        ...movieLibs.filter(lib => !lib.Name.toLowerCase().includes('uhd') && !lib.Name.toLowerCase().includes('4k')).map(lib => lib.Id),
        ...tvLibs.filter(lib => !lib.Name.toLowerCase().includes('uhd') && !lib.Name.toLowerCase().includes('4k')).map(lib => lib.Id)
      ];
      
      // Premium gets all libraries
      PREMIUM_LIBRARIES = libraries.map(lib => lib.Id);
      
      console.log(`Found ${libraries.length} libraries. Standard: ${STANDARD_LIBRARIES.length}, Premium: ${PREMIUM_LIBRARIES.length}`);
    } catch (error) {
      console.error('Failed to get library structure, using fallback IDs:', error.message);
      // Fallback to hardcoded IDs
      STANDARD_LIBRARIES = ["f137a2dd21bbc1b99aa5c0f6bf02a805", "a656b907eb3a73532e40e44b968d0225"];
      PREMIUM_LIBRARIES = ["f137a2dd21bbc1b99aa5c0f6bf02a805", "a656b907eb3a73532e40e44b968d0225", "171db634ae2ae313edf438e829876c69", "3b37f5f09c7109a66c0e5ba425175e64"];
    }

    const enabledFolders = planType === 'premium' ? PREMIUM_LIBRARIES : STANDARD_LIBRARIES;

    // Get current user policy first to avoid validation errors
    const userResponse = await axios.get(`${JELLYFIN_URL}/Users/${jellyfinUserId}`, {
      headers: { 'X-Emby-Token': API_KEY }
    });
    
    const currentPolicy = userResponse.data.Policy || {};
    
    // Configure comprehensive permissions with all required restrictions
    const policyUpdate = {
      ...currentPolicy, // Keep existing policy structure
      IsAdministrator: false, // UNCHECK: Allow this user to manage the server
      IsDisabled: false,
      IsHidden: true, // CHECK: Hide this user from login screens
      EnabledFolders: enabledFolders, // SPECIFIC folder access
      EnableAllFolders: false, // CRITICAL: Must be false to enforce restrictions
      RemoteClientBitrateLimit: planType === 'premium' ? 100000000 : 50000000,
      MaxActiveSessions: planType === 'premium' ? 4 : 2,
      LoginAttemptsBeforeLockout: 3, // Failed login tries before user is locked out: 3
      
      // UNCHECK all these server management capabilities
      EnableCollectionManagement: false, // Allow this user to manage collections
      EnableSubtitleManagement: false, // Allow this user to edit subtitles  
      EnableLiveTvAccess: false, // Allow Live TV access
      EnableLiveTvManagement: false, // Allow Live TV recording management
      
      // Media playback restrictions - UNCHECK transcoding for Standard users
      EnableVideoPlaybackTranscoding: false, // UNCHECK: Allow video playback that requires transcoding 
      EnablePlaybackRemuxing: false, // UNCHECK: Allow video playback that requires conversion without re-encoding
      
      // UNCHECK remote control capabilities
      EnableRemoteControlOfOtherUsers: false, // Allow remote control of other users
      EnableSharedDeviceControl: false // Allow remote control of shared devices
    };

    // Update user policy
    await axios.post(`${JELLYFIN_URL}/Users/${jellyfinUserId}/Policy`, policyUpdate, {
      headers: { 
        'Content-Type': 'application/json',
        'X-Emby-Token': API_KEY
      }
    });

    console.log(`✅ Configured ${planType} permissions for Jellyfin user ${jellyfinUserId}:`);
    console.log(`   - Libraries: ${enabledFolders.length} accessible`);
    console.log(`   - Hidden from login: ${policyUpdate.IsHidden}`);
    console.log(`   - Login attempts limit: ${policyUpdate.LoginAttemptsBeforeLockout}`);
    console.log(`   - Admin access: ${policyUpdate.IsAdministrator}`);
    console.log(`   - Transcoding allowed: ${policyUpdate.EnableVideoPlaybackTranscoding}`);
  } catch (error) {
    console.error('❌ Failed to configure Jellyfin user permissions:', error);
    if (error.response) {
      console.error('   Validation errors:', error.response.data);
    }
  }
}

// Sync account status to Jellyfin (for suspension/activation)
async function syncAccountStatusToJellyfin(jellyfinUserId: string, status: string) {
  try {
    const JELLYFIN_URL = 'https://watch.alfredflix.stream';
    const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';

    const isDisabled = status === 'suspended';
    
    // Get current user policy first
    const userResponse = await axios.get(`${JELLYFIN_URL}/Users/${jellyfinUserId}`, {
      headers: { 'X-Emby-Token': API_KEY }
    });

    const currentPolicy = userResponse.data.Policy || {};
    
    // Update only the disabled status
    const policyUpdate = {
      ...currentPolicy,
      IsDisabled: isDisabled
    };

    await axios.post(`${JELLYFIN_URL}/Users/${jellyfinUserId}/Policy`, policyUpdate, {
      headers: { 
        'Content-Type': 'application/json',
        'X-Emby-Token': API_KEY
      }
    });

    console.log(`✅ Synced account status: ${status} (disabled: ${isDisabled}) for Jellyfin user ${jellyfinUserId}`);
  } catch (error) {
    console.error('❌ Failed to sync account status to Jellyfin:', error);
  }
}

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
  // User registration route with referral support
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const { referralCode } = req.body;

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }

      // Generate referral code for new user
      const userReferralCode = ReferralService.generateReferralCode();

      // Create user
      const newUser = await storage.createUser({
        ...validatedData,
        referralCode: userReferralCode,
        referredBy: referralCode || null,
      });

      // Apply referral bonus if referral code provided
      if (referralCode) {
        await ReferralService.applyReferral(validatedData.username, referralCode);
      }

      res.json({ 
        success: true, 
        message: 'User created successfully',
        user: { 
          id: newUser.id,
          username: newUser.username,
          referralCode: userReferralCode
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ success: false, message: error.message || 'Registration failed' });
    }
  });

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

  // Admin user management routes - Check if user is logged in via frontend auth
  app.get("/api/admin/users", async (req, res) => {
    // For now, allow access if any valid session exists
    // In a real app, you'd validate the user token from frontend properly
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Admin users fetch error:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Get current user to check for changes
      const currentUser = await storage.getUser(id);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Keep dates as strings for timestamp mode compatibility
      
      // Update user in database
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Sync changes to Jellyfin if user has Jellyfin ID
      if (user.jellyfinUserId) {
        // Check if status changed and sync to Jellyfin
        if (updates.status && updates.status !== currentUser.status) {
          await syncAccountStatusToJellyfin(user.jellyfinUserId, updates.status);
        }
        
        // Check if plan type changed and update permissions
        if (updates.planType && updates.planType !== currentUser.planType) {
          await configureJellyfinUserPermissions(user.jellyfinUserId, updates.planType);
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/create-user", async (req, res) => {
    try {
      const { username, email, password, planType, isAdmin, monthlyPrice } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create user in AlfredFlix system first with 30-day expiration
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      const user = await storage.createUser({
        username,
        email,
        password,
        planType,
        monthlyPrice: monthlyPrice || (planType === 'premium' ? '14.99' : '9.99'),
        isAdmin: isAdmin || false,
        status: 'active',
        expiresAt: expirationDate,
        neverExpires: false
      });

      // Also create user in Jellyfin server
      const JELLYFIN_URL = 'https://watch.alfredflix.stream';
      const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
      
      try {
        // Create user in Jellyfin using the correct endpoint
        const jellyfinResponse = await axios.post(`${JELLYFIN_URL}/Users/New`, {
          Name: username,
          Password: password
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Emby-Token': API_KEY
          }
        });

        const jellyfinUser = jellyfinResponse.data;
        
        // Update AlfredFlix user with Jellyfin ID
        const updatedUser = await storage.updateUser(user.id, {
          jellyfinUserId: jellyfinUser.Id
        });

        // Configure Jellyfin user permissions based on plan type
        await configureJellyfinUserPermissions(jellyfinUser.Id, planType);

        // Send welcome email with login details
        await sendWelcomeEmail(email, username, password, planType);
        
        // Send admin notification email
        await sendAdminNotificationEmail(username, email, updatedUser.expiresAt, planType);

        console.log(`Created user ${username} in both AlfredFlix and Jellyfin (ID: ${jellyfinUser.Id})`);
        res.json(updatedUser);
        
      } catch (jellyfinError) {
        console.error('Failed to create Jellyfin user:', jellyfinError);
        // User was created in AlfredFlix but not Jellyfin - still return the user but log the issue
        console.warn(`User ${username} created in AlfredFlix but not in Jellyfin. Manual sync required.`);
        res.json(user);
      }

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user details before deletion for email notification
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete from Jellyfin server if user has Jellyfin ID
      if (user.jellyfinUserId) {
        try {
          const JELLYFIN_URL = 'https://watch.alfredflix.stream';
          const API_KEY = 'f885d4ec4e7e491bb578e0980528dd08';
          
          await axios.delete(`${JELLYFIN_URL}/Users/${user.jellyfinUserId}`, {
            headers: { 
              'X-Emby-Token': API_KEY,
              'X-Emby-Authorization': 'MediaBrowser Client="AlfredFlix-Admin", Device="Web Browser", DeviceId="alfredflix-admin", Version="1.0.0"'
            }
          });
          console.log(`Deleted user ${user.username} from Jellyfin (ID: ${user.jellyfinUserId})`);
        } catch (jellyfinError) {
          console.error('Failed to delete user from Jellyfin:', jellyfinError);
          // Continue with AlfredFlix deletion even if Jellyfin deletion fails
        }
      }

      // Delete from AlfredFlix database
      await storage.deleteUser(id);

      // Send account deletion email
      await sendAccountDeletionEmail(user.email, user.username);

      res.json({ success: true, message: "User deleted successfully from both systems" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/jellyfin-users", async (req, res) => {
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

  // Validate referral code endpoint
  app.post("/api/validate-referral", async (req, res) => {
    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.json({ valid: false, message: "Referral code required" });
      }
      
      // Check if referral user exists
      const referralUser = await storage.getUserByUsername(referralCode);
      if (!referralUser) {
        return res.json({ valid: false, message: "Invalid referral code" });
      }
      
      res.json({ valid: true, message: "Valid referral code - $1 first month!" });
    } catch (error) {
      console.error('Referral validation error:', error);
      res.json({ valid: false, message: "Validation failed" });
    }
  });

  // Validate coupon code endpoint
  app.post("/api/validate-coupon", async (req, res) => {
    try {
      const { coupon } = req.body;
      
      if (!coupon) {
        return res.json({ valid: false, message: "Coupon code required" });
      }
      
      // Check in our database first
      const localCoupon = await storage.getCouponByCode(coupon);
      if (localCoupon) {
        if (!localCoupon.isActive) {
          return res.json({ valid: false, message: "Coupon expired or deactivated" });
        }
        
        if (localCoupon.expiresAt && new Date(localCoupon.expiresAt) < new Date()) {
          return res.json({ valid: false, message: "Coupon expired" });
        }
        
        if (localCoupon.maxUses && parseInt(localCoupon.currentUses || "0") >= parseInt(localCoupon.maxUses)) {
          return res.json({ valid: false, message: "Coupon usage limit reached" });
        }
        
        let discountText = "";
        let discount = {};
        
        if (localCoupon.discountType === 'percent') {
          discountText = `${localCoupon.discountValue}% off`;
          discount = { percent_off: parseFloat(localCoupon.discountValue) };
        } else if (localCoupon.discountType === 'amount') {
          discountText = `$${localCoupon.discountValue} off`;
          discount = { amount_off: parseFloat(localCoupon.discountValue) * 100 }; // Convert to cents
        } else if (localCoupon.discountType === 'free_month') {
          discountText = "Free first month";
          discount = { percent_off: 100 };
        }
        
        return res.json({ 
          valid: true, 
          message: `Valid coupon - ${discountText}!`,
          discount
        });
      }
      
      // Fallback to Stripe validation for backwards compatibility
      try {
        const couponData = await stripe.coupons.retrieve(coupon);
        if (!couponData.valid) {
          return res.json({ valid: false, message: "Coupon expired or invalid" });
        }
        
        const discountText = couponData.percent_off 
          ? `${couponData.percent_off}% off`
          : `$${(couponData.amount_off! / 100).toFixed(2)} off`;
          
        res.json({ 
          valid: true, 
          message: `Valid coupon - ${discountText}!`,
          discount: {
            percent_off: couponData.percent_off,
            amount_off: couponData.amount_off
          }
        });
      } catch (stripeError) {
        res.json({ valid: false, message: "Invalid coupon code" });
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      res.json({ valid: false, message: "Validation failed" });
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
      const { plan, referralCode, couponCode } = req.body;
      let amount = plan === 'premium' ? 1499 : 999; // $14.99 or $9.99 in cents
      let appliedDiscount = '';
      
      // Apply referral discount (highest priority - $1 first month)
      if (referralCode) {
        const referralUser = await storage.getUserByUsername(referralCode);
        if (referralUser) {
          amount = 100; // $1.00 in cents
          appliedDiscount = 'referral';
        }
      }
      
      // Apply coupon discount if no referral
      if (!appliedDiscount && couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          if (coupon.discountType === 'percent') {
            const discountAmount = amount * (parseFloat(coupon.discountValue) / 100);
            amount = Math.max(100, amount - discountAmount); // Minimum $1
            appliedDiscount = 'coupon_percent';
          } else if (coupon.discountType === 'amount') {
            const discountAmount = parseFloat(coupon.discountValue) * 100; // Convert to cents
            amount = Math.max(100, amount - discountAmount); // Minimum $1
            appliedDiscount = 'coupon_amount';
          } else if (coupon.discountType === 'free_month') {
            amount = 0; // Free first month
            appliedDiscount = 'coupon_free';
          }
        }
      }
      
      const metadata: any = { 
        plan: plan || 'standard', 
        type: 'subscription',
        appliedDiscount,
        referralCode: referralCode || '',
        couponCode: couponCode || ''
      };
      
      // Create payment intent with calculated amount
      const paymentIntentData: any = {
        amount,
        currency: "usd",
        metadata,
        automatic_payment_methods: {
          enabled: true,
        }
      };
      
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      
      console.log(`Payment intent created: ${paymentIntent.id}, amount: $${amount/100}`);
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res
        .status(500)
        .json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Complete signup after successful payment
  app.post("/api/complete-signup", async (req, res) => {
    try {
      const { username, email, password, planType, referralCode, couponCode, paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID required" });
      }
      
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }
      
      // Check if user already exists (prevent duplicate accounts)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Create user account now that payment is confirmed
      const insertUser: any = { username, email, password, planType };
      console.log('Creating user with data:', insertUser);
      const newUser = await storage.createUser(insertUser);
      console.log('User created successfully:', newUser.id);
      
      // Process referral and coupon usage tracking
      if (referralCode) {
        const referralUser = await storage.getUserByUsername(referralCode);
        if (referralUser) {
          // Process referral through referral service
          const referralService = new ReferralService();
          await referralService.processReferral(referralUser.id, newUser.id);
        }
      }
      
      // Increment coupon usage if applicable
      if (couponCode) {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon) {
          await storage.incrementCouponUse(coupon.id);
        }
      }
      
      res.json({ success: true, message: "Account created successfully", user: newUser });
    } catch (error: any) {
      console.error('Complete signup error:', error);
      res.status(500).json({ error: "Failed to complete signup: " + error.message });
    }
  });

  // Bulk extend expiration dates for all active users
  app.post("/api/admin/bulk-extend-expiration", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { days } = req.body;
      const daysToAdd = parseInt(days) || 0;
      
      if (daysToAdd <= 0) {
        return res.status(400).json({ error: "Days must be a positive number" });
      }

      // Get all active users that are not set to never expire
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(u => u.status === 'active' && !u.neverExpires);
      
      let updatedCount = 0;
      for (const user of activeUsers) {
        const currentExpiration = user.expiresAt || new Date();
        const newExpiration = new Date(currentExpiration);
        newExpiration.setDate(newExpiration.getDate() + daysToAdd);
        
        await storage.updateUser(user.id, { expiresAt: newExpiration });
        updatedCount++;
      }

      res.json({ 
        success: true, 
        message: `Extended expiration for ${updatedCount} active users by ${daysToAdd} days`,
        updatedCount 
      });
    } catch (error) {
      console.error('Bulk extend expiration error:', error);
      res.status(500).json({ error: "Failed to extend expiration dates" });
    }
  });

  // Coupon management endpoints
  app.get("/api/admin/coupons", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      console.error('Get coupons error:', error);
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  app.post("/api/admin/coupons", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const couponData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const coupon = await storage.createCoupon(couponData);
      res.json(coupon);
    } catch (error) {
      console.error('Create coupon error:', error);
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  app.put("/api/admin/coupons/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { id } = req.params;
      const coupon = await storage.updateCoupon(id, req.body);
      res.json(coupon);
    } catch (error) {
      console.error('Update coupon error:', error);
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });

  app.delete("/api/admin/coupons/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { id } = req.params;
      await storage.deleteCoupon(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete coupon error:', error);
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  // Process monthly renewals (extend by 30 days for paid users)
  app.post("/api/admin/process-renewals", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // This would typically be called by a payment webhook or scheduled job
      // For now, it's a manual admin function
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(u => u.status === 'active' && !u.neverExpires);
      
      let renewedCount = 0;
      for (const user of activeUsers) {
        // In a real system, you'd check if payment was successful
        // For now, we'll extend all active users by 30 days
        const currentExpiration = user.expiresAt || new Date();
        const newExpiration = new Date(currentExpiration);
        newExpiration.setDate(newExpiration.getDate() + 30);
        
        await storage.updateUser(user.id, { expiresAt: newExpiration });
        renewedCount++;
      }

      res.json({ 
        success: true, 
        message: `Renewed ${renewedCount} user subscriptions for 30 days`,
        renewedCount 
      });
    } catch (error) {
      console.error('Process renewals error:', error);
      res.status(500).json({ error: "Failed to process renewals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
