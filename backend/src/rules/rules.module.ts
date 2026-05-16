import { Module, Global } from '@nestjs/common';
import { RuleEngineService } from './rule-engine.service';
import { PrismaModule } from '../prisma/prisma.module';

import { DeadlinesModule } from '../deadlines/deadlines.module';
import { RulesController } from './rules.controller';

@Global() // Make it global so CompaniesModule and ObligationsModule can use it easily without cyclic imports issues if handled carefully, or just standard export. Global is easier for helper services.
@Module({
  imports: [PrismaModule, DeadlinesModule],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
  controllers: [RulesController],
})
export class RulesModule {}
