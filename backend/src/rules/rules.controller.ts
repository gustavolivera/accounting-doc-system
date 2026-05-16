import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ConditionOperator, Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

export class PreviewRulesDto {
  criteria: {
    criterionCode: string;
    operator: ConditionOperator;
    value: string;
  }[];
}

@ApiTags('rules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('rules')
export class RulesController {
  constructor(private readonly ruleEngineService: RuleEngineService) {}

  @Post('preview')
  @ApiBody({ type: PreviewRulesDto })
  async preview(@Body() dto: PreviewRulesDto) {
    return this.ruleEngineService.previewImpact(dto.criteria);
  }
}
