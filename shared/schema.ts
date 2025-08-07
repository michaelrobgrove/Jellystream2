import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  planType: text("plan_type").notNull().default("standard"),
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }).default("9.99"),
  jellyfinUserId: text("jellyfin_user_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"),
  isAdmin: boolean("is_admin").notNull().default(false),
  expiresAt: timestamp("expires_at", { mode: 'string' }).default(sql`NOW() + INTERVAL '30 days'`),
  neverExpires: boolean("never_expires").notNull().default(false),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  referralCredits: numeric("referral_credits", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchProgress = pgTable("watch_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  jellyfinItemId: text("jellyfin_item_id").notNull(),
  progressTicks: text("progress_ticks").notNull().default("0"),
  totalTicks: text("total_ticks").notNull(),
  isWatched: boolean("is_watched").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  discountType: text("discount_type").notNull(), // 'percent', 'amount', 'free_month'
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  oneTimeUse: boolean("one_time_use").notNull().default(false),
  newAccountsOnly: boolean("new_accounts_only").notNull().default(false),
  maxUses: numeric("max_uses", { precision: 10, scale: 0 }),
  currentUses: numeric("current_uses", { precision: 10, scale: 0 }).default("0"),
  expiresAt: timestamp("expires_at", { mode: 'string' }),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  planType: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  phone: true,
  message: true,
});

export const insertWatchProgressSchema = createInsertSchema(watchProgress).pick({
  userId: true,
  jellyfinItemId: true,
  progressTicks: true,
  totalTicks: true,
  isWatched: true,
});

export const insertCouponSchema = createInsertSchema(coupons).pick({
  code: true,
  name: true,
  discountType: true,
  discountValue: true,
  isActive: true,
  oneTimeUse: true,
  newAccountsOnly: true,
  maxUses: true,
  expiresAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertWatchProgress = z.infer<typeof insertWatchProgressSchema>;
export type WatchProgress = typeof watchProgress.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
