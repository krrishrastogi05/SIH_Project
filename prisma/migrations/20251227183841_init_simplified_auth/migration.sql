-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BENEFICIARY', 'OFFICER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BENEFICIARY',
    "age" INTEGER,
    "gender" TEXT,
    "income" INTEGER,
    "occupation" TEXT,
    "state" TEXT,
    "district" TEXT,
    "pincode" TEXT,
    "education" TEXT,
    "bankAccount" TEXT,
    "ifsc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
