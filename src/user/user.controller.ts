import { Controller, Get, Put, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.userService.findById(req.user.id);
    return {
      id: req.user.id,
      email: user?.email,
      username: user?.username,
      createdAt: user?.createdAt,
    };
  }

  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(req.user.id, updateProfileDto);
    return {
      id: req.user.id,
      email: updatedUser.email,
      username: updatedUser.username,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
