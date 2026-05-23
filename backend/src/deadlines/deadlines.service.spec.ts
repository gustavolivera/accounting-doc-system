import { Test, TestingModule } from '@nestjs/testing';
import { DeadlinesService } from './deadlines.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DeadlineStatus } from '@prisma/client';

describe('DeadlinesService', () => {
  let service: DeadlinesService;
  let prisma: PrismaService;
  let audit: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlinesService,
        {
          provide: PrismaService,
          useValue: {
            companyObligation: { findMany: jest.fn() },
            deadline: { findUnique: jest.fn(), createMany: jest.fn().mockResolvedValue({ count: 1 }), findMany: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0) },
            deliveryEvent: { create: jest.fn() },
            fiscalCalendarDay: { findFirst: jest.fn().mockResolvedValue(null) },
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeadlinesService>(DeadlinesService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDeadlines', () => {
    it('should find all active links and call createMany', async () => {
      const links = [{ id: '1', obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' }];
      jest.spyOn(prisma.companyObligation, 'findMany').mockResolvedValue(links as any);
      const createManySpy = jest.spyOn(prisma.deadline, 'createMany');

      await service.generateDeadlines();

      expect(prisma.companyObligation.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { obligation: true, company: true },
      });
      expect(createManySpy).toHaveBeenCalled();
    });
  });

  describe('generateForLink', () => {
    it('should generate 12 months for MENSAL', async () => {
      const link = { obligation: { periodicity: 'MENSAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(prisma.deadline, 'createMany');

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalled();
      const callArg = createSpy.mock.calls[0][0];
      expect(callArg!.data).toHaveLength(12);
    });

    it('should generate 4 months for TRIMESTRAL', async () => {
      const link = { obligation: { periodicity: 'TRIMESTRAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(prisma.deadline, 'createMany');

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalled();
      const callArg = createSpy.mock.calls[0][0];
      expect(callArg!.data).toHaveLength(4);
    });

    it('should generate 1 month for ANUAL', async () => {
      const link = { obligation: { periodicity: 'ANUAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(prisma.deadline, 'createMany');

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalled();
      const callArg = createSpy.mock.calls[0][0];
      expect(callArg!.data).toHaveLength(1);
    });

    it('should generate 6 months for BIMESTRAL', async () => {
      const link = { obligation: { periodicity: 'BIMESTRAL', dueDay: 20 }, companyId: 'c1', obligationId: 'o1' };
      const createSpy = jest.spyOn(prisma.deadline, 'createMany');

      await service.generateForLink(link as any);

      expect(createSpy).toHaveBeenCalled();
      const callArg = createSpy.mock.calls[0][0];
      expect(callArg!.data).toHaveLength(6);
    });
  });

  describe('findAll', () => {
    it('should query all deadlines ordered by due date', async () => {
      const findManySpy = jest.spyOn(prisma.deadline, 'findMany').mockResolvedValue([] as any);
      await service.findAll();
      expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({
        include: { company: true, obligation: true, events: true },
        orderBy: { dueDate: 'asc' },
      }));
    });
  });

  describe('updateDeliveryState', () => {
    it('should update status and create event', async () => {
      const updateSpy = jest.spyOn(prisma.deadline, 'update').mockResolvedValue({ id: '1' } as any);
      const createEventSpy = jest.spyOn(prisma.deliveryEvent, 'create').mockResolvedValue({ id: 'event1' } as any);
      const logActionSpy = jest.spyOn(audit, 'logAction').mockResolvedValue(undefined);

      await service.updateDeliveryState('1', 'user1', { status: DeadlineStatus.ENTREGUE, observation: 'ok' });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: DeadlineStatus.ENTREGUE },
      });
      expect(createEventSpy).toHaveBeenCalledWith({
        data: { deadlineId: '1', userId: 'user1', status: DeadlineStatus.ENTREGUE, observation: 'ok', evidenceUrl: undefined }
      });
      expect(logActionSpy).toHaveBeenCalled();
    });
  });
});
