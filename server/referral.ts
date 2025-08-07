import { storage } from './storage';
import { nanoid } from 'nanoid';

export interface ReferralResult {
  success: boolean;
  message: string;
  discount?: {
    type: 'amount' | 'percentage';
    value: number;
  };
}

export class ReferralService {
  // Generate a unique referral code for a user
  static generateReferralCode(): string {
    return nanoid(8).toUpperCase();
  }

  // Apply referral when a new user signs up
  static async applyReferral(newUserUsername: string, referralCode: string): Promise<ReferralResult> {
    try {
      // Find the referring user by username (case insensitive)
      const referringUser = await storage.getUserByUsername(referralCode.toLowerCase());
      
      if (!referringUser) {
        return {
          success: false,
          message: 'Invalid referral code'
        };
      }

      // Check if referring user has reached max referrals (3)
      const currentCredits = parseFloat(referringUser.referralCredits || '0');
      const maxCredits = 15.00; // 3 referrals × $5 each
      
      if (currentCredits >= maxCredits) {
        return {
          success: false,
          message: 'Referral limit reached for this user'
        };
      }

      // Add $5 credit to referring user
      const newCredits = Math.min(currentCredits + 5.00, maxCredits);
      await storage.updateReferralCredits(referringUser.id, newCredits.toString());

      // New user gets $1 first month discount
      return {
        success: true,
        message: 'Referral applied successfully',
        discount: {
          type: 'amount',
          value: 100 // $1 in cents for Stripe
        }
      };
    } catch (error) {
      console.error('Error applying referral:', error);
      return {
        success: false,
        message: 'Failed to apply referral'
      };
    }
  }

  // Get referral stats for a user
  static async getReferralStats(userId: string) {
    try {
      const user = await storage.getUser(parseInt(userId));
      if (!user) return null;

      const credits = parseFloat(user.referralCredits || '0');
      const maxCredits = 15.00;
      const remainingReferrals = Math.max(0, 3 - Math.floor(credits / 5));

      return {
        referralCode: user.referralCode || user.username,
        credits: credits,
        remainingReferrals: remainingReferrals,
        totalReferrals: Math.floor(credits / 5)
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return null;
    }
  }
}