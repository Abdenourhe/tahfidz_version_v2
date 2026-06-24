-- Ajout de la durée souhaitée des séances Halaqa sur les demandes d'inscription

ALTER TABLE "school_requests" ADD COLUMN "halaqaSessionDuration" INTEGER;
