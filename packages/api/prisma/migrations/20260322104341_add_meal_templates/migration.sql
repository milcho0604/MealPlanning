-- CreateTable
CREATE TABLE "meal_templates" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "menu_name" TEXT NOT NULL,
    "memo" TEXT,
    "recipe_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_templates_group_id_idx" ON "meal_templates"("group_id");

-- AddForeignKey
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
