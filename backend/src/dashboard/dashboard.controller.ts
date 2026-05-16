import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiQuery({ name: 'year', type: Number, required: true })
  @ApiQuery({ name: 'month', type: Number, required: false })
  getMetrics(@Query('year') year: string, @Query('month') month?: string) {
    return this.dashboardService.getMetrics(
      parseInt(year, 10),
      month ? parseInt(month, 10) : undefined,
    );
  }
}
