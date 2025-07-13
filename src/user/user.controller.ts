import { Controller, Get, Put, Post, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { ChangePasswordDto } from '../auth/dto/auth.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    const user = await this.userService.findById(req.user.id);
    const { canSend, remaining } = await this.userService.checkDailyLimit(req.user.id);
    
    return {
      id: req.user.id,
      mobileNumber: user?.mobileNumber,
      email: user?.email,
      username: user?.username,
      subscriptionTier: user?.subscriptionTier,
      isVerified: user?.isVerified,
      dailyMessageCount: user?.dailyMessageCount,
      remainingMessages: remaining,
      canSendMessages: canSend,
      createdAt: user?.createdAt,
    };
  }

  @Get('profile')
  async getUserProfile(@Request() req: any) {
    return this.getProfile(req);
  }

  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(req.user.id, updateProfileDto);
    return {
      id: req.user.id,
      mobileNumber: updatedUser.mobileNumber,
      email: updatedUser.email,
      username: updatedUser.username,
      subscriptionTier: updatedUser.subscriptionTier,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Post('change-password')
  async changePassword(
    @Request() req: any,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      req.user.id, 
      changePasswordDto.currentPassword, 
      changePasswordDto.newPassword
    );
    return { message: 'Password changed successfully' };
  }
}
