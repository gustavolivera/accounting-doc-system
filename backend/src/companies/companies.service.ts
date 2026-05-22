import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from '../prisma/prisma.service';

import { RuleEngineService } from '../rules/rule-engine.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private ruleEngine: RuleEngineService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const existingCnpj = await this.prisma.company.findUnique({
      where: { cnpj: createCompanyDto.cnpj },
    });
    if (existingCnpj) {
      throw new ConflictException('Company with this CNPJ already exists');
    }

    if (createCompanyDto.internalCode) {
      const existingCode = await this.prisma.company.findUnique({
        where: { internalCode: createCompanyDto.internalCode },
      });
      if (existingCode) {
        throw new ConflictException(
          'Company with this Internal Code already exists',
        );
      }
    }

    const { fiscalParameters, ...companyData } = createCompanyDto;

    const company = await this.prisma.company.create({
      data: {
        ...companyData,
        fiscalParameters: fiscalParameters ? {
          create: Object.entries(fiscalParameters).map(([code, value]) => ({
            code,
            value: String(value)
          }))
        } : undefined
      },
    });
    await this.ruleEngine.evaluateForCompany(company.id);
    return company;
  }

  async findAll(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tradeName: 'asc' },
        include: { fiscalParameters: true },
      }),
      this.prisma.company.count({ where }),
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
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { fiscalParameters: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);
    
    const { fiscalParameters, ...companyData } = updateCompanyDto;

    // Use transaction if we have fiscal parameters to update
    let company;
    if (fiscalParameters !== undefined) {
      company = await this.prisma.$transaction(async (tx) => {
        // Delete old parameters
        await tx.companyFiscalParameter.deleteMany({
          where: { companyId: id }
        });
        
        // Update company and create new parameters
        return tx.company.update({
          where: { id },
          data: {
            ...companyData,
            fiscalParameters: {
              create: Object.entries(fiscalParameters).map(([code, value]) => ({
                code,
                value: String(value)
              }))
            }
          },
          include: { fiscalParameters: true }
        });
      });
    } else {
      company = await this.prisma.company.update({
        where: { id },
        data: companyData,
        include: { fiscalParameters: true }
      });
    }

    await this.ruleEngine.evaluateForCompany(company.id);
    return company;
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete
    return this.prisma.company.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
