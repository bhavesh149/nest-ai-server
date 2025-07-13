import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionTier } from './user.schema';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(SubscriptionTier), 
    required: true 
  })
  tier: SubscriptionTier;

  @Prop({ 
    type: String, 
    enum: Object.values(SubscriptionStatus), 
    default: SubscriptionStatus.PENDING 
  })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: false })
  stripeSubscriptionId?: string;

  @Prop({ required: false })
  stripeCustomerId?: string;

  @Prop({ required: false })
  stripePriceId?: string;

  @Prop({ default: 0 })
  amount: number; // in cents

  @Prop({ default: 'usd' })
  currency: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
