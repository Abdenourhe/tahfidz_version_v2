-- Colle dans Supabase SQL Editor → Run

CREATE TYPE IF NOT EXISTS "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS school_requests (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolName"      TEXT NOT NULL,
  city              TEXT,
  country           TEXT NOT NULL DEFAULT 'DZ',
  "adminEmail"      TEXT NOT NULL,
  "adminPassword"   TEXT NOT NULL,
  "adminName"       TEXT NOT NULL,
  "classCount"      INT  NOT NULL,
  "studentsPerClass" INT NOT NULL,
  "teachersCount"   INT  NOT NULL,
  status            "RequestStatus" NOT NULL DEFAULT 'PENDING',
  slug              TEXT,
  "rejectionReason" TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "processedAt"     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_school_requests_status ON school_requests(status);

SELECT 'Table school_requests créée ✅' AS result;
