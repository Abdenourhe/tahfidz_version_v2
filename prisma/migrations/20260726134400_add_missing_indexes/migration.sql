-- CreateIndex
CREATE INDEX "daily_progress_logs_createdById_idx" ON "daily_progress_logs"("createdById");

-- CreateIndex
CREATE INDEX "direct_messages_fromUserId_idx" ON "direct_messages"("fromUserId");

-- CreateIndex
CREATE INDEX "error_logs_source_idx" ON "error_logs"("source");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
