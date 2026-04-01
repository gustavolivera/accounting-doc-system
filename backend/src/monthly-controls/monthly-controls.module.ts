import { Module } from '@nestjs/common';
import { MonthlyControlsService } from './monthly-controls.service';
import { MonthlyControlsController } from './monthly-controls.controller';

@Module({
  controllers: [MonthlyControlsController],
  providers: [MonthlyControlsService],
})
export class MonthlyControlsModule {}
