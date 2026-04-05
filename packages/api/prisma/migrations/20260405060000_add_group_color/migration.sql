-- 그룹 테이블에 색상 컬럼 추가 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'color'
  ) THEN
    ALTER TABLE "groups" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#4CAF50';
  END IF;
END $$;
