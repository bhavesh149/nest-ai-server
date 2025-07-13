import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeminiService, ChatMessage } from '../gemini/gemini.service';
import { Chatroom, ChatroomDocument, Message } from '../schemas/chatroom.schema';
import { MessageJobData } from './queue.service';

@Processor('message-queue')
@Injectable()
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private geminiService: GeminiService,
    @InjectModel(Chatroom.name) private chatroomModel: Model<ChatroomDocument>,
  ) {}

  @Process('process-message')
  async processMessage(job: Job<MessageJobData>) {
    const { userId, chatId, message, history } = job.data;
    this.logger.log(`Processing message for user ${userId}, chatroom ${chatId}`);

    try {
      // Find the chatroom
      const chatroom = await this.chatroomModel.findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
      });

      if (!chatroom) {
        throw new Error('Chatroom not found');
      }

      // Prepare messages for Gemini API
      const geminiMessages: ChatMessage[] = [];

      // Add conversation history
      if (history && history.length > 0) {
        history.forEach(msg => {
          geminiMessages.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.content,
          });
        });
      } else {
        // Use messages from existing chatroom (last 10 for context)
        chatroom.messages.slice(-10).forEach(msg => {
          geminiMessages.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.content,
          });
        });
      }

      // Add current message
      geminiMessages.push({
        role: 'user',
        parts: message,
      });

      // Generate AI response
      const aiResponse = await this.geminiService.generateResponse(geminiMessages);

      // Add AI response to chatroom
      const assistantMessage: Message = {
        id: new Types.ObjectId().toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      chatroom.messages.push(assistantMessage);
      chatroom.lastActivity = new Date();

      // Save chatroom
      await chatroom.save();

      this.logger.log(`Message processed successfully for chatroom ${chatId}`);
      
      return {
        success: true,
        chatroomId: chatId,
        response: aiResponse,
      };
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      throw error;
    }
  }
}
