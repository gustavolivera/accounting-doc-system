-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SERVICO', 'COMERCIO', 'INDUSTRIA');

-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "Periodicity" AS ENUM ('MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDENTE', 'ENTREGUE', 'ATRASADO');

-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'CONTAINS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'DELIVERED', 'NO_DOCUMENTS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "internalCode" TEXT,
    "corporateName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "stateRegistration" TEXT,
    "isExemptStateRegistration" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL,
    "fiscalObservations" TEXT,
    "taxRegime" "TaxRegime",
    "activities" "ActivityType"[],
    "hasMovement" BOOLEAN NOT NULL DEFAULT false,
    "hasOutboundDocs" BOOLEAN NOT NULL DEFAULT false,
    "hasInboundDocs" BOOLEAN NOT NULL DEFAULT false,
    "hasServiceDocs" BOOLEAN NOT NULL DEFAULT false,
    "taxSimplesNacional" BOOLEAN NOT NULL DEFAULT false,
    "taxIss" BOOLEAN NOT NULL DEFAULT false,
    "taxIcms" BOOLEAN NOT NULL DEFAULT false,
    "taxPis" BOOLEAN NOT NULL DEFAULT false,
    "taxCofins" BOOLEAN NOT NULL DEFAULT false,
    "taxIrpj" BOOLEAN NOT NULL DEFAULT false,
    "taxCsll" BOOLEAN NOT NULL DEFAULT false,
    "obFima" BOOLEAN NOT NULL DEFAULT false,
    "obSintegra" BOOLEAN NOT NULL DEFAULT false,
    "obSpedIcms" BOOLEAN NOT NULL DEFAULT false,
    "obEfdContribuicoes" BOOLEAN NOT NULL DEFAULT false,
    "obDctfWeb" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DeadlineType" NOT NULL,
    "periodicity" "Periodicity" NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationCondition" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ObligationCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyObligation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyControl" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "observation" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyControl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_internalCode_key" ON "Company"("internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyObligation_companyId_obligationId_key" ON "CompanyObligation"("companyId", "obligationId");

-- CreateIndex
CREATE UNIQUE INDEX "Deadline_companyId_obligationId_month_year_key" ON "Deadline"("companyId", "obligationId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyControl_companyId_month_year_key" ON "MonthlyControl"("companyId", "month", "year");

-- AddForeignKey
ALTER TABLE "ObligationCondition" ADD CONSTRAINT "ObligationCondition_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyObligation" ADD CONSTRAINT "CompanyObligation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyObligation" ADD CONSTRAINT "CompanyObligation_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyControl" ADD CONSTRAINT "MonthlyControl_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
