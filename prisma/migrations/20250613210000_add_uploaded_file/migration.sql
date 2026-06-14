-- CreateTable
CREATE TABLE IF NOT EXISTS "uploaded_files" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "hash" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uploaded_files_key_key" ON "uploaded_files"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "uploaded_files_hash_idx" ON "uploaded_files"("hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "uploaded_files_schoolId_hash_idx" ON "uploaded_files"("schoolId", "hash");
