-- Migration: Ajout des champs de révision et des critères d'évaluation Tajwid/Makhraj/Waqf/Tarteel
-- Generated manually for incremental schema update

-- Ajouter les champs de révision à memorization_progress
ALTER TABLE "memorization_progress"
  ADD COLUMN IF NOT EXISTS "revisionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastRevisedAt" TIMESTAMP(3);

-- Ajouter les critères d'évaluation granulaires à evaluations
ALTER TABLE "evaluations"
  ADD COLUMN IF NOT EXISTS "tajwid" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "makhraj" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "waqf" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tarteel" INTEGER NOT NULL DEFAULT 0;
