import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(year: number, month?: number) {
    const totalCompanies = await this.prisma.company.count({
      where: { isActive: true },
    });
    const totalObligations = await this.prisma.obligation.count({
      where: { isActive: true },
    });

    // Filter deadlines by year and optionally month
    const deadlineWhere = { year, ...(month && { month }) };

    const totalDeadlines = await this.prisma.deadline.count({
      where: {
        ...deadlineWhere,
        status: { not: 'CANCELADO' }
      },
    });

    const pendingDeadlines = await this.prisma.deadline.count({
      where: {
        ...deadlineWhere,
        status: { in: ['PENDENTE', 'ATRASADO'] },
      },
    });

    const deliveredDeadlines = await this.prisma.deadline.count({
      where: {
        ...deadlineWhere,
        status: 'ENTREGUE',
      },
    });

    // Breakdown by month for charts
    const monthlyDataRaw = await this.prisma.deadline.groupBy({
      by: ['month', 'status'],
      where: { year, status: { not: 'CANCELADO' } },
      _count: { id: true },
    });

    // Transform into a friendly format for the frontend
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      pendente: 0,
      entregue: 0,
      atrasado: 0,
    }));

    for (const item of monthlyDataRaw) {
      const monthObj = monthlyBreakdown.find((m) => m.month === item.month);
      if (monthObj) {
        if (item.status === 'PENDENTE') monthObj.pendente = item._count.id;
        if (item.status === 'ENTREGUE') monthObj.entregue = item._count.id;
        if (item.status === 'ATRASADO') monthObj.atrasado = item._count.id;
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const next7DaysEnd = new Date(todayStart);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
    next7DaysEnd.setHours(23, 59, 59, 999);

    const deadlinesToday = await this.prisma.deadline.count({
      where: {
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: 'PENDENTE',
      },
    });

    const overdueDeadlines = await this.prisma.deadline.count({
      where: {
        status: 'ATRASADO',
      },
    });

    const deadlinesNext7Days = await this.prisma.deadline.count({
      where: {
        dueDate: {
          gt: todayEnd,
          lte: next7DaysEnd,
        },
        status: 'PENDENTE',
      },
    });

    return {
      totalCompanies,
      totalObligations,
      totalDeadlines,
      pendingDeadlines,
      deliveredDeadlines,
      deadlinesToday,
      overdueDeadlines,
      deadlinesNext7Days,
      monthlyBreakdown,
    };
  }
}
