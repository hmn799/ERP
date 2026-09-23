-- AlterTable
ALTER TABLE "Shortcut" ADD COLUMN     "actionType" TEXT NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "targetPath" TEXT;
