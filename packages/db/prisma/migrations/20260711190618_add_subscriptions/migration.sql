-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('PRO');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PAUSED');

-- CreateEnum
CREATE TYPE "SubscriptionPlatform" AS ENUM ('STRIPE', 'REVENUECAT');

-- CreateEnum
CREATE TYPE "SubscriptionEventType" AS ENUM ('TRIAL_STARTED', 'SUBSCRIPTION_STARTED', 'RENEWAL_SUCCESS', 'RENEWAL_FAILED', 'PLAN_UPGRADED', 'PLAN_DOWNGRADED', 'CANCELLATION_SCHEDULED', 'CANCELLED', 'REACTIVATED', 'BILLING_ISSUE_DETECTED', 'BILLING_ISSUE_RESOLVED', 'GRACE_PERIOD_STARTED', 'GRACE_PERIOD_EXPIRED', 'EXPIRED', 'TRANSFERRED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "revenuecatUserId" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SubscriptionPlatform" NOT NULL DEFAULT 'STRIPE',
    "externalId" TEXT NOT NULL,
    "planName" "PlanName" NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "gracePeriodEnd" TIMESTAMP(3),
    "storeProductId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventType" "SubscriptionEventType" NOT NULL,
    "platform" "SubscriptionPlatform" NOT NULL,
    "externalEventId" TEXT,
    "previousStatus" "SubscriptionStatus",
    "newStatus" "SubscriptionStatus",
    "previousPlan" "PlanName",
    "newPlan" "PlanName",
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "platform" "SubscriptionPlatform" NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_externalId_key" ON "subscriptions"("externalId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_platform_externalId_idx" ON "subscriptions"("platform", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_events_externalEventId_key" ON "subscription_events"("externalEventId");

-- CreateIndex
CREATE INDEX "subscription_events_subscriptionId_idx" ON "subscription_events"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_revenuecatUserId_key" ON "users"("revenuecatUserId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

