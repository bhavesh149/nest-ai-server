import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, SubscriptionTier } from '../schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(mobileNumber: string, email?: string, username?: string, password?: string): Promise<UserDocument> {
    const userData: any = {
      mobileNumber,
      subscriptionTier: SubscriptionTier.BASIC,
      isVerified: false,
    };

    // Only set email if it's provided and not empty
    if (email && email.trim()) {
      userData.email = email.trim();
    }

    // Only set username if it's provided and not empty
    if (username && username.trim()) {
      userData.username = username.trim();
    }

    if (password) {
      userData.password = await bcrypt.hash(password, 12);
    }

    const user = new this.userModel(userData);
    return user.save();
  }

  async findByMobileNumber(mobileNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ mobileNumber }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateProfile(id: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async saveOtp(mobileNumber: string, otp: string): Promise<void> {
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await this.userModel.findOneAndUpdate(
      { mobileNumber },
      { 
        otp, 
        otpExpiry,
      },
      { upsert: false }
    );
  }

  async verifyOtp(mobileNumber: string, otp: string): Promise<boolean> {
    const user = await this.findByMobileNumber(mobileNumber);
    
    if (!user || !user.otp || !user.otpExpiry) {
      return false;
    }

    if (user.otpExpiry < new Date()) {
      return false; // OTP expired
    }

    return user.otp === otp;
  }

  async markAsVerified(mobileNumber: string): Promise<void> {
    await this.userModel.findOneAndUpdate(
      { mobileNumber },
      { 
        isVerified: true,
        otp: null,
        otpExpiry: null,
      }
    );
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    
    if (!user || !user.password) {
      throw new NotFoundException('User not found or no password set');
    }

    const isValidPassword = await this.validatePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.updateProfile(id, { password: hashedNewPassword });
  }

  async updateSubscription(
    userId: string, 
    tier: SubscriptionTier, 
    expiresAt?: Date,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<void> {
    const updateData: any = {
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
    };

    if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;

    await this.updateProfile(userId, updateData);
  }

  async checkDailyLimit(userId: string): Promise<{ canSend: boolean; remaining: number }> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if we need to reset daily count
    const today = new Date();
    const resetDate = new Date(user.dailyCountResetDate);
    
    if (today.toDateString() !== resetDate.toDateString()) {
      // Reset daily count
      user.dailyMessageCount = 0;
      user.dailyCountResetDate = today;
      await user.save();
    }

    // Check limits based on subscription tier
    let dailyLimit = 5; // Basic tier limit
    
    if (user.subscriptionTier === SubscriptionTier.PRO) {
      dailyLimit = 1000; // Pro tier limit (effectively unlimited)
    }

    const canSend = user.dailyMessageCount < dailyLimit;
    const remaining = Math.max(0, dailyLimit - user.dailyMessageCount);

    return { canSend, remaining };
  }

  async incrementMessageCount(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { dailyMessageCount: 1 } }
    );
  }
}
