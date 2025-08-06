import { type User, type InsertUser, type ContactMessage, type InsertContactMessage } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;
  updateUserStripeInfo(id: string, info: { customerId: string; subscriptionId: string }): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contactMessages: Map<string, ContactMessage>;

  constructor() {
    this.users = new Map();
    this.contactMessages = new Map();
    
    // Create default admin user for testing
    this.createAdminUser();
  }

  private async createAdminUser() {
    const adminId = 'admin-user-id';
    const adminUser: User = {
      id: adminId,
      username: 'admin',
      password: 'admin123',
      email: 'admin@alfredflix.com',
      planType: 'premium',
      status: 'active',
      isAdmin: true,
      createdAt: new Date(),
      jellyfinUserId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(adminId, adminUser);

    // Also create a test standard user
    const testUserId = 'test-user-id';
    const testUser: User = {
      id: testUserId,
      username: 'testuser',
      password: 'test123',
      email: 'test@alfredflix.com',
      planType: 'standard',
      status: 'active',
      isAdmin: false,
      createdAt: new Date(),
      jellyfinUserId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(testUserId, testUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      planType: insertUser.planType || 'standard',
      status: 'active',
      isAdmin: false,
      createdAt: new Date(),
      jellyfinUserId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(id, user);
    return user;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = {
      ...insertMessage,
      id,
      phone: insertMessage.phone || null,
      status: 'new',
      createdAt: new Date()
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error('User not found');
    
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(id: string, info: { customerId: string; subscriptionId: string }): Promise<User> {
    return this.updateUser(id, { 
      stripeCustomerId: info.customerId, 
      stripeSubscriptionId: info.subscriptionId 
    });
  }
}

export const storage = new MemStorage();
