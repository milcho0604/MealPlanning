-- 식단 테이블에 칼로리 컬럼 추가 (선택 필드)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'calories'
  ) THEN
    ALTER TABLE "meal_plans" ADD COLUMN "calories" INTEGER;
  END IF;
END $$;
