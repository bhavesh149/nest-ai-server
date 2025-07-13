import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chatroom, ChatroomDocument, Message } from '../schemas/chatroom.schema';
import { GeminiService, ChatMessage } from '../gemini/gemini.service';
import { QueueService } from '../queue/queue.service';
import { UserService } from '../user/user.service';
import { CacheService } from '../common/services/cache.service';
import { CreateChatroomDto, SendMessageDto, ChatroomResponseDto } from './dto/chatroom.dto';

@Injectable()
export class ChatroomService {
  constructor(
    @InjectModel(Chatroom.name) private chatroomModel: Model<ChatroomDocument>,
    private geminiService: GeminiService,
    private queueService: QueueService,
    private userService: UserService,
    private cacheService: CacheService,
  ) {}

  async createChatroom(userId: string, createChatroomDto: CreateChatroomDto): Promise<ChatroomResponseDto> {
    const { title, description } = createChatroomDto;

    const chatroom = new this.chatroomModel({
      userId: new Types.ObjectId(userId),
      title,
      description,
      messages: [],
      lastActivity: new Date(),
    });

    const savedChatroom = await chatroom.save();
    return this.formatChatroomResponse(savedChatroom);
  }

  async getUserChatrooms(userId: string): Promise<ChatroomResponseDto[]> {
    // Try to get from cache first
    const cacheKey = this.cacheService.getUserChatroomsKey(userId);
    const cachedChatrooms = await this.cacheService.get<ChatroomResponseDto[]>(cacheKey);
    
    if (cachedChatrooms) {
      return cachedChatrooms;
    }

    const chatrooms = await this.chatroomModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastActivity: -1 })
      .exec();

    const formattedChatrooms = chatrooms.map(chatroom => this.formatChatroomResponse(chatroom));
    
    // Cache for 2 minutes
    await this.cacheService.set(cacheKey, formattedChatrooms, 120);
    
    return formattedChatrooms;
  }

  async getChatroomById(userId: string, chatroomId: string): Promise<ChatroomResponseDto> {
    if (!Types.ObjectId.isValid(chatroomId)) {
      throw new NotFoundException('Invalid chatroom ID format');
    }

    // Try to get from cache first
    const cacheKey = this.cacheService.getChatroomKey(chatroomId);
    const cachedChatroom = await this.cacheService.get<ChatroomResponseDto>(cacheKey);
    
    if (cachedChatroom) {
      return cachedChatroom;
    }

    const chatroom = await this.chatroomModel
      .findOne({ _id: chatroomId, userId: new Types.ObjectId(userId) })
      .exec();

    if (!chatroom) {
      throw new NotFoundException('Chatroom not found');
    }

    const formattedChatroom = this.formatChatroomResponse(chatroom);
    
    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, formattedChatroom, 300);

    return formattedChatroom;
  }

  async sendMessage(
    userId: string, 
    chatroomId: string, 
    sendMessageDto: SendMessageDto
  ): Promise<{ message: string; response?: string; jobId?: string }> {
    const { message, history } = sendMessageDto;

    // Check user's daily limit
    const { canSend } = await this.userService.checkDailyLimit(userId);
    if (!canSend) {
      throw new ForbiddenException('Daily message limit exceeded. Please upgrade to Pro subscription.');
    }

    // Validate chatroom
    if (!Types.ObjectId.isValid(chatroomId)) {
      throw new NotFoundException('Invalid chatroom ID format');
    }

    const chatroom = await this.chatroomModel.findOne({
      _id: chatroomId,
      userId: new Types.ObjectId(userId),
    });

    if (!chatroom) {
      throw new NotFoundException('Chatroom not found');
    }

    // Add user message to chatroom
    const userMessage: Message = {
      id: new Types.ObjectId().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    chatroom.messages.push(userMessage);
    chatroom.lastActivity = new Date();
    await chatroom.save();

    // Increment user's message count
    await this.userService.incrementMessageCount(userId);

    // Add to queue for async processing
    const job = await this.queueService.addMessageJob({
      userId,
      chatId: chatroomId,
      message,
      history,
    });

    return {
      message: 'Message queued for processing.',
      jobId: job.id.toString(),
    };
  }

  async getJobStatus(jobId: string): Promise<any> {
    return this.queueService.getJobStatus(jobId);
  }

  private formatChatroomResponse(chatroom: ChatroomDocument): ChatroomResponseDto {
    return {
      id: (chatroom._id as Types.ObjectId).toString(),
      title: chatroom.title,
      description: chatroom.description,
      messages: chatroom.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      lastActivity: chatroom.lastActivity,
      createdAt: chatroom.createdAt,
      updatedAt: chatroom.updatedAt,
    };
  }
}
