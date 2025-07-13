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
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password') || undefined,
        },
      }),
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
