import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from '../common/services/stats.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private statsService: StatsService) {}

  @Get('stats')
  async getApiStats() {
    return this.statsService.getApiStats();
  }

  @Get('users/:userId/stats')
  async getUserStats(@Param('userId') userId: string) {
    const stats = await this.statsService.getUserStats(userId);
    if (!stats) {
      return { message: 'User not found' };
    }
    return stats;
  }
}
