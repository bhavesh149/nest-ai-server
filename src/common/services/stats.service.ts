import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Chat, ChatDocument } from '../../schemas/chat.schema';

export interface ApiStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  activeUsersLast24h: number;
  averageMessagesPerChat: number;
  mostActiveUsers: Array<{
    userId: string;
    email: string;
    messageCount: number;
  }>;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async getApiStats(): Promise<ApiStats> {
    const [
      totalUsers,
      totalChats,
      chatsWithMessages,
      recentUsers,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.chatModel.countDocuments(),
      this.chatModel.find().select('messages userId'),
      this.userModel.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).countDocuments(),
    ]);

    // Calculate total messages
    const totalMessages = chatsWithMessages.reduce(
      (total, chat) => total + chat.messages.length,
      0,
    );

    // Calculate average messages per chat
    const averageMessagesPerChat = totalChats > 0 ? totalMessages / totalChats : 0;

    // Get most active users (top 5)
    const userMessageCounts = new Map<string, { email: string; count: number }>();
    
    for (const chat of chatsWithMessages) {
      const userId = chat.userId.toString();
      const messageCount = chat.messages.filter(msg => msg.role === 'user').length;
      
      if (userMessageCounts.has(userId)) {
        userMessageCounts.get(userId)!.count += messageCount;
      } else {
        const user = await this.userModel.findById(userId).select('email');
        if (user) {
          userMessageCounts.set(userId, {
            email: user.email,
            count: messageCount,
          });
        }
      }
    }

    const mostActiveUsers = Array.from(userMessageCounts.entries())
      .map(([userId, data]) => ({
        userId,
        email: data.email,
        messageCount: data.count,
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    return {
      totalUsers,
      totalChats,
      totalMessages,
      activeUsersLast24h: recentUsers,
      averageMessagesPerChat: Math.round(averageMessagesPerChat * 100) / 100,
      mostActiveUsers,
    };
  }

  async getUserStats(userId: string) {
    const [userChats, user] = await Promise.all([
      this.chatModel.find({ userId }),
      this.userModel.findById(userId).select('-password'),
    ]);

    if (!user) {
      return null;
    }

    const totalMessages = userChats.reduce(
      (total, chat) => total + chat.messages.length,
      0,
    );

    const userMessages = userChats.reduce(
      (total, chat) => total + chat.messages.filter(msg => msg.role === 'user').length,
      0,
    );

    const aiResponses = totalMessages - userMessages;

    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        joinedDate: user.createdAt,
      },
      stats: {
        totalChats: userChats.length,
        totalMessages: userMessages,
        aiResponses,
        averageMessagesPerChat: userChats.length > 0 ? userMessages / userChats.length : 0,
        lastActivity: userChats.length > 0 
          ? Math.max(...userChats.map(chat => new Date(chat.updatedAt).getTime()))
          : null,
      },
    };
  }
}
