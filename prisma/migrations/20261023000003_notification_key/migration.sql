-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_key_key" ON "Notification"("key");
