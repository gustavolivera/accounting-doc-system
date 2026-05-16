import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateMonthlyControlDto } from './dto/create-monthly-control.dto';
import { UpdateMonthlyControlDto } from './dto/update-monthly-control.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonthlyControlsService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdate(dto: CreateMonthlyControlDto) {
    const { companyId, month, year, ...data } = dto;
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new BadRequestException('Company not found');

    return this.prisma.monthlyControl.upsert({
      where: {
        companyId_month_year: {
          companyId,
          month,
          year,
        },
      },
      update: {
        ...data,
      },
      create: {
        companyId,
        month,
        year,
        ...data,
      },
    });
  }

  findAll(companyId?: string, year?: number) {
    return this.prisma.monthlyControl.findMany({
      where: {
        companyId: companyId,
        year: year ? +year : undefined,
      },
      orderBy: { month: 'asc' },
    });
  }

  // We usually don't need basic CRUD by ID, but bulk logic. Keeping findAll mostly.
}
