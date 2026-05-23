import { Module } from '@nestjs/common';
import { DeadlinesService } from './deadlines.service';
import { DeadlinesController } from './deadlines.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { DeadlinesCronService } from './deadlines.cron.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeadlinesController],
  providers: [DeadlinesService, DeadlinesCronService],
  exports: [DeadlinesService], // Exported if needed by RuleEngine or others
})
export class DeadlinesModule {}
