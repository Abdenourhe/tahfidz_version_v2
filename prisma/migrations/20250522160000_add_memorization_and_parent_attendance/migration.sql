-- Migration robuste : Mémorisation + Présence parentale
-- Compatible création from-scratch ET mise à jour incrémentale

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- MemorizationStatus (ajout de ASSIGNED si manquant)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memorizationstatus') THEN
        CREATE TYPE "MemorizationStatus" AS ENUM (
            'NOT_STARTED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW',
            'READY_FOR_RECITATION', 'PENDING_TEACHER_APPROVAL', 'MEMORIZED', 'NEEDS_REVISION'
        );
    ELSE
        -- PostgreSQL 9.1+ permet d'ajouter des valeurs sans ALTER TYPE ... ADD VALUE IF NOT EXISTS
        BEGIN
            ALTER TYPE "MemorizationStatus" ADD VALUE 'ASSIGNED';
        EXCEPTION WHEN duplicate_object THEN
            -- Valeur déjà présente, on ignore
        END;
    END IF;
END $$;

-- ProgressQuality
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progressquality') THEN
        CREATE TYPE "ProgressQuality" AS ENUM ('EXCELLENT', 'GOOD', 'NEEDS_WORK', 'POOR');
    END IF;
END $$;

-- AttendanceStatus (déjà existant dans la plupart des cas, mais on sécurise)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancestatus') THEN
        CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
    END IF;
END $$;

-- ============================================================
-- 2. TABLE memorization_progress (création ou ajout colonnes)
-- ============================================================

CREATE TABLE IF NOT EXISTS "memorization_progress" (
    "id"                   TEXT NOT NULL,
    "studentId"            TEXT NOT NULL,
    "teacherId"            TEXT,
    "surahId"              INTEGER NOT NULL,
    "startVerse"           INTEGER NOT NULL DEFAULT 1,
    "endVerse"             INTEGER NOT NULL,
    "versesFrom"           INTEGER,
    "versesTo"             INTEGER,
    "targetDate"           TIMESTAMP(3),
    "dueDate"              TIMESTAMP(3),
    "status"               "MemorizationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentVerse"         INTEGER NOT NULL DEFAULT 1,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes"                TEXT,
    "startedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"          TIMESTAMP(3),
    "updatedAt"            TIMESTAMP(3) NOT NULL,
    CONSTRAINT "memorization_progress_pkey" PRIMARY KEY ("id")
);

-- Colonnes ajoutées si la table existait déjà
ALTER TABLE "memorization_progress" ADD COLUMN IF NOT EXISTS "teacherId" TEXT;
ALTER TABLE "memorization_progress" ADD COLUMN IF NOT EXISTS "versesFrom" INTEGER;
ALTER TABLE "memorization_progress" ADD COLUMN IF NOT EXISTS "versesTo" INTEGER;
ALTER TABLE "memorization_progress" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);
ALTER TABLE "memorization_progress" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Index
CREATE INDEX IF NOT EXISTS "memorization_progress_studentId_status_idx" ON "memorization_progress"("studentId", "status");
CREATE INDEX IF NOT EXISTS "memorization_progress_teacherId_idx" ON "memorization_progress"("teacherId");

-- Clés étrangères
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'memorization_progress_studentId_fkey'
        AND table_name = 'memorization_progress'
    ) THEN
        ALTER TABLE "memorization_progress" ADD CONSTRAINT "memorization_progress_studentId_fkey"
            FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'memorization_progress_teacherId_fkey'
        AND table_name = 'memorization_progress'
    ) THEN
        ALTER TABLE "memorization_progress" ADD CONSTRAINT "memorization_progress_teacherId_fkey"
            FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'memorization_progress_surahId_fkey'
        AND table_name = 'memorization_progress'
    ) THEN
        ALTER TABLE "memorization_progress" ADD CONSTRAINT "memorization_progress_surahId_fkey"
            FOREIGN KEY ("surahId") REFERENCES "surahs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================
-- 3. TABLE status_history (création ou ajout colonnes)
-- ============================================================

CREATE TABLE IF NOT EXISTS "status_history" (
    "id"              TEXT NOT NULL,
    "progressId"      TEXT NOT NULL,
    "oldStatus"       "MemorizationStatus" NOT NULL,
    "newStatus"       "MemorizationStatus" NOT NULL,
    "changedBy"       TEXT NOT NULL,
    "versesMemorized" INTEGER,
    "quality"         "ProgressQuality",
    "changedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note"            TEXT,
    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- Colonnes ajoutées si la table existait déjà
ALTER TABLE "status_history" ADD COLUMN IF NOT EXISTS "versesMemorized" INTEGER;
ALTER TABLE "status_history" ADD COLUMN IF NOT EXISTS "quality" "ProgressQuality";

-- Clé étrangère
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'status_history_progressId_fkey'
        AND table_name = 'status_history'
    ) THEN
        ALTER TABLE "status_history" ADD CONSTRAINT "status_history_progressId_fkey"
            FOREIGN KEY ("progressId") REFERENCES "memorization_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================
-- 4. TABLE parent_attendances (création complète)
-- ============================================================

CREATE TABLE IF NOT EXISTS "parent_attendances" (
    "id"          TEXT NOT NULL,
    "studentId"   TEXT NOT NULL,
    "parentId"    TEXT NOT NULL,
    "date"        DATE NOT NULL,
    "status"      "AttendanceStatus" NOT NULL,
    "reason"      TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parent_attendances_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE INDEX IF NOT EXISTS "parent_attendances_studentId_date_idx" ON "parent_attendances"("studentId", "date");
CREATE INDEX IF NOT EXISTS "parent_attendances_parentId_date_idx" ON "parent_attendances"("parentId", "date");
CREATE INDEX IF NOT EXISTS "parent_attendances_status_validatedBy_idx" ON "parent_attendances"("status", "validatedBy");

-- Clés étrangères
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'parent_attendances_studentId_fkey'
        AND table_name = 'parent_attendances'
    ) THEN
        ALTER TABLE "parent_attendances" ADD CONSTRAINT "parent_attendances_studentId_fkey"
            FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'parent_attendances_parentId_fkey'
        AND table_name = 'parent_attendances'
    ) THEN
        ALTER TABLE "parent_attendances" ADD CONSTRAINT "parent_attendances_parentId_fkey"
            FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
