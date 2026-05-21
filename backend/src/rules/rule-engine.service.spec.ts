import { Test, TestingModule } from '@nestjs/testing';
import { RuleEngineService } from './rule-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeadlinesService } from '../deadlines/deadlines.service';
import { ConditionOperator } from '@prisma/client';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let prisma: PrismaService;
  let deadlinesService: DeadlinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: PrismaService,
          useValue: {
            company: { findUnique: jest.fn(), findMany: jest.fn() },
            obligation: { findUnique: jest.fn(), findMany: jest.fn() },
            companyObligation: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
          },
        },
        {
          provide: DeadlinesService,
          useValue: {
            generateForLink: jest.fn(),
            cancelFutureDeadlines: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    prisma = module.get<PrismaService>(PrismaService);
    deadlinesService = module.get<DeadlinesService>(DeadlinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkConditions', () => {
    it('should return false if no conditions', () => {
      const company = { id: '1' } as any;
      expect((service as any).checkConditions(company, [])).toBe(false);
    });

    it('should return false if field does not exist', () => {
      const company = { id: '1' } as any;
      const conditions = [{ field: 'nonExistent', operator: ConditionOperator.EQUALS, value: 'yes' }];
      expect((service as any).checkConditions(company, conditions)).toBe(false);
    });

    it('should evaluate EQUALS condition correctly', () => {
      const company = { id: '1', taxRegime: 'SIMPLES_NACIONAL' } as any;
      const conditions = [{ field: 'taxRegime', operator: ConditionOperator.EQUALS, value: 'SIMPLES_NACIONAL' }];
      expect((service as any).checkConditions(company, conditions)).toBe(true);

      const conditionsFail = [{ field: 'taxRegime', operator: ConditionOperator.EQUALS, value: 'LUCRO_REAL' }];
      expect((service as any).checkConditions(company, conditionsFail)).toBe(false);
    });

    it('should evaluate boolean EQUALS correctly', () => {
      const company = { id: '1', obSpedIcms: true } as any;
      const conditions = [{ field: 'obSpedIcms', operator: ConditionOperator.EQUALS, value: 'true' }];
      expect((service as any).checkConditions(company, conditions)).toBe(true);
    });

    it('should evaluate CONTAINS for arrays correctly', () => {
      const company = { id: '1', activities: ['SERVICO', 'COMERCIO'] } as any;
      const conditions = [{ field: 'activities', operator: ConditionOperator.CONTAINS, value: 'COMERCIO' }];
      expect((service as any).checkConditions(company, conditions)).toBe(true);

      const conditionsFail = [{ field: 'activities', operator: ConditionOperator.CONTAINS, value: 'INDUSTRIA' }];
      expect((service as any).checkConditions(company, conditionsFail)).toBe(false);
    });
  });

  describe('evaluateForCompany', () => {
    it('should link company if conditions match', async () => {
      const company = { id: 'c1', taxRegime: 'SIMPLES' };
      const obligation = { id: 'o1', conditions: [{ field: 'taxRegime', operator: ConditionOperator.EQUALS, value: 'SIMPLES' }] };
      
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(company as any);
      jest.spyOn(prisma.obligation, 'findMany').mockResolvedValue([obligation] as any);
      const linkSpy = jest.spyOn(service as any, 'link').mockResolvedValue(undefined);

      await service.evaluateForCompany('c1');
      expect(linkSpy).toHaveBeenCalledWith('c1', 'o1');
    });

    it('should unlink company if conditions do not match', async () => {
      const company = { id: 'c1', taxRegime: 'LUCRO_REAL' };
      const obligation = { id: 'o1', conditions: [{ field: 'taxRegime', operator: ConditionOperator.EQUALS, value: 'SIMPLES' }] };
      
      jest.spyOn(prisma.company, 'findUnique').mockResolvedValue(company as any);
      jest.spyOn(prisma.obligation, 'findMany').mockResolvedValue([obligation] as any);
      const unlinkSpy = jest.spyOn(service as any, 'unlink').mockResolvedValue(undefined);

      await service.evaluateForCompany('c1');
      expect(unlinkSpy).toHaveBeenCalledWith('c1', 'o1');
    });
  });

  describe('evaluateForObligation', () => {
    it('should link all matching companies', async () => {
      const obligation = { id: 'o1', isActive: true, conditions: [{ field: 'taxRegime', operator: ConditionOperator.EQUALS, value: 'SIMPLES' }] };
      const companies = [
        { id: 'c1', taxRegime: 'SIMPLES' },
        { id: 'c2', taxRegime: 'LUCRO_REAL' }
      ];
      
      jest.spyOn(prisma.obligation, 'findUnique').mockResolvedValue(obligation as any);
      jest.spyOn(prisma.company, 'findMany').mockResolvedValue(companies as any);
      const linkSpy = jest.spyOn(service as any, 'link').mockResolvedValue(undefined);
      const unlinkSpy = jest.spyOn(service as any, 'unlink').mockResolvedValue(undefined);

      await service.evaluateForObligation('o1');
      expect(linkSpy).toHaveBeenCalledWith('c1', 'o1');
      expect(unlinkSpy).toHaveBeenCalledWith('c2', 'o1');
    });
  });

  describe('link', () => {
    it('should create link and generate deadlines if not exists', async () => {
      jest.spyOn(prisma.companyObligation, 'findUnique').mockResolvedValue(null);
      const createSpy = jest.spyOn(prisma.companyObligation, 'create').mockResolvedValue({ id: 'link1' } as any);
      const generateSpy = jest.spyOn(deadlinesService, 'generateForLink').mockResolvedValue(undefined);

      await (service as any).link('c1', 'o1');

      expect(createSpy).toHaveBeenCalled();
      expect(generateSpy).toHaveBeenCalledWith({ id: 'link1' });
    });

    it('should update link and generate deadlines if exists but inactive', async () => {
      jest.spyOn(prisma.companyObligation, 'findUnique').mockResolvedValue({ id: 'link1', isActive: false } as any);
      const updateSpy = jest.spyOn(prisma.companyObligation, 'update').mockResolvedValue({ id: 'link1' } as any);
      const generateSpy = jest.spyOn(deadlinesService, 'generateForLink').mockResolvedValue(undefined);

      await (service as any).link('c1', 'o1');

      expect(updateSpy).toHaveBeenCalled();
      expect(generateSpy).toHaveBeenCalledWith({ id: 'link1' });
    });
  });

  describe('unlink', () => {
    it('should deactivate link if exists and active', async () => {
      jest.spyOn(prisma.companyObligation, 'findUnique').mockResolvedValue({ id: 'link1', isActive: true } as any);
      const updateSpy = jest.spyOn(prisma.companyObligation, 'update').mockResolvedValue({} as any);

      await (service as any).unlink('c1', 'o1');

      expect(updateSpy).toHaveBeenCalledWith({ 
        where: { id: 'link1' },
        data: expect.objectContaining({ isActive: false })
      });
    });
  });
});
