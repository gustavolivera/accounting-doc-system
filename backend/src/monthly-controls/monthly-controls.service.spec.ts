import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyControlsService } from './monthly-controls.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';

describe('MonthlyControlsService', () => {
  let service: MonthlyControlsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyControlsService,
        {
          provide: PrismaService,
          useValue: {
            company: { findUnique: jest.fn() },
            monthlyControl: { upsert: jest.fn(), findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<MonthlyControlsService>(MonthlyControlsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdate', () => {
    it('should throw BadRequestException if company not found', async () => {
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(null);
      await expect(
        service.createOrUpdate({ companyId: '1', month: 1, year: 2026, status: DocumentStatus.PENDING })
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert monthly control', async () => {
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue({ id: '1' } as any);
      const upsertSpy = jest.spyOn(prisma.monthlyControl, 'upsert').mockResolvedValue({} as any);

      await service.createOrUpdate({ companyId: '1', month: 1, year: 2026, status: DocumentStatus.PENDING });

      expect(upsertSpy).toHaveBeenCalledWith({
        where: { companyId_month_year: { companyId: '1', month: 1, year: 2026 } },
        update: { status: DocumentStatus.PENDING },
        create: { companyId: '1', month: 1, year: 2026, status: DocumentStatus.PENDING },
      });
    });
  });

  describe('findAll', () => {
    it('should query with companyId and year', async () => {
      const findManySpy = jest.spyOn(prisma.monthlyControl, 'findMany').mockResolvedValue([] as any);
      await service.findAll('1', 2026);
      expect(findManySpy).toHaveBeenCalledWith({
        where: { companyId: '1', year: 2026 },
        orderBy: { month: 'asc' },
      });
    });
    
    it('should query without year if year is undefined', async () => {
      const findManySpy = jest.spyOn(prisma.monthlyControl, 'findMany').mockResolvedValue([] as any);
      await service.findAll('1');
      expect(findManySpy).toHaveBeenCalledWith({
        where: { companyId: '1', year: undefined },
        orderBy: { month: 'asc' },
      });
    });
  });
});
