import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { MonthlyControlsService } from './monthly-controls.service';
import { CreateMonthlyControlDto } from './dto/create-monthly-control.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('monthly-controls')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('monthly-controls')
export class MonthlyControlsController {
  constructor(
    private readonly monthlyControlsService: MonthlyControlsService,
  ) {}

  @Post()
  createOrUpdate(@Body() createMonthlyControlDto: CreateMonthlyControlDto) {
    return this.monthlyControlsService.createOrUpdate(createMonthlyControlDto);
  }

  @Get()
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'year', required: false })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('year') year?: number,
  ) {
    return this.monthlyControlsService.findAll(companyId, year);
  }
}
