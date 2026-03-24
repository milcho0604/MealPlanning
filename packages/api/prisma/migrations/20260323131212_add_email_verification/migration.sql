-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verify_token" TEXT,
ADD COLUMN     "verify_token_expiry" TIMESTAMP(3);
