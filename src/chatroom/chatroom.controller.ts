import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatroomService } from './chatroom.service';
import { CreateChatroomDto, SendMessageDto, ChatroomResponseDto } from './dto/chatroom.dto';

@Controller('chatroom')
@UseGuards(JwtAuthGuard)
export class ChatroomController {
  constructor(private chatroomService: ChatroomService) {}

  @Post()
  async createChatroom(
    @Request() req: any,
    @Body(ValidationPipe) createChatroomDto: CreateChatroomDto,
  ): Promise<ChatroomResponseDto> {
    return this.chatroomService.createChatroom(req.user.id, createChatroomDto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes cache
  async getUserChatrooms(@Request() req: any): Promise<ChatroomResponseDto[]> {
    return this.chatroomService.getUserChatrooms(req.user.id);
  }

  @Get(':id')
  async getChatroomById(
    @Request() req: any,
    @Param('id') chatroomId: string,
  ): Promise<ChatroomResponseDto> {
    return this.chatroomService.getChatroomById(req.user.id, chatroomId);
  }

  @Post(':id/message')
  async sendMessage(
    @Request() req: any,
    @Param('id') chatroomId: string,
    @Body(ValidationPipe) sendMessageDto: SendMessageDto,
  ): Promise<{ message: string; jobId?: string; response?: string }> {
    return this.chatroomService.sendMessage(req.user.id, chatroomId, sendMessageDto);
  }

  @Get('job/:jobId/status')
  async getJobStatus(@Param('jobId') jobId: string): Promise<any> {
    return this.chatroomService.getJobStatus(jobId);
  }
}
