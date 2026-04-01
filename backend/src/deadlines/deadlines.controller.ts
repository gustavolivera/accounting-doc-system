import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { DeadlinesService } from './deadlines.service';
import { DeadlineStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('deadlines')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('deadlines')
export class DeadlinesController {
  constructor(private readonly deadlinesService: DeadlinesService) {}

  @Get()
  findAll() {
    return this.deadlinesService.findAll();
  }

  @Patch(':id/status')
  @ApiQuery({ name: 'status', enum: DeadlineStatus })
  updateStatus(@Param('id') id: string, @Query('status') status: DeadlineStatus) {
    return this.deadlinesService.updateStatus(id, status);
  }
  
  // Endpoint to manual trigger generation (helpful for testing)
  @Get('generate')
  generate() {
      this.deadlinesService.generateAllDeadlines();
      return { message: 'Generation triggered' };
  }
}
