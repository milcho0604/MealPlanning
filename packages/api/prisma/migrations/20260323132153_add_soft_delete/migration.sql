-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status_yn" TEXT NOT NULL DEFAULT 'Y';
