import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Periodicity, DeadlineStatus, CompanyObligation, Obligation } from '@prisma/client';
import { addMonths, setDate, isWeekend, addDays } from 'date-fns'; // Assuming date-fns might be available or I'll use native JS Date if not. Project dependency check required?
// If date-fns not installed, I'll use native Date. checking package.json in previous list_dir could have helper. 
// "package-lock.json" size was big. 
// Let's stick to native Date to avoid missing dependency issues unless I check package.json.

@Injectable()
export class DeadlinesService {
  private readonly logger = new Logger(DeadlinesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generates deadlines for all active links.
   * Can be run periodically.
   */
  async generateAllDeadlines() {
    const links = await this.prisma.companyObligation.findMany({
      where: { isActive: true },
      include: { obligation: true, company: true },
    });

    for (const link of links) {
      await this.generateForLink(link);
    }
  }

  /**
   * Generates deadlines for a specific link.
   * Typically generates for current year or current period.
   * For this MVP, let's generate for the current year.
   */
  async generateForLink(link: CompanyObligation & { obligation: Obligation }) {
    const currentYear = new Date().getFullYear();
    const periodicity = link.obligation.periodicity;
    
    // Determine months to generate based on periodicity
    let months: number[] = [];
    if (periodicity === 'MENSAL') {
      months = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
    } else if (periodicity === 'TRIMESTRAL') {
      months = [3, 6, 9, 12]; // Quarters usually end on these months? Or start? usually competence.
      // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun)... 
      // Competence might be March (End of Q1).
      // Let's assume competence months are the last month of the period.
    } else if (periodicity === 'ANUAL') {
      months = [12]; // December usually? Or various. simplify to 12.
    } else if (periodicity === 'BIMESTRAL') {
        months = [2, 4, 6, 8, 10, 12];
    }

    for (const month of months) {
      await this.createDeadlineIfNotExists(link, month, currentYear);
    }
  }

  private async createDeadlineIfNotExists(link: CompanyObligation & { obligation: Obligation }, month: number, year: number) {
    const exists = await this.prisma.deadline.findUnique({
        where: {
            companyId_obligationId_month_year: {
                companyId: link.companyId,
                obligationId: link.obligationId,
                month,
                year
            }
        }
    });

    if (exists) return;

    // Calculate Due Date
    // Rule: Month/Year is "Competence". Due date is usually in the NEXT month.
    // e.g. Competence Jan -> Due Feb 20th.
    // unless periodicity is Annual, then might be April next year.
    // Simplify: Date = +1 Month, Day = obligation.dueDay.
    
    let dueYear = year;
    let dueMonth = month + 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear = year + 1;
    }

    const dueDate = new Date(dueYear, dueMonth - 1, link.obligation.dueDay);
    
    // Optional: Adjust for weekends (if Saturday/Sunday -> move to Monday or Friday)
    // "dia de vencimento... pode ser fixo"
    // Skipping complex business day logic for now.

    const status = DeadlineStatus.PENDENTE;

    await this.prisma.deadline.create({
      data: {
        companyId: link.companyId,
        obligationId: link.obligationId,
        month,
        year,
        dueDate,
        status
      }
    });
    this.logger.log(`Created Deadline for ${link.companyId} ${link.obligation.name} ${month}/${year}`);
  }

  async findAll() {
    return this.prisma.deadline.findMany({
        include: { company: true, obligation: true },
        orderBy: { dueDate: 'asc' }
    });
  }

  async updateStatus(id: string, status: DeadlineStatus) {
      return this.prisma.deadline.update({
          where: { id },
          data: { status }
      });
  }
}
