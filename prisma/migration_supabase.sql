-- ============================================================
-- TAHFIDZ — Migration complète (à coller dans Supabase SQL Editor)
-- ============================================================

-- 1. Nettoyer les tables existantes (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS student_stats CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS group_announcements CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS stars_logs CASCADE;
DROP TABLE IF EXISTS student_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS memorized_surahs CASCADE;
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS memorization_progress CASCADE;
DROP TABLE IF EXISTS surahs CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS parent_student_links CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- 2. Supprimer les anciens types
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "SchoolPlan" CASCADE;
DROP TYPE IF EXISTS "Gender" CASCADE;
DROP TYPE IF EXISTS "MemorizationStatus" CASCADE;
DROP TYPE IF EXISTS "AttendanceStatus" CASCADE;
DROP TYPE IF EXISTS "AnnouncementType" CASCADE;
DROP TYPE IF EXISTS "BadgeRarity" CASCADE;
DROP TYPE IF EXISTS "EvaluationDecision" CASCADE;

-- 3. Créer les enums
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN','ADMIN','TEACHER','PARENT','STUDENT');
CREATE TYPE "SchoolPlan" AS ENUM ('FREE','STARTER','PRO','ENTERPRISE');
CREATE TYPE "Gender" AS ENUM ('MALE','FEMALE');
CREATE TYPE "MemorizationStatus" AS ENUM ('NOT_STARTED','IN_PROGRESS','UNDER_REVIEW','READY_FOR_RECITATION','PENDING_TEACHER_APPROVAL','MEMORIZED','NEEDS_REVISION');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE','EXCUSED');
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL','EVENT','ACHIEVEMENT','URGENT');
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON','RARE','EPIC','LEGENDARY');
CREATE TYPE "EvaluationDecision" AS ENUM ('APPROVED','NEEDS_REVISION','REJECTED');

-- 4. Table schools
CREATE TABLE schools (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  "nameAr"   TEXT,
  slug       TEXT NOT NULL UNIQUE,
  plan       "SchoolPlan" NOT NULL DEFAULT 'FREE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  settings   JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_schools_slug ON schools(slug);

-- 5. Table users
CREATE TABLE users (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"     TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  password       TEXT NOT NULL,
  "fullName"     TEXT NOT NULL,
  "fullNameAr"   TEXT,
  role           "UserRole" NOT NULL,
  phone          TEXT,
  gender         "Gender",
  avatar         TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "emailVerified" TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastLoginAt"  TIMESTAMPTZ,
  UNIQUE ("schoolId", email)
);
CREATE INDEX idx_users_school_role ON users("schoolId", role);
CREATE INDEX idx_users_school_email ON users("schoolId", email);

-- 6. Table sessions
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Table admins
CREATE TABLE admins (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB
);

-- 8. Table teachers
CREATE TABLE teachers (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"       TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio            TEXT,
  specialization TEXT,
  "maxStudents"  INT NOT NULL DEFAULT 20,
  "isActive"     BOOLEAN NOT NULL DEFAULT true
);

-- 9. Table parents
CREATE TABLE parents (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Table groups (avant students pour la FK)
CREATE TABLE groups (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"    TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  "nameAr"      TEXT,
  "teacherId"   TEXT NOT NULL REFERENCES teachers(id),
  level         TEXT NOT NULL,
  schedule      JSONB,
  "maxCapacity" INT NOT NULL DEFAULT 15,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_groups_school ON groups("schoolId");
CREATE INDEX idx_groups_teacher ON groups("teacherId");

-- 11. Table students
CREATE TABLE students (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"         TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "studentCode"    TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "dateOfBirth"    TIMESTAMPTZ,
  "enrollmentDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "groupId"        TEXT REFERENCES groups(id),
  "teacherId"      TEXT REFERENCES teachers(id),
  "currentSurahId" INT,
  "totalStars"     INT NOT NULL DEFAULT 0,
  "currentStreak"  INT NOT NULL DEFAULT 0,
  "longestStreak"  INT NOT NULL DEFAULT 0,
  "lastActivityDate" TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX idx_students_group ON students("groupId");
CREATE INDEX idx_students_teacher ON students("teacherId");
CREATE INDEX idx_students_code ON students("studentCode");

-- 12. Table parent_student_links
CREATE TABLE parent_student_links (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "parentId"  TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relation    TEXT NOT NULL,
  "accessCode" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("parentId", "studentId")
);

-- 13. Table surahs
CREATE TABLE surahs (
  id               INT PRIMARY KEY,
  "nameAr"         TEXT NOT NULL,
  "nameFr"         TEXT NOT NULL,
  "nameEn"         TEXT NOT NULL,
  "verseCount"     INT NOT NULL,
  "juzNumber"      INT NOT NULL,
  "revelationType" TEXT NOT NULL,
  "difficultyLevel" INT NOT NULL DEFAULT 3,
  "orderInMushaf"  INT NOT NULL
);

-- 14. Table memorization_progress
CREATE TABLE memorization_progress (
  id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId"            TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "surahId"              INT NOT NULL REFERENCES surahs(id),
  "startVerse"           INT NOT NULL DEFAULT 1,
  "endVerse"             INT NOT NULL,
  "targetDate"           TIMESTAMPTZ,
  status                 "MemorizationStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "currentVerse"         INT NOT NULL DEFAULT 1,
  "completionPercentage" FLOAT NOT NULL DEFAULT 0,
  "startedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completedAt"          TIMESTAMPTZ,
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "surahId", "startVerse", "endVerse")
);
CREATE INDEX idx_progress_student_status ON memorization_progress("studentId", status);

-- 15. Table status_history
CREATE TABLE status_history (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "progressId" TEXT NOT NULL REFERENCES memorization_progress(id) ON DELETE CASCADE,
  "oldStatus"  "MemorizationStatus" NOT NULL,
  "newStatus"  "MemorizationStatus" NOT NULL,
  "changedBy"  TEXT NOT NULL,
  "changedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  note         TEXT
);

-- 16. Table memorized_surahs
CREATE TABLE memorized_surahs (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId"       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "surahId"         INT NOT NULL REFERENCES surahs(id),
  "progressId"      TEXT NOT NULL UNIQUE,
  "completionDate"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "versesMemorized" INT NOT NULL,
  "finalScore"      INT,
  "teacherNotes"    TEXT,
  "starsEarned"     INT NOT NULL DEFAULT 0
);

-- 17. Table evaluations
CREATE TABLE evaluations (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "progressId"          TEXT NOT NULL UNIQUE REFERENCES memorization_progress(id) ON DELETE CASCADE,
  "studentId"           TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "teacherId"           TEXT NOT NULL REFERENCES teachers(id),
  "evaluatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "evaluationType"      TEXT NOT NULL,
  "memorizationScore"   INT NOT NULL,
  "tajweedScore"        INT NOT NULL,
  "fluencyScore"        INT NOT NULL,
  "makharijScore"       INT,
  "tafsirUnderstanding" INT,
  "finalScore"          INT NOT NULL,
  "teacherNotes"        TEXT,
  strengths             TEXT[] NOT NULL DEFAULT '{}',
  improvements          TEXT[] NOT NULL DEFAULT '{}',
  "revisionRequired"    BOOLEAN NOT NULL DEFAULT false,
  decision              "EvaluationDecision" NOT NULL
);
CREATE INDEX idx_evaluations_student ON evaluations("studentId");
CREATE INDEX idx_evaluations_teacher ON evaluations("teacherId");

-- 18. Table attendances
CREATE TABLE attendances (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId"   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "groupId"     TEXT REFERENCES groups(id),
  date          TIMESTAMPTZ NOT NULL,
  status        "AttendanceStatus" NOT NULL,
  "checkInTime"  TIMESTAMPTZ,
  "checkOutTime" TIMESTAMPTZ,
  notes         TEXT,
  "recordedBy"  TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentId", date)
);
CREATE INDEX idx_attendances_date ON attendances(date);
CREATE INDEX idx_attendances_group ON attendances("groupId");

-- 19. Table badges
CREATE TABLE badges (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"      TEXT REFERENCES schools(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  "nameAr"        TEXT NOT NULL,
  description     TEXT NOT NULL,
  "descriptionAr" TEXT NOT NULL,
  icon            TEXT NOT NULL,
  color           TEXT NOT NULL,
  "criteriaType"  TEXT NOT NULL,
  "criteriaValue" INT NOT NULL,
  rarity          "BadgeRarity" NOT NULL DEFAULT 'COMMON'
);
CREATE INDEX idx_badges_school ON badges("schoolId");

-- 20. Table student_badges
CREATE TABLE student_badges (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId"  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "badgeId"    TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "earnedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "earnedValue" INT NOT NULL,
  UNIQUE ("studentId", "badgeId")
);

-- 21. Table stars_logs
CREATE TABLE stars_logs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId"   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount        INT NOT NULL,
  "balanceAfter" INT NOT NULL,
  "sourceType"  TEXT NOT NULL,
  "sourceId"    TEXT,
  reason        TEXT NOT NULL,
  "awardedBy"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stars_logs_student ON stars_logs("studentId");

-- 22. Table announcements
CREATE TABLE announcements (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  "titleAr"    TEXT,
  content      TEXT NOT NULL,
  "contentAr"  TEXT,
  type         "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
  "targetRoles" "UserRole"[] NOT NULL DEFAULT '{}',
  "isPinned"   BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"  TIMESTAMPTZ,
  "createdBy"  TEXT NOT NULL REFERENCES users(id),
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_school ON announcements("schoolId", "isPublished", "publishedAt");

-- 23. Table group_announcements
CREATE TABLE group_announcements (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "announcementId" TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  "groupId"        TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE ("announcementId", "groupId")
);

-- 24. Table notifications
CREATE TABLE notifications (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"  TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  "titleAr"   TEXT,
  message     TEXT NOT NULL,
  "messageAr" TEXT,
  data        JSONB,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "readAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_school_user ON notifications("schoolId", "userId", "isRead");

-- 25. Table student_stats
CREATE TABLE student_stats (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId"              TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  "totalSurahsMemorized"   INT NOT NULL DEFAULT 0,
  "totalVersesMemorized"   INT NOT NULL DEFAULT 0,
  "totalEvaluationScore"   INT NOT NULL DEFAULT 0,
  "evaluationCount"        INT NOT NULL DEFAULT 0,
  "averageScore"           FLOAT NOT NULL DEFAULT 0,
  "attendanceRate"         FLOAT NOT NULL DEFAULT 0,
  "currentStreakStart"     TIMESTAMPTZ,
  "longestStreakStart"     TIMESTAMPTZ,
  "longestStreakEnd"       TIMESTAMPTZ,
  "lastCalculatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. Table audit_logs
CREATE TABLE audit_logs (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  "userId"     TEXT NOT NULL REFERENCES users(id),
  action       TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId"   TEXT,
  "oldValues"  JSONB,
  "newValues"  JSONB,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_school_user ON audit_logs("schoolId", "userId");
CREATE INDEX idx_audit_logs_entity ON audit_logs("entityType", "entityId");

-- 27. Table exams
CREATE TABLE exams (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  "titleAr"    TEXT,
  description  TEXT,
  "groupId"    TEXT NOT NULL REFERENCES groups(id),
  "teacherId"  TEXT NOT NULL REFERENCES teachers(id),
  "examDate"   TIMESTAMPTZ NOT NULL,
  duration     INT NOT NULL DEFAULT 60,
  "surahIds"   INT[] NOT NULL DEFAULT '{}',
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exams_school ON exams("schoolId");
CREATE INDEX idx_exams_group ON exams("groupId");
CREATE INDEX idx_exams_teacher ON exams("teacherId");

-- 28. Table direct_messages
CREATE TABLE direct_messages (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId"   TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  "fromUserId" TEXT NOT NULL REFERENCES users(id),
  "toUserId"   TEXT NOT NULL REFERENCES users(id),
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  "isRead"     BOOLEAN NOT NULL DEFAULT false,
  "sentAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dm_school_user ON direct_messages("schoolId", "toUserId", "isRead");

-- Trigger updatedAt automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON memorization_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT 'Migration TAHFIDZ terminée avec succès ✅' AS result;
