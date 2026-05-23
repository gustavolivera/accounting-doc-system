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
    @Query('companyId') companyId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('status') status?: DeadlineStatus,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    const yearNumber = year ? parseInt(year, 10) : undefined;
    const monthNumber = month ? parseInt(month, 10) : undefined;
    return this.deadlinesService.findAll(
      pageNumber,
      limitNumber,
      search,
      companyId,
      yearNumber,
      monthNumber,
      status,
    );
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

  @Get('document-control/:companyId/:year')
  async getDocumentControl(
    @Param('companyId') companyId: string,
    @Param('year') year: string,
  ) {
    return this.deadlinesService.getDocumentControlDeadlines(companyId, parseInt(year, 10));
  }

  @Post('document-control/:companyId/:year/:month')
  async upsertDocumentControl(
    @Param('companyId') companyId: string,
    @Param('year') year: string,
    @Param('month') month: string,
    @Body() body: { status: string; observation?: string },
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.deadlinesService.upsertDocumentControlDeadline(
      companyId,
      parseInt(year, 10),
      parseInt(month, 10),
      body.status,
      body.observation,
      userId,
    );
  }
}
