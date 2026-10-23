-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'PROCESSING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "razorpayFundAccountId" TEXT;

-- AlterTable
ALTER TABLE "BeneficiaryScheme" ADD COLUMN "paymentTry" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "payoutId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BeneficiaryScheme_payoutId_key" ON "BeneficiaryScheme"("payoutId");
