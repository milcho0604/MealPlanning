-- AlterTable: add provider fields to users
ALTER TABLE "users" ADD COLUMN "provider" TEXT;
ALTER TABLE "users" ADD COLUMN "provider_id" TEXT;

-- CreateIndex: unique constraint on (provider, provider_id)
CREATE UNIQUE INDEX "users_provider_provider_id_key" ON "users"("provider", "provider_id");
