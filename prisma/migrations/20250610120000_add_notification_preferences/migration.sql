-- AlterTable
ALTER TABLE "users" ADD COLUMN     "attendanceNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "evaluationNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "soundEnabled" BOOLEAN NOT NULL DEFAULT true;
