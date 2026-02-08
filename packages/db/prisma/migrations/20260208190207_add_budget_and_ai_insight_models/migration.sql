-- CreateEnum
CREATE TYPE "BudgetPeriodType" AS ENUM ('CALENDAR_MONTH', 'PAYDAY');

-- CreateEnum
CREATE TYPE "SpendingCategory" AS ENUM ('SHOPPING', 'GROCERIES', 'EATING_OUT', 'BILLS', 'TRANSPORT', 'ENTERTAINMENT', 'HEALTH', 'PERSONAL_CARE', 'EDUCATION', 'TRANSFER', 'CASH', 'INCOME', 'FEES', 'SAVINGS', 'REMITTANCES', 'SUBSCRIPTIONS', 'OTHER');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "aiCategory" "SpendingCategory";

-- CreateTable
CREATE TABLE "budget_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" "BudgetPeriodType" NOT NULL DEFAULT 'CALENDAR_MONTH',
    "paydayDate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "category" "SpendingCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_configs_userId_key" ON "budget_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_configId_category_key" ON "budgets"("configId", "category");

-- CreateIndex
CREATE INDEX "ai_insights_userId_createdAt_idx" ON "ai_insights"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_accountId_aiCategory_timestamp_idx" ON "transactions"("accountId", "aiCategory", "timestamp");

-- AddForeignKey
ALTER TABLE "budget_configs" ADD CONSTRAINT "budget_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_configId_fkey" FOREIGN KEY ("configId") REFERENCES "budget_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
