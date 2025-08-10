import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type Coupon, type InsertCoupon, users, contactMessages, coupons , coupons} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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
  updateReferralCredits(id: string, credits: string): Promise<User>;
  setReferralCode(id: string, code: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Coupon management
  createCoupon(coupon: InsertCoupon & { createdBy: string }): Promise<Coupon>;
  getAllCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;
  incrementCouponUse(id: string): Promise<Coupon>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contactMessages: Map<string, ContactMessage>;
  private coupons: Map<string, Coupon>;

  constructor() {
    this.users = new Map();
    this.contactMessages = new Map();
    this.coupons = new Map();
    
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
      monthlyPrice: '14.99',
      status: 'active',
      isAdmin: true,
      createdAt: new Date(),
      jellyfinUserId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(adminId, adminUser);

    // Create srvadmin user in AlfredFlix system
    const srvadminId = 'srvadmin-user-id';
    const srvadminUser: User = {
      id: srvadminId,
      username: 'srvadmin',
      password: 'admin123', // You can change this
      email: 'srvadmin@alfredflix.com',
      planType: 'premium',
      monthlyPrice: '14.99',
      status: 'active',
      isAdmin: true,
      createdAt: new Date(),
      jellyfinUserId: '2bfcb58e3dce4812ad2a96657a53d597', // Real Jellyfin ID from API response
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(srvadminId, srvadminUser);

    // Create demo users in AlfredFlix system
    const stddemoId = 'stddemo-user-id';
    const stddemoUser: User = {
      id: stddemoId,
      username: 'stddemo',
      password: '12345',
      email: 'stddemo@alfredflix.com',
      planType: 'standard',
      monthlyPrice: '9.99',
      status: 'active',
      isAdmin: false,
      createdAt: new Date(),
      jellyfinUserId: 'c435ec8aa9e34d3995864085d73230c4',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(stddemoId, stddemoUser);

    const premdemoId = 'premdemo-user-id';
    const premdemoUser: User = {
      id: premdemoId,
      username: 'premdemo',
      password: '12345',
      email: 'premdemo@alfredflix.com',
      planType: 'premium',
      monthlyPrice: '14.99',
      status: 'active',
      isAdmin: false,
      createdAt: new Date(),
      jellyfinUserId: 'b017ae7d38824abd95d71d183a03b0fc',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(premdemoId, premdemoUser);

    // Create master admin user
    const masteradmId = 'masteradm-user-id';
    const masteradmUser: User = {
      id: masteradmId,
      username: 'masteradm',
      password: 'MasterPlan6172',
      email: 'masteradm@alfredflix.com',
      planType: 'premium',
      monthlyPrice: '14.99',
      status: 'active',
      isAdmin: true,
      createdAt: new Date(),
      jellyfinUserId: '500716705ea1402e81d5a5c946aefe67', // Real Jellyfin ID
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      expiresAt: null
    };
    this.users.set(masteradmId, masteradmUser);
    
    // Create test coupons
    this.createTestCoupons();
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
      status: insertUser.status || 'active',
      isAdmin: insertUser.isAdmin || false,
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

  async deleteUser(id: string): Promise<void> {
    const exists = this.users.has(id);
    if (!exists) throw new Error('User not found');
    this.users.delete(id);
  }

  // Coupon management methods
  async createCoupon(couponData: InsertCoupon & { createdBy: string }): Promise<Coupon> {
    const id = randomUUID();
    const coupon: Coupon = {
      id,
      ...couponData,
      currentUses: "0",
      createdAt: new Date(),
    };
    this.coupons.set(id, coupon);
    return coupon;
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    return Array.from(this.coupons.values()).find(c => c.code === code);
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const coupon = this.coupons.get(id);
    if (!coupon) throw new Error("Coupon not found");
    
    const updated = { ...coupon, ...updates };
    this.coupons.set(id, updated);
    return updated;
  }

  async deleteCoupon(id: string): Promise<void> {
    this.coupons.delete(id);
  }

  async incrementCouponUse(id: string): Promise<Coupon> {
    const coupon = this.coupons.get(id);
    if (!coupon) throw new Error("Coupon not found");
    
    const currentUses = parseInt(coupon.currentUses || "0");
    coupon.currentUses = (currentUses + 1).toString();
    this.coupons.set(id, coupon);
    return coupon;
  }

  private async createTestCoupons() {
    // Create demo coupons for testing
    const testCoupons = [
      {
        id: randomUUID(),
        code: 'DEMO10',
        name: '10% Off Demo',
        discountType: 'percent',
        discountValue: '10',
        isActive: true,
        oneTimeUse: false,
        newAccountsOnly: false,
        maxUses: null,
        currentUses: '0',
        expiresAt: null,
        createdAt: new Date(),
        createdBy: 'masteradm-user-id'
      },
      {
        id: randomUUID(),
        code: 'SAVE5',
        name: '$5 Off Coupon',
        discountType: 'amount',
        discountValue: '5.00',
        isActive: true,
        oneTimeUse: false,
        newAccountsOnly: true,
        maxUses: '100',
        currentUses: '0',
        expiresAt: null,
        createdAt: new Date(),
        createdBy: 'masteradm-user-id'
      },
      {
        id: randomUUID(),
        code: 'FREEMONTH',
        name: 'Free First Month',
        discountType: 'free_month',
        discountValue: '0',
        isActive: true,
        oneTimeUse: true,
        newAccountsOnly: true,
        maxUses: '10',
        currentUses: '0',
        expiresAt: null,
        createdAt: new Date(),
        createdBy: 'masteradm-user-id'
      }
    ];
    
    testCoupons.forEach(coupon => {
      this.coupons.set(coupon.id, coupon as Coupon);
    });
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        id: randomUUID(),
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db
      .insert(contactMessages)
      .values({
        ...insertMessage,
        id: randomUUID(),
        createdAt: new Date()
      })
      .returning();
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages);
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Keep string format for timestamp fields to avoid conversion issues
    const processedUpdates = { ...updates };
    
    const [user] = await db
      .update(users)
      .set(processedUpdates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error('User not found');
    return user;
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

  async updateReferralCredits(id: string, credits: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ referralCredits: credits })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error('User not found');
    return user;
  }

  async setReferralCode(id: string, code: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ referralCode: code })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error('User not found');
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id));
    if (!result.rowCount) throw new Error('User not found');
  }
}

