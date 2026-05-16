import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Periodicity,
  DeadlineStatus,
  CompanyObligation,
  Obligation,
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

    for (const link of links) {
      await this.generateForLink(link, targetYear);
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

    for (const month of months) {
      await this.createDeadlineIfNotExists(link, month, currentYear);
    }
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

  private async createDeadlineIfNotExists(
    link: CompanyObligation & { obligation: Obligation },
    month: number,
    year: number,
  ) {
    const exists = await this.prisma.deadline.findUnique({
      where: {
        companyId_obligationId_month_year: {
          companyId: link.companyId,
          obligationId: link.obligationId,
          month,
          year,
        },
      },
    });

    if (exists) return;

    let dueYear = year;
    let dueMonth = month + 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear = year + 1;
    }

    let dueDate = new Date(dueYear, dueMonth - 1, link.obligation.dueDay);

    // Adjust for weekends and holidays
    dueDate = await this.adjustForWeekendsAndHolidays(dueDate);

    const status = DeadlineStatus.PENDENTE;

    await this.prisma.deadline.create({
      data: {
        companyId: link.companyId,
        obligationId: link.obligationId,
        month,
        year,
        dueDate,
        status,
      },
    });
    this.logger.log(
      `Created Deadline for ${link.companyId} ${link.obligation.name} ${month}/${year}`,
    );
  }

  async findAll(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.company = {
        tradeName: { contains: search, mode: 'insensitive' },
      };
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
}
