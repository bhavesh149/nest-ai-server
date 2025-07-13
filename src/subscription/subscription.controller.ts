import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import Stripe from 'stripe';

@Controller()
export class SubscriptionController {
  private stripe: Stripe;

  constructor(
    private subscriptionService: SubscriptionService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('stripe.secretKey');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-06-30.basil',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe/pro')
  async createProSubscription(
    @Request() req: any,
    @Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<{ url: string }> {
    return this.subscriptionService.createProSubscription(req.user.id);
  }

  @Public()
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid signature');
    }

    await this.subscriptionService.handleStripeWebhook(event);

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/status')
  async getSubscriptionStatus(@Request() req: any): Promise<any> {
    return this.subscriptionService.getSubscriptionStatus(req.user.id);
  }
}
