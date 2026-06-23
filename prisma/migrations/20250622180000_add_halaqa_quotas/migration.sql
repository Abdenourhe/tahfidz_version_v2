-- Migration : ajout des quotas Halaqa et du cycle de facturation

-- 1. Ajout de la valeur ECONOMIQUE à l'enum SchoolPlan
ALTER TYPE "SchoolPlan" ADD VALUE 'ECONOMIQUE';

-- 2. Création de l'enum BillingCycle
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- 3. Ajout des colonnes de quota et d'abonnement à la table schools
ALTER TABLE "schools" ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "schools" ADD COLUMN "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "schools" ADD COLUMN "halaqaMonthlyLimit" INTEGER;
ALTER TABLE "schools" ADD COLUMN "halaqaBonusCredits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schools" ADD COLUMN "halaqaBonusExpiry" TIMESTAMP(3);
ALTER TABLE "schools" ADD COLUMN "halaqaPlannedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schools" ADD COLUMN "halaqaSessionsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "schools" ADD COLUMN "halaqaUsagePeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "schools" ADD COLUMN "maxTeachers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "schools" ADD COLUMN "maxStudents" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "schools" ADD COLUMN "halaqaMaxDuration" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "schools" ADD COLUMN "halaqaAllowRecording" BOOLEAN NOT NULL DEFAULT false;
