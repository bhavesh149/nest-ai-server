import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueService } from './queue.service';
import { MessageProcessor } from './message.processor';
import { GeminiModule } from '../gemini/gemini.module';
import { Chatroom, ChatroomSchema } from '../schemas/chatroom.schema';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Use in-memory fallback for Lambda if Redis is not available
        const redisHost = configService.get('redis.host') || process.env.REDIS_HOST;
        
        if (!redisHost) {
          console.warn('Redis not configured, using fallback queue processing');
          return {
            redis: {
              host: 'localhost',
              port: 6379,
              lazyConnect: true,
              maxRetriesPerRequest: 1,
            },
          };
        }

        const redisPort = parseInt(configService.get('redis.port') || process.env.REDIS_PORT || '6379', 10);

        return {
          redis: {
            host: redisHost,
            port: redisPort,
            password: configService.get('redis.password') || process.env.REDIS_PASSWORD || undefined,
            connectTimeout: 10000,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'message-queue',
    }),
    MongooseModule.forFeature([
      { name: Chatroom.name, schema: ChatroomSchema },
    ]),
    GeminiModule,
  ],
  providers: [QueueService, MessageProcessor],
  exports: [QueueService],
})
export class QueueModule {}
