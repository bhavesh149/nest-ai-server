import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../schemas/subscription.schema';
import { User, UserDocument, SubscriptionTier } from '../schemas/user.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private userService: UserService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('stripe.secretKey');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-06-30.basil',
      });
    }
  }

  async createProSubscription(userId: string): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          phone: user.mobileNumber,
          email: user.email,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;

        // Update user with Stripe customer ID
        await this.userService.updateProfile(userId, {
          stripeCustomerId: customerId,
        });
      }

      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Pro Subscription',
                description: 'Unlimited AI conversations',
              },
              unit_amount: 999, // $9.99 in cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get('app.frontendUrl')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('app.frontendUrl')}/subscription/cancel`,
        metadata: {
          userId: userId,
        },
      });

      return { url: session.url! };
    } catch (error) {
      console.error('Stripe error:', error);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) return;

    try {
      // Get subscription details
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string) as any;

      // Create subscription record
      await this.subscriptionModel.create({
        userId,
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.items.data[0]?.price.currency || 'usd',
      });

      // Update user subscription
      await this.userService.updateSubscription(
        userId,
        SubscriptionTier.PRO,
        new Date(subscription.current_period_end * 1000),
        subscription.customer as string,
        subscription.id,
      );
    } catch (error) {
      console.error('Error handling checkout completed:', error);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const subscriptionId = (invoice as any).subscription as string;

    const user = await this.userModel.findOne({ stripeCustomerId: customerId });
    if (!user) return;

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId) as any;

      // Update subscription end date
      await this.subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: subscriptionId },
        {
          endDate: new Date(subscription.current_period_end * 1000),
          status: SubscriptionStatus.ACTIVE,
        }
      );

      // Update user subscription
      await this.userService.updateSubscription(
        (user._id as any).toString(),
        SubscriptionTier.PRO,
        new Date(subscription.current_period_end * 1000),
      );
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = (invoice as any).subscription as string;

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { status: SubscriptionStatus.EXPIRED }
    );
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    const user = await this.userModel.findOne({ stripeCustomerId: subscription.customer as string });
    if (!user) return;

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { status: SubscriptionStatus.CANCELLED }
    );

    // Downgrade user to basic
    await this.userService.updateSubscription(
      (user._id as any).toString(),
      SubscriptionTier.BASIC,
    );
  }

  async getSubscriptionStatus(userId: string): Promise<any> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { canSend, remaining } = await this.userService.checkDailyLimit(userId);

    return {
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt,
      remainingMessages: remaining,
      canSendMore: canSend,
    };
  }
}
