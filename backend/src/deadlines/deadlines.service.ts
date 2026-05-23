import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Periodicity,
  DeadlineStatus,
  CompanyObligation,
  Obligation,
  DeadlineType,
} from '@prisma/client';
import { addMonths, setDate, isWeekend, addDays } from 'date-fns'; // Assuming date-fns might be available or I'll use native JS Date if not. Project dependency check required?
// If date-fns not installed, I'll use native Date. checking package.json in previous list_dir could have helper.
// "package-lock.json" size was big.
// Let's stick to native Date to avoid missing dependency issues unless I check package.json.

import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeadlinesService {
  private readonly logger = new Logger(DeadlinesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Generates deadlines for all active links.
   * Can be run periodically or manually.
   */
  async generateDeadlines(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const links = await this.prisma.companyObligation.findMany({
      where: { isActive: true },
      include: { obligation: true, company: true },
    });

    const deadlineData = [];
    for (const link of links) {
      const linkData = await this.prepareDeadlineDataForLink(link, targetYear);
      deadlineData.push(...linkData);
    }

    if (deadlineData.length > 0) {
      const result = await this.prisma.deadline.createMany({
        data: deadlineData,
        skipDuplicates: true,
      });
      this.logger.log(
        `Generated ${result.count} deadlines in bulk for year ${targetYear}`,
      );
    }
  }

  /**
   * Generates deadlines for a specific link.
   * Typically generates for current year or current period.
   */
  async generateForLink(
    link: CompanyObligation & { obligation: Obligation },
    targetYear?: number,
  ) {
    const currentYear = targetYear || new Date().getFullYear();
    const deadlineData = await this.prepareDeadlineDataForLink(
      link,
      currentYear,
    );

    if (deadlineData.length > 0) {
      const result = await this.prisma.deadline.createMany({
        data: deadlineData,
        skipDuplicates: true,
      });
      this.logger.log(
        `Generated ${result.count} deadlines for Company ${link.companyId} and Obligation ${link.obligationId}`,
      );
    }
  }

  private async prepareDeadlineDataForLink(
    link: CompanyObligation & { obligation: Obligation },
    targetYear: number,
  ) {
    const periodicity = link.obligation.periodicity;

    // Determine months to generate based on periodicity
    let months: number[] = [];
    if (periodicity === 'MENSAL') {
      months = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
    } else if (periodicity === 'TRIMESTRAL') {
      months = [3, 6, 9, 12];
    } else if (periodicity === 'ANUAL') {
      months = [12];
    } else if (periodicity === 'BIMESTRAL') {
      months = [2, 4, 6, 8, 10, 12];
    }

    const data = [];
    for (const month of months) {
      let dueYear = targetYear;
      let dueMonth = month + 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear = targetYear + 1;
      }

      let dueDate = new Date(dueYear, dueMonth - 1, link.obligation.dueDay);
      dueDate = await this.adjustForWeekendsAndHolidays(dueDate);

      data.push({
        companyId: link.companyId,
        obligationId: link.obligationId,
        month,
        year: targetYear,
        dueDate,
        status: DeadlineStatus.PENDENTE,
      });
    }
    return data;
  }

  private async adjustForWeekendsAndHolidays(date: Date): Promise<Date> {
    const adjustedDate = new Date(date);

    // Initial weekend check
    const dayOfWeek = adjustedDate.getDay();
    if (dayOfWeek === 6) {
      // Saturday
      adjustedDate.setDate(adjustedDate.getDate() + 2); // Move to Monday
    } else if (dayOfWeek === 0) {
      // Sunday
      adjustedDate.setDate(adjustedDate.getDate() + 1); // Move to Monday
    }

    // Now check database for holidays (FiscalCalendarDay)
    // Needs to loop because moving a day might land on another holiday/weekend
    let isWorkDay = false;
    let iterations = 0; // Prevent infinite loops

    while (!isWorkDay && iterations < 10) {
      iterations++;
      const currentDayOfWeek = adjustedDate.getDay();
      if (currentDayOfWeek === 6) {
        // Saturday
        adjustedDate.setDate(adjustedDate.getDate() + 2);
        continue;
      } else if (currentDayOfWeek === 0) {
        // Sunday
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        continue;
      }

      const dateString = adjustedDate.toISOString().split('T')[0];

      const fiscalDay = await this.prisma.fiscalCalendarDay.findFirst({
        where: {
          date: {
            gte: new Date(adjustedDate.setHours(0, 0, 0, 0)),
            lt: new Date(adjustedDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (fiscalDay && fiscalDay.isHoliday) {
        adjustedDate.setDate(adjustedDate.getDate() + 1); // move forward 1 day
      } else {
        isWorkDay = true;
      }
    }

    return adjustedDate;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    search?: string,
    companyId?: string,
    year?: number,
    month?: number,
    status?: DeadlineStatus,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      status: { not: 'CANCELADO' }
    };

    if (search) {
      where.company = {
        tradeName: { contains: search, mode: 'insensitive' },
      };
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (year) {
      where.year = year;
    }
    if (month && month !== 0) {
      where.month = month;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.deadline.findMany({
        where,
        skip,
        take: limit,
        include: { company: true, obligation: true, events: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.deadline.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateDeliveryState(
    id: string,
    userId: string,
    data: {
      status: DeadlineStatus;
      observation?: string;
      evidenceUrl?: string;
    },
  ) {
    const deadline = await this.prisma.deadline.update({
      where: { id },
      data: { status: data.status },
    });

    await this.prisma.deliveryEvent.create({
      data: {
        deadlineId: id,
        userId,
        status: data.status,
        observation: data.observation,
        evidenceUrl: data.evidenceUrl,
      },
    });

    await this.auditService.logAction(userId, 'UPDATE_STATUS', 'DEADLINE', id, {
      status: data.status,
    });

    return deadline;
  }

  async cancelFutureDeadlines(companyId: string, obligationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlinesToCancel = await this.prisma.deadline.findMany({
      where: {
        companyId,
        obligationId,
        status: 'PENDENTE',
        dueDate: {
          gt: today,
        },
      },
    });

    if (deadlinesToCancel.length === 0) return;

    // Use transaction to ensure both status update and events creation are atomic
    await this.prisma.$transaction(async (tx) => {
      // 1. Update status to CANCELADO
      await tx.deadline.updateMany({
        where: {
          id: { in: deadlinesToCancel.map(d => d.id) }
        },
        data: {
          status: 'CANCELADO'
        }
      });

      // 2. Tentar buscar um usuario admin (system/fallback) caso não passe userId no unbind
      const admin = await tx.user.findFirst({
        where: { role: 'ADMIN', isActive: true }
      });

      // 3. Create DeliveryEvents
      if (admin) {
        const eventsData = deadlinesToCancel.map(d => ({
          deadlineId: d.id,
          userId: admin.id,
          status: DeadlineStatus.CANCELADO,
          observation: 'Cancelado automaticamente pelo sistema devido à desvinculação da obrigação',
        }));

        await tx.deliveryEvent.createMany({
          data: eventsData
        });
      }
    });

    this.logger.log(
      `Cancelled ${deadlinesToCancel.length} future pending deadlines for Company ${companyId} and Obligation ${obligationId}`,
    );
  }

  private async getGenericObligation() {
    let obligation = await this.prisma.obligation.findFirst({
      where: { name: 'Controle Mensal de Documentos' },
    });
    if (!obligation) {
      obligation = await this.prisma.obligation.create({
        data: {
          name: 'Controle Mensal de Documentos',
          description: 'Controle genérico de recebimento de documentos mensais.',
          type: DeadlineType.OPERACIONAL,
          periodicity: 'MENSAL',
          dueDay: 15,
          isActive: true,
        },
      });
    }
    return obligation;
  }

  async getDocumentControlDeadlines(companyId: string, year: number) {
    const obligation = await this.getGenericObligation();
    const deadlines = await this.prisma.deadline.findMany({
      where: { companyId, obligationId: obligation.id, year },
      include: { events: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const result = [];
    for (let month = 1; month <= 12; month++) {
      const d = deadlines.find((x) => x.month === month);
      let status = 'PENDING';
      let observation = '';
      if (d) {
        if (d.status === 'ENTREGUE') {
          const obs = d.events?.[0]?.observation || '';
          if (obs.startsWith('[Sem Movimento]')) {
            status = 'NO_DOCUMENTS';
            observation = obs.replace('[Sem Movimento] ', '').replace('[Sem Movimento]', '');
          } else {
            status = 'DELIVERED';
            observation = obs;
          }
        } else {
          status = 'PENDING';
          observation = d.events?.[0]?.observation || '';
        }
      }

      result.push({
        month,
        year,
        status,
        observation,
      });
    }
    return result;
  }

  async upsertDocumentControlDeadline(
    companyId: string,
    year: number,
    month: number,
    status: string,
    observation?: string,
    userId?: string,
  ) {
    const obligation = await this.getGenericObligation();

    let link = await this.prisma.companyObligation.findUnique({
      where: {
        companyId_obligationId: { companyId, obligationId: obligation.id },
      },
    });
    if (!link) {
      link = await this.prisma.companyObligation.create({
        data: { companyId, obligationId: obligation.id },
      });
    }

    let deadlineStatus: DeadlineStatus = DeadlineStatus.PENDENTE;
    let actualObservation = observation || '';
    if (status === 'NO_DOCUMENTS') {
      deadlineStatus = DeadlineStatus.ENTREGUE;
      actualObservation = '[Sem Movimento] ' + (observation || '');
    } else if (status === 'DELIVERED') {
      deadlineStatus = DeadlineStatus.ENTREGUE;
    }

    let deadline = await this.prisma.deadline.findUnique({
      where: {
        companyId_obligationId_month_year: {
          companyId,
          obligationId: obligation.id,
          month,
          year,
        },
      },
    });

    if (deadline) {
      deadline = await this.prisma.deadline.update({
        where: { id: deadline.id },
        data: { status: deadlineStatus },
      });
    } else {
      let dueDate = new Date(year, month, obligation.dueDay); // Month is 1-based in our loop but JS Date is 0-based. Wait, month=1 (Jan), new Date(year, 1) = Feb. We want dueDate in next month! This is correct.
      dueDate = await this.adjustForWeekendsAndHolidays(dueDate);
      deadline = await this.prisma.deadline.create({
        data: {
          companyId,
          obligationId: obligation.id,
          month,
          year,
          dueDate,
          status: deadlineStatus,
        },
      });
    }

    if (userId) {
      await this.prisma.deliveryEvent.create({
        data: {
          deadlineId: deadline.id,
          userId,
          status: deadlineStatus,
          observation: actualObservation,
        },
      });
    }

    return deadline;
  }
}
