import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { StatsService } from '../common/services/stats.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Chat, ChatSchema } from '../schemas/chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [StatsService],
  exports: [StatsService],
})
export class AdminModule {}
