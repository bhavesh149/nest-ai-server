import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum SubscriptionTier {
  BASIC = 'basic',
  PRO = 'pro',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  mobileNumber: string;

  @Prop({ required: false, sparse: true })
  email?: string;

  @Prop({ required: false })
  username?: string;

  @Prop({ required: false })
  password?: string; // Optional for OTP-only users

  @Prop({ 
    type: String, 
    enum: Object.values(SubscriptionTier), 
    default: SubscriptionTier.BASIC 
  })
  subscriptionTier: SubscriptionTier;

  @Prop({ default: null })
  subscriptionExpiresAt?: Date;

  @Prop({ default: null })
  stripeCustomerId?: string;

  @Prop({ default: null })
  stripeSubscriptionId?: string;

  @Prop({ default: 0 })
  dailyMessageCount: number;

  @Prop({ default: Date.now })
  dailyCountResetDate: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  // OTP related fields
  @Prop({ default: null })
  otp?: string;

  @Prop({ default: null })
  otpExpiry?: Date;

  @Prop({ default: false })
  isVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ mobileNumber: 1 }, { unique: true });
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });
