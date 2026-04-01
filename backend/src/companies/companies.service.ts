import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from '../prisma/prisma.service';

import { RuleEngineService } from '../rules/rule-engine.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private ruleEngine: RuleEngineService
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
        throw new ConflictException('Company with this Internal Code already exists');
      }
    }

    const company = await this.prisma.company.create({ data: createCompanyDto });
    await this.ruleEngine.evaluateForCompany(company.id);
    return company;
  }

  findAll() {
    return this.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { tradeName: 'asc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);
    const company = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
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
