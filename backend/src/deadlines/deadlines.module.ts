import { Module } from '@nestjs/common';
import { DeadlinesService } from './deadlines.service';
import { DeadlinesController } from './deadlines.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeadlinesController],
  providers: [DeadlinesService],
  exports: [DeadlinesService], // Exported if needed by RuleEngine or others
})
export class DeadlinesModule {}
