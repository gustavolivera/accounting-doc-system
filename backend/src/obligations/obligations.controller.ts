import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ObligationsService } from './obligations.service';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('obligations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('obligations')
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  @Post()
  create(@Body() createObligationDto: CreateObligationDto, @Req() req: any) {
    return this.obligationsService.create(createObligationDto, req.user.sub);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;
    return this.obligationsService.findAll(pageNumber, limitNumber, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.obligationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateObligationDto: UpdateObligationDto,
    @Req() req: any,
  ) {
    return this.obligationsService.update(
      id,
      updateObligationDto,
      req.user.sub,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.obligationsService.remove(id, req.user.sub);
  }
}
