import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company, Obligation, ObligationCondition, ConditionOperator } from '@prisma/client';
import { DeadlinesService } from '../deadlines/deadlines.service';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(
    private prisma: PrismaService,
    private deadlinesService: DeadlinesService
  ) {}

  /**
   * Evaluate obligations for a specific company.
   * Called when a Company is created or updated.
   */
  async evaluateForCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return;

    // Fetch all active obligations with their conditions
    const obligations = await this.prisma.obligation.findMany({
      where: { isActive: true },
      include: { conditions: true },
    });

    for (const obligation of obligations) {
      const matches = this.checkConditions(company, obligation.conditions);
      if (matches) {
        await this.link(company.id, obligation.id);
      } else {
        await this.unlink(company.id, obligation.id);
      }
    }
  }

  /**
   * Evaluate companies for a specific obligation.
   * Called when an Obligation is created or updated.
   */
  async evaluateForObligation(obligationId: string) {
    const obligation = await this.prisma.obligation.findUnique({
      where: { id: obligationId },
      include: { conditions: true },
    });
    if (!obligation || !obligation.isActive) return;

    // Fetch all active companies
    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
    });

    for (const company of companies) {
      const matches = this.checkConditions(company, obligation.conditions);
      if (matches) {
        await this.link(company.id, obligation.id);
      } else {
        await this.unlink(company.id, obligation.id);
      }
    }
  }

  private checkConditions(company: Company, conditions: ObligationCondition[]): boolean {
    if (!conditions || conditions.length === 0) return false; // If no conditions, maybe apply to all? Or none? User said "deve ser possível definir uma ou mais condições... Caso a empresa atenda a todas". Implies at least one. If none, unlikely to apply to all defaultly unless specified. Let's assume none = none for safety.

    for (const condition of conditions) {
      const companyValue = (company as any)[condition.field];
      
      // If field doesn't exist on company, condition fails
      if (companyValue === undefined) return false;

      if (!this.evaluateCondition(companyValue, condition.operator, condition.value)) {
        return false; // AND logic: failure on any returns false
      }
    }
    return true; // All passed
  }

  private evaluateCondition(actualValue: any, operator: ConditionOperator, expectedValue: string): boolean {
    const stringActual = String(actualValue); // Convert boolean/number to string for comparison

    switch (operator) {
      case ConditionOperator.EQUALS:
        // Handle boolean string "true"/"false" equality strictly if needed, but string comparison works for "true"=="true"
        return stringActual === expectedValue;
      
      case ConditionOperator.CONTAINS:
        // If actualValue is Array (e.g. activities)
        if (Array.isArray(actualValue)) {
          return actualValue.includes(expectedValue);
        }
        // If actualValue is string, substring check
        return stringActual.includes(expectedValue);
      
      default:
        return false;
    }
  }

  private async link(companyId: string, obligationId: string) {
    // Check if link exists
    const exists = await this.prisma.companyObligation.findUnique({
      where: {
        companyId_obligationId: { companyId, obligationId },
      },
    });

    if (!exists) {
      const link = await this.prisma.companyObligation.create({
        data: { companyId, obligationId },
        include: { obligation: true, company: true }
      });
      this.logger.log(`Linked Company ${companyId} to Obligation ${obligationId}`);
      await this.deadlinesService.generateForLink(link);
    } else if (!exists.isActive) {
      const link = await this.prisma.companyObligation.update({
        where: { id: exists.id },
        data: { isActive: true },
        include: { obligation: true, company: true }
      });
      await this.deadlinesService.generateForLink(link);
    }
  }

  private async unlink(companyId: string, obligationId: string) {
    const exists = await this.prisma.companyObligation.findUnique({
      where: {
        companyId_obligationId: { companyId, obligationId },
      },
    });

    if (exists) {
        // We can hard delete or soft delete (set isActive=false).
        // Since deadlines depend on this, maybe soft delete is safer to keep history?
        // But deadlines generated are separate.
        // User said: "Sempre que os dados ... forem alterados, os vínculos e prazos devem ser recalculados".
        // If we unlink, maybe we should cancel pending deadlines?
        // For now, let's just delete the link or soft delete.
        await this.prisma.companyObligation.delete({
            where: { id: exists.id }
        });
        this.logger.log(`Unlinked Company ${companyId} from Obligation ${obligationId}`);
        
        // TODO: Handle pending deadlines cancellation if requirement demands.
    }
  }
}
