-- Rename tables
ALTER TABLE "maqra_sessions" RENAME TO "halaqa_sessions";
ALTER TABLE "maqra_evaluations" RENAME TO "halaqa_evaluations";

-- Rename enums
ALTER TYPE "MaqraType" RENAME TO "HalaqaType";
ALTER TYPE "MaqraStatus" RENAME TO "HalaqaStatus";
ALTER TYPE "MaqraMode" RENAME TO "HalaqaMode";
