import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async seedDatabase(): Promise<void> {
    this.logger.log('Starting database seeding...');

    // Check if data already exists
    const userCount = await this.userModel.countDocuments();
    if (userCount > 0) {
      this.logger.log('Database already contains data. Skipping seed.');
      return;
    }

    try {
      // Create sample users
      const sampleUsers = [
        {
          email: 'demo@example.com',
          username: 'demo_user',
          password: await bcrypt.hash('password123', 12),
        },
        {
          email: 'test@example.com',
          username: 'test_user',
          password: await bcrypt.hash('password123', 12),
        },
        {
          email: 'admin@example.com',
          username: 'admin_user',
          password: await bcrypt.hash('admin123', 12),
        },
      ];

      const createdUsers = await this.userModel.insertMany(sampleUsers);
      this.logger.log(`Created ${createdUsers.length} sample users`);

      // Create sample chats for the first user
      const firstUser = createdUsers[0];
      const sampleChats = [
        {
          userId: firstUser._id,
          title: 'Introduction to AI',
          messages: [
            {
              role: 'user',
              content: 'What is artificial intelligence?',
              timestamp: new Date(),
            },
            {
              role: 'assistant',
              content: 'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. It encompasses various technologies including machine learning, natural language processing, computer vision, and robotics.',
              timestamp: new Date(),
            },
          ],
        },
        {
          userId: firstUser._id,
          title: 'Machine Learning Basics',
          messages: [
            {
              role: 'user',
              content: 'Explain machine learning in simple terms',
              timestamp: new Date(),
            },
            {
              role: 'assistant',
              content: 'Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. Instead of following pre-programmed instructions, ML algorithms build mathematical models based on training data to make predictions or decisions.',
              timestamp: new Date(),
            },
            {
              role: 'user',
              content: 'What are the main types of machine learning?',
              timestamp: new Date(),
            },
            {
              role: 'assistant',
              content: 'The three main types of machine learning are: 1) Supervised Learning - learning with labeled examples, 2) Unsupervised Learning - finding patterns in data without labels, and 3) Reinforcement Learning - learning through interaction and feedback.',
              timestamp: new Date(),
            },
          ],
        },
      ];

      const createdChats = await this.chatModel.insertMany(sampleChats);
      this.logger.log(`Created ${createdChats.length} sample chats`);

      this.logger.log('Database seeding completed successfully!');
      this.logger.log('Sample credentials:');
      this.logger.log('Email: demo@example.com, Password: password123');
      this.logger.log('Email: test@example.com, Password: password123');
      this.logger.log('Email: admin@example.com, Password: admin123');

    } catch (error) {
      this.logger.error('Error seeding database:', error);
      throw error;
    }
  }

  async clearDatabase(): Promise<void> {
    this.logger.log('Clearing database...');
    
    try {
      await this.chatModel.deleteMany({});
      await this.userModel.deleteMany({});
      
      this.logger.log('Database cleared successfully!');
    } catch (error) {
      this.logger.error('Error clearing database:', error);
      throw error;
    }
  }
}
