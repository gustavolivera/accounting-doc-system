import { Test, TestingModule } from '@nestjs/testing';
import { DeadlinesService } from './deadlines.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeadlineStatus } from '@prisma/client';

describe('DeadlinesService', () => {
  let service: DeadlinesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlinesService,
        {
          provide: PrismaService,
          useValue: {
            companyObligation: { findMany: jest.fn() },
            deadline: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
            deliveryEvent: { create: jest.fn() },
            fiscalCalendarDay: { findFirst: jest.fn().mockResolvedValue(null) },
          },
        },
      ],
    }).compile();

    service = module.get<DeadlinesService>(DeadlinesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDeadlines', () => {
    it('should find all active links and call generateForLink', async () => {
      const links = [{ id: '1', obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' }];
      jest.spyOn(prisma.companyObligation, 'findMany').mockResolvedValue(links as any);
      const generateForLinkSpy = jest.spyOn(service, 'generateForLink').mockResolvedValue(undefined);

      await service.generateDeadlines();

      expect(prisma.companyObligation.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { obligation: true, company: true },
      });
      expect(generateForLinkSpy).toHaveBeenCalledWith(links[0], expect.any(Number));
    });
  });

  describe('generateForLink', () => {
    it('should generate 12 months for MENSAL', async () => {
      const link = { obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(service as any, 'createDeadlineIfNotExists').mockResolvedValue(undefined);

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalledTimes(12);
    });

    it('should generate 4 months for TRIMESTRAL', async () => {
      const link = { obligation: { periodicity: 'TRIMESTRAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(service as any, 'createDeadlineIfNotExists').mockResolvedValue(undefined);

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalledTimes(4);
    });

    it('should generate 1 month for ANUAL', async () => {
      const link = { obligation: { periodicity: 'ANUAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(service as any, 'createDeadlineIfNotExists').mockResolvedValue(undefined);

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('should generate 6 months for BIMESTRAL', async () => {
      const link = { obligation: { periodicity: 'BIMESTRAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(service as any, 'createDeadlineIfNotExists').mockResolvedValue(undefined);

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalledTimes(6);
    });
  });

  describe('createDeadlineIfNotExists', () => {
    it('should not create if deadline already exists', async () => {
      jest.spyOn(prisma.deadline, 'findUnique').mockResolvedValue({ id: '1' } as any);
      const createSpy = jest.spyOn(prisma.deadline, 'create');

      const link = { obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      await (service as any).createDeadlineIfNotExists(link, 1, 2026);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should create deadline with correct due date', async () => {
      jest.spyOn(prisma.deadline, 'findUnique').mockResolvedValue(null);
      const createSpy = jest.spyOn(prisma.deadline, 'create').mockResolvedValue({} as any);

      const link = { obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      await (service as any).createDeadlineIfNotExists(link, 1, 2026);

      expect(createSpy).toHaveBeenCalled();
      const createArgs = createSpy.mock.calls[0][0].data;
      expect(createArgs.companyId).toBe('c1');
      expect(createArgs.obligationId).toBe('o1');
      expect(createArgs.month).toBe(1);
      expect(createArgs.year).toBe(2026);
      expect(createArgs.status).toBe(DeadlineStatus.PENDENTE);
      
      // month 1 (Jan) -> due in month 2 (Feb) day 20
      expect((createArgs.dueDate as Date).getFullYear()).toBe(2026);
      expect((createArgs.dueDate as Date).getMonth()).toBe(1); // 0-indexed, so 1 = Feb
      expect((createArgs.dueDate as Date).getDate()).toBe(20);
    });

    it('should handle year rollover correctly', async () => {
      jest.spyOn(prisma.deadline, 'findUnique').mockResolvedValue(null);
      const createSpy = jest.spyOn(prisma.deadline, 'create').mockResolvedValue({} as any);

      const link = { obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      await (service as any).createDeadlineIfNotExists(link, 12, 2026);

      const createArgs = createSpy.mock.calls[0][0].data;
      // month 12 (Dec) -> due in month 1 (Jan) next year day 20
      expect((createArgs.dueDate as Date).getFullYear()).toBe(2027);
      expect((createArgs.dueDate as Date).getMonth()).toBe(0); // Jan
    });
  });

  describe('findAll', () => {
    it('should query all deadlines ordered by due date', async () => {
      const findManySpy = jest.spyOn(prisma.deadline, 'findMany').mockResolvedValue([] as any);
      await service.findAll();
      expect(findManySpy).toHaveBeenCalledWith({
        include: { company: true, obligation: true, events: true },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('updateDeliveryState', () => {
    it('should update status and create event', async () => {
      const updateSpy = jest.spyOn(prisma.deadline, 'update').mockResolvedValue({ id: '1' } as any);
      const createEventSpy = jest.spyOn(prisma.deliveryEvent, 'create').mockResolvedValue({ id: 'event1' } as any);

      await service.updateDeliveryState('1', 'user1', { status: DeadlineStatus.ENTREGUE, observation: 'ok' });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: DeadlineStatus.ENTREGUE },
      });
      expect(createEventSpy).toHaveBeenCalledWith({
        data: { deadlineId: '1', userId: 'user1', status: DeadlineStatus.ENTREGUE, observation: 'ok', evidenceUrl: undefined }
      });
    });
  });
});
