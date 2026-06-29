-- DropIndex
DROP INDEX IF EXISTS "attendances_studentId_date_key";

-- CreateTable
CREATE TABLE IF NOT EXISTS "student_groups" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_groups_groupId_idx" ON "student_groups"("groupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_groups_studentId_idx" ON "student_groups"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "student_groups_studentId_groupId_key" ON "student_groups"("studentId", "groupId");

-- Migrate existing single-group students into the new join table
INSERT INTO "student_groups" ("id", "studentId", "groupId", "createdAt")
SELECT gen_random_uuid(), "id", "groupId", CURRENT_TIMESTAMP
FROM "students"
WHERE "groupId" IS NOT NULL
ON CONFLICT ("studentId", "groupId") DO NOTHING;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendances_studentId_idx" ON "attendances"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "attendances_studentId_groupId_date_key" ON "attendances"("studentId", "groupId", "date");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'student_groups_studentId_fkey'
        AND table_name = 'student_groups'
    ) THEN
        ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_studentId_fkey"
            FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'student_groups_groupId_fkey'
        AND table_name = 'student_groups'
    ) THEN
        ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_groupId_fkey"
            FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
