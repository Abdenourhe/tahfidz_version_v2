-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN     "deletedByReceiverAt" TIMESTAMP(3),
ADD COLUMN     "deletedBySenderAt" TIMESTAMP(3);

