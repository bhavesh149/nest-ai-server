import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { ChatroomModule } from './chatroom/chatroom.module';
import { GeminiModule } from './gemini/gemini.module';
import { GroqModule } from './groq/groq.module';
import { QueueModule } from './queue/queue.module';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { AppCacheModule } from './common/services/cache.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { User, UserSchema } from './schemas/user.schema';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chat-platform',
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    AppCacheModule,
    AuthModule,
    UserModule,
    ChatModule,
    ChatroomModule,
    GeminiModule,
    GroqModule,
    QueueModule,
    AdminModule,
    DatabaseModule,
  ],
  controllers: [AppController, SubscriptionController],
  providers: [
    AppService,
    SubscriptionService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('*');
  }
}
