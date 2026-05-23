-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "CriterionType" AS ENUM ('TAX_REGIME', 'ACTIVITY', 'BOOLEAN_FLAG');

-- AlterTable
ALTER TABLE "CompanyObligation" ADD COLUMN     "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "linkedById" TEXT,
ADD COLUMN     "unlinkedAt" TIMESTAMP(3),
ADD COLUMN     "unlinkedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'OPERATOR';

-- CreateTable
CREATE TABLE "EligibilityCriterion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CriterionType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EligibilityCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationRuleVersion" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "ObligationRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationRuleCriterion" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ObligationRuleCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEvent" (
    "id" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DeadlineStatus" NOT NULL,
    "observation" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalCalendarDay" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isWeekend" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FiscalCalendarDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityCriterion_code_key" ON "EligibilityCriterion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ObligationRuleVersion_obligationId_version_key" ON "ObligationRuleVersion"("obligationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalCalendarDay_date_key" ON "FiscalCalendarDay"("date");

-- AddForeignKey
ALTER TABLE "ObligationRuleVersion" ADD CONSTRAINT "ObligationRuleVersion_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationRuleCriterion" ADD CONSTRAINT "ObligationRuleCriterion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ObligationRuleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationRuleCriterion" ADD CONSTRAINT "ObligationRuleCriterion_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "EligibilityCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyObligation" ADD CONSTRAINT "CompanyObligation_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyObligation" ADD CONSTRAINT "CompanyObligation_unlinkedById_fkey" FOREIGN KEY ("unlinkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
