import { Module } from '@nestjs/common';
import { ObligationsService } from './obligations.service';
import { ObligationsController } from './obligations.controller';
import { PrismaModule } from '../prisma/prisma.module';
// RulesModule is Global, so implied available, but explicit import is fine too if not Global. I made it Global.

@Module({
  imports: [PrismaModule],
  controllers: [ObligationsController],
  providers: [ObligationsService],
})
export class ObligationsModule {}
