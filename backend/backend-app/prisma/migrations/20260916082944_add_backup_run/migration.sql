-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "fileName" TEXT,
    "fileSizeBytes" INTEGER,
    "checksum" TEXT,
    "restoreVerifiedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupRun_status_idx" ON "BackupRun"("status");

-- CreateIndex
CREATE INDEX "BackupRun_startedAt_idx" ON "BackupRun"("startedAt");