// Initialize database and populate with initial users if empty
async function initializeDatabase() {
  try {
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log('Initializing database with default users...');
      
      // Create default admin users
      const defaultUsers = [
        {
          id: 'admin-user-id',
          username: 'admin',
          password: 'admin123',
          email: 'admin@alfredflix.com',
          planType: 'premium',
          monthlyPrice: '14.99',
          status: 'active',
          isAdmin: true,
        },
        {
          id: 'srvadmin-user-id',
          username: 'srvadmin',
          password: 'admin123',
          email: 'srvadmin@alfredflix.com',
          planType: 'premium',
          monthlyPrice: '14.99',
          status: 'active',
          isAdmin: true,
          jellyfinUserId: '2bfcb58e3dce4812ad2a96657a53d597',
        },
        {
          id: 'stddemo-user-id',
          username: 'stddemo',
          password: '12345',
          email: 'stddemo@alfredflix.com',
          planType: 'standard',
          monthlyPrice: '9.99',
          status: 'active',
          isAdmin: false,
          jellyfinUserId: 'c435ec8aa9e34d3995864085d73230c4',
        },
        {
          id: 'premdemo-user-id',
          username: 'premdemo',
          password: '12345',
          email: 'premdemo@alfredflix.com',
          planType: 'premium',
          monthlyPrice: '14.99',
          status: 'active',
          isAdmin: false,
          jellyfinUserId: 'b017ae7d38824abd95d71d183a03b0fc',
        },
        {
          id: 'masteradm-user-id',
          username: 'masteradm',
          password: 'MasterPlan6172',
          email: 'masteradm@alfredflix.com',
          planType: 'premium',
          monthlyPrice: '14.99',
          status: 'active',
          isAdmin: true,
          jellyfinUserId: '500716705ea1402e81d5a5c946aefe67',
        }
      ];

      for (const user of defaultUsers) {
        await db.insert(users).values({
          ...user,
          createdAt: new Date()
        });
      }
      
      console.log('Database initialized with default users');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Initialize and export storage
const initializeStorage = async (): Promise<IStorage> => {
  await initializeDatabase();
  return new DatabaseStorage();
};

// Export a promise that resolves to the initialized storage
export const storage = await initializeStorage();
