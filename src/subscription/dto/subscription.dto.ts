import { IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsOptional()
  @IsString()
  priceId?: string; // Stripe price ID for Pro plan
}

export class SubscriptionStatusDto {
  tier: string;
  status: string;
  expiresAt?: Date;
  remainingMessages?: number;
}
