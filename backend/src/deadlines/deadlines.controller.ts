import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { DeadlinesService } from './deadlines.service';
import { DeadlineStatus, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UpdateDeliveryStateDto } from './dto/update-delivery-state.dto';
import { GenerateDeadlinesDto } from './dto/generate-deadlines.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('deadlines')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('deadlines')
export class DeadlinesController {
  constructor(private readonly deadlinesService: DeadlinesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.deadlinesService.findAll(pageNumber, limitNumber, search);
  }

  @Patch(':id/delivery-state')
  @ApiBody({ type: UpdateDeliveryStateDto })
  updateDeliveryState(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStateDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub; // from JWT payload
    return this.deadlinesService.updateDeliveryState(id, userId, dto);
  }

  @Post('generate')
  // @Roles(Role.ADMIN)
  @ApiBody({ type: GenerateDeadlinesDto, required: false })
  async generate(@Body() dto: GenerateDeadlinesDto) {
    await this.deadlinesService.generateDeadlines(dto?.year);
    return { message: 'Geração concluída com sucesso' };
  }
}
