import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: any,
  ) {
    try {
      await this.prisma.auditEvent.create({
        data: {
          userId,
          action,
          entity: entityType,
          entityId,
          details: details ? JSON.stringify(details) : undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log audit event: ${error.message}`,
        error.stack,
      );
    }
  }
}
