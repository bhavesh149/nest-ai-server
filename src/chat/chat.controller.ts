import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto, CreateChatDto, ChatResponseDto } from './dto/chat.dto';
import { Observable, map } from 'rxjs';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('create')
  async createChat(
    @Request() req: any,
    @Body(ValidationPipe) createChatDto: CreateChatDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.createChat(req.user.id, createChatDto);
  }

  @Post('message')
  async sendMessage(
    @Request() req: any,
    @Body(ValidationPipe) sendMessageDto: SendMessageDto,
  ): Promise<{ chatId: string; response: string }> {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Sse('stream')
  sendMessageStream(
    @Request() req: any,
    @Query('message') message: string,
    @Query('chatId') chatId?: string,
  ): Observable<MessageEvent> {
    const sendMessageDto: SendMessageDto = {
      message,
      chatId,
    };
    
    return this.chatService.sendMessageStream(req.user.id, sendMessageDto).pipe(
      map((data) => ({
        type: data.type,
        data: JSON.stringify(data.data),
      } as MessageEvent)),
    );
  }

  @Get('history')
  async getUserChats(@Request() req: any): Promise<ChatResponseDto[]> {
    return this.chatService.getUserChats(req.user.id);
  }

  @Get(':chatId')
  async getChatById(
    @Request() req: any,
    @Param('chatId') chatId: string,
  ): Promise<ChatResponseDto> {
    return this.chatService.getChatById(req.user.id, chatId);
  }

  @Delete(':chatId')
  async deleteChat(
    @Request() req: any,
    @Param('chatId') chatId: string,
  ): Promise<{ message: string }> {
    await this.chatService.deleteChat(req.user.id, chatId);
    return { message: 'Chat deleted successfully' };
  }
}
