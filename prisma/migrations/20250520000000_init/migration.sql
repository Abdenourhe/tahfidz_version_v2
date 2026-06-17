-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "SchoolPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MemorizationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'READY_FOR_RECITATION', 'PENDING_TEACHER_APPROVAL', 'MEMORIZED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'EVENT', 'ACHIEVEMENT', 'URGENT');

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "EvaluationDecision" AS ENUM ('APPROVED', 'NEEDS_REVISION', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "plan" "SchoolPlan" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'DZ',
    "phone" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fullNameAr" TEXT,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "gender" "Gender",
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" JSONB,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialization" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT,
    "teacherId" TEXT,
    "currentSurahId" INTEGER,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_links" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "teacherId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "schedule" JSONB,
    "maxCapacity" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surahs" (
    "id" INTEGER NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "verseCount" INTEGER NOT NULL,
    "juzNumber" INTEGER NOT NULL,
    "revelationType" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "orderInMushaf" INTEGER NOT NULL,

    CONSTRAINT "surahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorization_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "startVerse" INTEGER NOT NULL DEFAULT 1,
    "endVerse" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" "MemorizationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentVerse" INTEGER NOT NULL DEFAULT 1,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memorization_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "oldStatus" "MemorizationStatus" NOT NULL,
    "newStatus" "MemorizationStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorized_surahs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "surahId" INTEGER NOT NULL,
    "progressId" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "versesMemorized" INTEGER NOT NULL,
    "finalScore" INTEGER,
    "teacherNotes" TEXT,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "memorized_surahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationType" TEXT NOT NULL,
    "memorizationScore" INTEGER NOT NULL,
    "tajweedScore" INTEGER NOT NULL,
    "fluencyScore" INTEGER NOT NULL,
    "makharijScore" INTEGER,
    "tafsirUnderstanding" INTEGER,
    "finalScore" INTEGER NOT NULL,
    "teacherNotes" TEXT,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "revisionRequired" BOOLEAN NOT NULL DEFAULT false,
    "decision" "EvaluationDecision" NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "criteriaType" TEXT NOT NULL,
    "criteriaValue" INTEGER NOT NULL,
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'COMMON',

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_badges" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earnedValue" INTEGER NOT NULL,

    CONSTRAINT "student_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stars_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "reason" TEXT NOT NULL,
    "awardedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stars_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "content" TEXT NOT NULL,
    "contentAr" TEXT,
    "type" "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
    "targetRoles" "UserRole"[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_announcements" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "group_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "message" TEXT NOT NULL,
    "messageAr" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_stats" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalSurahsMemorized" INTEGER NOT NULL DEFAULT 0,
    "totalVersesMemorized" INTEGER NOT NULL DEFAULT 0,
    "totalEvaluationScore" INTEGER NOT NULL DEFAULT 0,
    "evaluationCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStreakStart" TIMESTAMP(3),
    "longestStreakStart" TIMESTAMP(3),
    "longestStreakEnd" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "source" TEXT NOT NULL DEFAULT 'api',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorEmail" TEXT,
    "actorName" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "details" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target" TEXT NOT NULL DEFAULT 'all',
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "groupId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "surahIds" INTEGER[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_requests" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'DZ',
    "plan" "SchoolPlan" NOT NULL DEFAULT 'FREE',
    "address" TEXT,
    "adminEmail" TEXT NOT NULL,
    "adminPassword" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "classCount" INTEGER NOT NULL,
    "studentsPerClass" INTEGER NOT NULL,
    "adminPhone" TEXT,
    "teachersCount" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "slug" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "school_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUG',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "screenshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_slug_idx" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "users_schoolId_role_idx" ON "users"("schoolId", "role");

-- CreateIndex
CREATE INDEX "users_schoolId_email_idx" ON "users"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_schoolId_email_key" ON "users"("schoolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_groupId_idx" ON "students"("groupId");

-- CreateIndex
CREATE INDEX "students_teacherId_idx" ON "students"("teacherId");

-- CreateIndex
CREATE INDEX "students_studentCode_idx" ON "students"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_links_parentId_studentId_key" ON "parent_student_links"("parentId", "studentId");

-- CreateIndex
CREATE INDEX "groups_schoolId_idx" ON "groups"("schoolId");

-- CreateIndex
CREATE INDEX "groups_teacherId_idx" ON "groups"("teacherId");

-- CreateIndex
CREATE INDEX "memorization_progress_studentId_status_idx" ON "memorization_progress"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "memorization_progress_studentId_surahId_startVerse_endVerse_key" ON "memorization_progress"("studentId", "surahId", "startVerse", "endVerse");

-- CreateIndex
CREATE UNIQUE INDEX "memorized_surahs_progressId_key" ON "memorized_surahs"("progressId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_progressId_key" ON "evaluations"("progressId");

-- CreateIndex
CREATE INDEX "evaluations_studentId_idx" ON "evaluations"("studentId");

-- CreateIndex
CREATE INDEX "evaluations_teacherId_idx" ON "evaluations"("teacherId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_groupId_idx" ON "attendances"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_date_key" ON "attendances"("studentId", "date");

-- CreateIndex
CREATE INDEX "badges_schoolId_idx" ON "badges"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_badges_studentId_badgeId_key" ON "student_badges"("studentId", "badgeId");

-- CreateIndex
CREATE INDEX "stars_logs_studentId_idx" ON "stars_logs"("studentId");

-- CreateIndex
CREATE INDEX "announcements_schoolId_isPublished_publishedAt_idx" ON "announcements"("schoolId", "isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "group_announcements_announcementId_groupId_key" ON "group_announcements"("announcementId", "groupId");

-- CreateIndex
CREATE INDEX "notifications_schoolId_userId_isRead_idx" ON "notifications"("schoolId", "userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "student_stats_studentId_key" ON "student_stats"("studentId");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_severity_idx" ON "error_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_schoolId_userId_idx" ON "audit_logs"("schoolId", "userId");

-- CreateIndex
CREATE INDEX "audit_logs_schoolId_action_idx" ON "audit_logs"("schoolId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "broadcasts_schoolId_idx" ON "broadcasts"("schoolId");

-- CreateIndex
CREATE INDEX "broadcasts_sentAt_idx" ON "broadcasts"("sentAt");

-- CreateIndex
CREATE INDEX "exams_schoolId_idx" ON "exams"("schoolId");

-- CreateIndex
CREATE INDEX "exams_groupId_idx" ON "exams"("groupId");

-- CreateIndex
CREATE INDEX "exams_teacherId_idx" ON "exams"("teacherId");

-- CreateIndex
CREATE INDEX "direct_messages_schoolId_toUserId_isRead_idx" ON "direct_messages"("schoolId", "toUserId", "isRead");

-- CreateIndex
CREATE INDEX "school_requests_status_idx" ON "school_requests"("status");

-- CreateIndex
CREATE INDEX "feedbacks_schoolId_status_idx" ON "feedbacks"("schoolId", "status");

-- CreateIndex
CREATE INDEX "feedbacks_status_priority_idx" ON "feedbacks"("status", "priority");

-- CreateIndex
CREATE INDEX "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_progress" ADD CONSTRAINT "memorization_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorization_progress" ADD CONSTRAINT "memorization_progress_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surahs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "memorization_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorized_surahs" ADD CONSTRAINT "memorized_surahs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorized_surahs" ADD CONSTRAINT "memorized_surahs_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surahs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "memorization_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stars_logs" ADD CONSTRAINT "stars_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcements" ADD CONSTRAINT "group_announcements_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcements" ADD CONSTRAINT "group_announcements_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_stats" ADD CONSTRAINT "student_stats_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
