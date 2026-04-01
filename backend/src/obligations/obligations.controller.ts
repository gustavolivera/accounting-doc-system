import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ObligationsService } from './obligations.service';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('obligations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('obligations')
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  @Post()
  create(@Body() createObligationDto: CreateObligationDto) {
    return this.obligationsService.create(createObligationDto);
  }

  @Get()
  findAll() {
    return this.obligationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.obligationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateObligationDto: UpdateObligationDto) {
    return this.obligationsService.update(id, updateObligationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.obligationsService.remove(id);
  }
}
