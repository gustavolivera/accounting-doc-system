import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { MonthlyControlsModule } from './monthly-controls/monthly-controls.module';
import { UsersModule } from './users/users.module';
import { RulesModule } from './rules/rules.module';
import { ObligationsModule } from './obligations/obligations.module';
import { DeadlinesModule } from './deadlines/deadlines.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RulesModule,
    CompaniesModule,
    ObligationsModule,
    DeadlinesModule,
    MonthlyControlsModule,
    UsersModule,
    DashboardModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
