import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Company,
  Obligation,
  ObligationCondition,
  ConditionOperator,
} from '@prisma/client';
import { DeadlinesService } from '../deadlines/deadlines.service';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(
    private prisma: PrismaService,
    private deadlinesService: DeadlinesService,
  ) {}

  /**
   * Evaluate obligations for a specific company.
   * Called when a Company is created or updated.
   */
  async evaluateForCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) return;

    // Fetch all active obligations with their rule versions and legacy conditions
    const obligations = await this.prisma.obligation.findMany({
      where: { isActive: true },
      include: {
        conditions: true,
        ruleVersions: {
          where: { isActive: true },
          include: { criteria: { include: { criterion: true } } },
        },
      },
    });

    for (const obligation of obligations) {
      const activeVersion = obligation.ruleVersions?.[0];
      let matches = false;

      if (activeVersion && activeVersion.criteria.length > 0) {
        // Use new typed criteria
        matches = this.checkTypedCriteria(company, activeVersion.criteria);
      } else {
        // Fallback to legacy conditions
        matches = this.checkConditions(company, obligation.conditions);
      }

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
      include: {
        conditions: true,
        ruleVersions: {
          where: { isActive: true },
          include: { criteria: { include: { criterion: true } } },
        },
      },
    });
    if (!obligation || !obligation.isActive) return;

    // Fetch all active companies
    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
    });

    const activeVersion = obligation.ruleVersions?.[0];

    for (const company of companies) {
      let matches = false;
      if (activeVersion && activeVersion.criteria.length > 0) {
        matches = this.checkTypedCriteria(company, activeVersion.criteria);
      } else {
        matches = this.checkConditions(company, obligation.conditions);
      }

      if (matches) {
        await this.link(company.id, obligation.id);
      } else {
        await this.unlink(company.id, obligation.id);
      }
    }
  }

  /**
   * T016: Preview the impact of a set of rules before saving them.
   * Returns the count of companies that would be linked.
   */
  async previewImpact(
    criteria: {
      criterionCode: string;
      operator: ConditionOperator;
      value: string;
    }[],
  ) {
    const internalCriteria = criteria.map((c) => ({
      criterion: { code: c.criterionCode },
      operator: c.operator,
      value: c.value,
    }));

    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
    });

    const affectedCompanies = [];
    for (const company of companies) {
      if (this.checkTypedCriteria(company, internalCriteria)) {
        affectedCompanies.push({
          id: company.id,
          tradeName: company.tradeName,
        });
      }
    }

    return {
      totalActiveCompanies: companies.length,
      affectedCount: affectedCompanies.length,
      affectedCompanies,
    };
  }

  private getCompanyField(company: Company, field: string): any {
    const safeFields: (keyof Company)[] = [
      'taxRegime',
      'activities',
      'city',
      'stateRegistration',
      'hasMovement',
      'hasOutboundDocs',
      'hasInboundDocs',
      'hasServiceDocs',
      'taxSimplesNacional',
      'taxIss',
      'taxIcms',
      'taxPis',
      'taxCofins',
      'taxIrpj',
      'taxCsll',
      'obFima',
      'obSintegra',
      'obSpedIcms',
      'obEfdContribuicoes',
      'obDctfWeb',
    ];

    if (safeFields.includes(field as keyof Company)) {
      return company[field as keyof Company];
    }
    return undefined;
  }

  private checkTypedCriteria(company: Company, criteria: any[]): boolean {
    if (!criteria || criteria.length === 0) return false;

    for (const ruleCriterion of criteria) {
      const criterion = ruleCriterion.criterion;
      const companyValue = this.getCompanyField(company, criterion.code);

      if (companyValue === undefined) return false;

      if (
        !this.evaluateCondition(
          companyValue,
          ruleCriterion.operator,
          ruleCriterion.value,
        )
      ) {
        return false;
      }
    }
    return true;
  }

  private checkConditions(
    company: Company,
    conditions: ObligationCondition[],
  ): boolean {
    if (!conditions || conditions.length === 0) return false;

    for (const condition of conditions) {
      const companyValue = this.getCompanyField(company, condition.field);

      if (companyValue === undefined) return false;

      if (
        !this.evaluateCondition(
          companyValue,
          condition.operator,
          condition.value,
        )
      ) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    actualValue: any,
    operator: ConditionOperator,
    expectedValue: string,
  ): boolean {
    const stringActual = String(actualValue);

    switch (operator) {
      case ConditionOperator.EQUALS:
        return stringActual === expectedValue;

      case ConditionOperator.CONTAINS:
        if (Array.isArray(actualValue)) {
          return actualValue.includes(expectedValue);
        }
        return stringActual.includes(expectedValue);

      default:
        return false;
    }
  }

  private async link(companyId: string, obligationId: string) {
    const exists = await this.prisma.companyObligation.findUnique({
      where: {
        companyId_obligationId: { companyId, obligationId },
      },
    });

    if (!exists) {
      const link = await this.prisma.companyObligation.create({
        data: { companyId, obligationId, isActive: true },
        include: { obligation: true, company: true },
      });
      this.logger.log(
        `Linked Company ${companyId} to Obligation ${obligationId}`,
      );
      await this.deadlinesService.generateForLink(link);
    } else if (!exists.isActive) {
      const link = await this.prisma.companyObligation.update({
        where: { id: exists.id },
        data: {
          isActive: true,
          linkedAt: new Date(),
          unlinkedAt: null,
          unlinkedById: null,
        },
        include: { obligation: true, company: true },
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

    if (exists && exists.isActive) {
      // T017: Auditable deactivation instead of hard deletes
      await this.prisma.companyObligation.update({
        where: { id: exists.id },
        data: { isActive: false, unlinkedAt: new Date() },
      });
      this.logger.log(
        `Unlinked Company ${companyId} from Obligation ${obligationId}`,
      );

      // Cancellations of pending deadlines
      await this.deadlinesService.cancelFutureDeadlines(
        companyId,
        obligationId,
      );
    }
  }
}
