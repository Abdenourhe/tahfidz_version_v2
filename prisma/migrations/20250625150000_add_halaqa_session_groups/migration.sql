-- CreateTable
CREATE TABLE "halaqa_session_groups" (
    "id" TEXT NOT NULL,
    "halaqaSessionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "halaqa_session_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "halaqa_session_groups_halaqaSessionId_groupId_key" ON "halaqa_session_groups"("halaqaSessionId", "groupId");

-- AddForeignKey
ALTER TABLE "halaqa_session_groups" ADD CONSTRAINT "halaqa_session_groups_halaqaSessionId_fkey" FOREIGN KEY ("halaqaSessionId") REFERENCES "halaqa_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqa_session_groups" ADD CONSTRAINT "halaqa_session_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
