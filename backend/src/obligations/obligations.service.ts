import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';
import { RuleEngineService } from '../rules/rule-engine.service';

@Injectable()
export class ObligationsService {
  constructor(
    private prisma: PrismaService,
    private ruleEngine: RuleEngineService
  ) {}

  async create(createObligationDto: CreateObligationDto) {
    const { conditions, ...data } = createObligationDto;
    
    const obligation = await this.prisma.obligation.create({
      data: {
        ...data,
        conditions: {
          create: conditions || [],
        },
      },
    });

    // Trigger rule evaluation
    await this.ruleEngine.evaluateForObligation(obligation.id);

    return obligation;
  }

  findAll() {
    return this.prisma.obligation.findMany({
      where: { isActive: true },
      include: { conditions: true },
    });
  }

  async findOne(id: string) {
    const obligation = await this.prisma.obligation.findUnique({
      where: { id },
      include: { conditions: true },
    });
    if (!obligation) throw new NotFoundException('Obligation not found');
    return obligation;
  }

  async update(id: string, updateObligationDto: UpdateObligationDto) {
    const { conditions, ...data } = updateObligationDto;

    // If conditions are updated, simpler strategy: delete all old, create new.
    if (conditions) {
      await this.prisma.obligationCondition.deleteMany({
        where: { obligationId: id },
      });
    }

    const obligation = await this.prisma.obligation.update({
      where: { id },
      data: {
        ...data,
        conditions: conditions ? {
          create: conditions,
        } : undefined,
      },
      include: { conditions: true },
    });

    // Trigger rule evaluation
    await this.ruleEngine.evaluateForObligation(obligation.id);

    return obligation;
  }

  async remove(id: string) {
    return this.prisma.obligation.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
