import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, Message } from '../schemas/chat.schema';
import { GroqService, ChatMessage } from '../groq/groq.service';
import { SendMessageDto, CreateChatDto, ChatResponseDto } from './dto/chat.dto';
import { Observable } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private groqService: GroqService,
  ) {}

  async createChat(userId: string, createChatDto: CreateChatDto): Promise<ChatResponseDto> {
    const { title, firstMessage } = createChatDto;

    const chat = new this.chatModel({
      userId: new Types.ObjectId(userId),
      title,
      messages: [{
        role: 'user',
        content: firstMessage,
        timestamp: new Date(),
      }],
    });

    const savedChat = await chat.save();
    return this.formatChatResponse(savedChat);
  }

  async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<{ chatId: string; response: string }> {
    const { message, chatId, history } = sendMessageDto;

    let chat: ChatDocument;

    if (chatId) {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(chatId)) {
        throw new NotFoundException('Invalid chat ID format');
      }

      // Find existing chat
      const foundChat = await this.chatModel.findOne({ _id: chatId, userId: new Types.ObjectId(userId) });
      if (!foundChat) {
        throw new NotFoundException('Chat not found');
      }
      chat = foundChat;
    } else {
      // Create new chat
      const title = this.groqService.generateChatTitle(message);
      chat = new this.chatModel({
        userId: new Types.ObjectId(userId),
        title,
        messages: [],
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Prepare messages for Groq API
    const groqMessages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide helpful, accurate, and concise responses.',
      },
    ];

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach(msg => {
        groqMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      });
    } else {
      // Use messages from existing chat
      chat.messages.slice(-10).forEach(msg => { // Last 10 messages for context
        groqMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      });
    }

    // Get AI response
    const aiResponse = await this.groqService.generateResponse(groqMessages);

    // Add AI response to chat
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });

    // Save chat
    await chat.save();

    return {
      chatId: (chat._id as Types.ObjectId).toString(),
      response: aiResponse,
    };
  }

  sendMessageStream(userId: string, sendMessageDto: SendMessageDto): Observable<{ type: string; data: any }> {
    return new Observable((subscriber) => {
      this.processStreamMessage(userId, sendMessageDto, subscriber);
    });
  }

  private async processStreamMessage(userId: string, sendMessageDto: SendMessageDto, subscriber: any): Promise<void> {
    try {
      const { message, chatId, history } = sendMessageDto;

      let chat: ChatDocument;

      if (chatId) {
        // Validate ObjectId format
        if (!Types.ObjectId.isValid(chatId)) {
          subscriber.error(new NotFoundException('Invalid chat ID format'));
          return;
        }

        const foundChat = await this.chatModel.findOne({ _id: chatId, userId: new Types.ObjectId(userId) });
        if (!foundChat) {
          subscriber.error(new NotFoundException('Chat not found'));
          return;
        }
        chat = foundChat;
      } else {
        const title = this.groqService.generateChatTitle(message);
        chat = new this.chatModel({
          userId: new Types.ObjectId(userId),
          title,
          messages: [],
        });
      }

      // Add user message
      chat.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Send chat info first
      subscriber.next({
        type: 'chat_info',
        data: {
          chatId: (chat._id as Types.ObjectId).toString(),
          title: chat.title,
        },
      });

      // Prepare messages for Groq API
      const groqMessages: ChatMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide helpful, accurate, and concise responses.',
        },
      ];

      // Add conversation history
      if (history && history.length > 0) {
        history.forEach(msg => {
          groqMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        });
      } else {
        chat.messages.slice(-10).forEach(msg => {
          groqMessages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        });
      }

      let fullResponse = '';

      // Stream AI response
      const streamSubscription = this.groqService.generateStreamResponse(groqMessages).subscribe({
        next: (chunk) => {
          fullResponse += chunk;
          subscriber.next({
            type: 'content',
            data: { chunk },
          });
        },
        error: (error) => {
          subscriber.error(error);
        },
        complete: async () => {
          // Add AI response to chat
          chat.messages.push({
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
          });

          // Save chat
          await chat.save();

          subscriber.next({
            type: 'complete',
            data: {
              chatId: (chat._id as Types.ObjectId).toString(),
              response: fullResponse,
            },
          });

          subscriber.complete();
        },
      });
    } catch (error) {
      subscriber.error(error);
    }
  }

  async getUserChats(userId: string): Promise<ChatResponseDto[]> {
    const chats = await this.chatModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();

    return chats.map(chat => this.formatChatResponse(chat));
  }

  async getChatById(userId: string, chatId: string): Promise<ChatResponseDto> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(chatId)) {
      throw new NotFoundException('Invalid chat ID format');
    }

    const chat = await this.chatModel
      .findOne({ _id: chatId, userId: new Types.ObjectId(userId) })
      .exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return this.formatChatResponse(chat);
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(chatId)) {
      throw new NotFoundException('Invalid chat ID format');
    }

    const result = await this.chatModel
      .deleteOne({ _id: chatId, userId: new Types.ObjectId(userId) })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Chat not found');
    }
  }

  private formatChatResponse(chat: ChatDocument): ChatResponseDto {
    return {
      id: (chat._id as Types.ObjectId).toString(),
      title: chat.title,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}
