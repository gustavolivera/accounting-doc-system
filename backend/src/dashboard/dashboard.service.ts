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
      where: deadlineWhere,
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
      where: { year },
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

    return {
      totalCompanies,
      totalObligations,
      totalDeadlines,
      pendingDeadlines,
      deliveredDeadlines,
      monthlyBreakdown,
    };
  }
}
