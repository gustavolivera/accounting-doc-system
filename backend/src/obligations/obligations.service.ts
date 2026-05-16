import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';
import { RuleEngineService } from '../rules/rule-engine.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ObligationsService {
  constructor(
    private prisma: PrismaService,
    private ruleEngine: RuleEngineService,
    private auditService: AuditService,
  ) {}

  async create(createObligationDto: CreateObligationDto, executorId: string) {
    const { conditions, ...data } = createObligationDto;

    const obligation = await this.prisma.obligation.create({
      data: {
        ...data,
        conditions: {
          create: conditions || [],
        },
      },
    });

    await this.auditService.logAction(
      executorId,
      'CREATE',
      'OBLIGATION',
      obligation.id,
      { name: obligation.name },
    );
    await this.ruleEngine.evaluateForObligation(obligation.id);

    return obligation;
  }

  async findAll(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.obligation.findMany({
        where,
        skip,
        take: limit,
        include: { conditions: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.obligation.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const obligation = await this.prisma.obligation.findUnique({
      where: { id },
      include: { conditions: true },
    });
    if (!obligation) throw new NotFoundException('Obligation not found');
    return obligation;
  }

  async update(
    id: string,
    updateObligationDto: UpdateObligationDto,
    executorId: string,
  ) {
    const { conditions, ...data } = updateObligationDto;

    if (conditions) {
      await this.prisma.obligationCondition.deleteMany({
        where: { obligationId: id },
      });
    }

    const obligation = await this.prisma.obligation.update({
      where: { id },
      data: {
        ...data,
        conditions: conditions
          ? {
              create: conditions,
            }
          : undefined,
      },
      include: { conditions: true },
    });

    await this.auditService.logAction(
      executorId,
      'UPDATE',
      'OBLIGATION',
      obligation.id,
      { name: obligation.name },
    );
    await this.ruleEngine.evaluateForObligation(obligation.id);

    return obligation;
  }

  async remove(id: string, executorId: string) {
    const obligation = await this.prisma.obligation.update({
      where: { id },
      data: { isActive: false },
    });
    await this.auditService.logAction(
      executorId,
      'DELETE',
      'OBLIGATION',
      obligation.id,
      { name: obligation.name },
    );
    return obligation;
  }
}
