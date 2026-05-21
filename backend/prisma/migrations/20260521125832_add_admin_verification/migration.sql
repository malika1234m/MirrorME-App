-- AlterTable
ALTER TABLE "business_accounts" ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'none';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
