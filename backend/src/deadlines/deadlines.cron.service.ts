import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeadlinesCronService {
  private readonly logger = new Logger(DeadlinesCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueDeadlines() {
    this.logger.log('Starting daily overdue deadlines check...');

    // Get beginning of today (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const result = await this.prisma.deadline.updateMany({
        where: {
          status: 'PENDENTE',
          dueDate: {
            lt: today,
          },
        },
        data: {
          status: 'ATRASADO',
        },
      });

      this.logger.log(`Updated ${result.count} deadlines to ATRASADO.`);
    } catch (error) {
      this.logger.error('Failed to update overdue deadlines', error);
    }
  }
}
