import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ChatroomController } from './chatroom.controller';
import { ChatroomService } from './chatroom.service';
import { Chatroom, ChatroomSchema } from '../schemas/chatroom.schema';
import { Chat, ChatSchema } from '../schemas/chat.schema';
import { GeminiModule } from '../gemini/gemini.module';
import { QueueModule } from '../queue/queue.module';
import { UserModule } from '../user/user.module';
import { AppCacheModule } from '../common/services/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chatroom.name, schema: ChatroomSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    AppCacheModule,
    GeminiModule,
    QueueModule,
    UserModule,
  ],
  controllers: [ChatroomController],
  providers: [ChatroomService],
  exports: [ChatroomService],
})
export class ChatroomModule {}
