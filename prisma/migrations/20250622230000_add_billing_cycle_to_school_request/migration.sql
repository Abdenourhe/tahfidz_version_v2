-- Ajout du cycle de facturation sur les demandes d'inscription

ALTER TABLE "school_requests" ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';
