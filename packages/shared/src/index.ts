/**
 * @mealplan/shared 패키지 루트 진입점
 *
 * 공통 타입, 상수, 유틸 함수를 모두 이곳에서 내보냅니다.
 * 모바일 앱(apps/mobile)과 API 서버(packages/api) 양쪽에서 사용합니다.
 */

// 타입 정의 - 각 파일을 직접 임포트 (Node.js ESM 디렉토리 임포트 미지원 대응)
export * from './types/api.types';
export * from './types/auth.types';
export * from './types/group.types';
export * from './types/ingredient.types';
export * from './types/meal-plan.types';
export * from './types/shopping.types';
export * from './types/user.types';

// ─── 공통 상수 ────────────────────────────────────────────────────────────────

/** API 버전 prefix */
export const API_VERSION = 'v1' as const;

/** 기본 페이지 크기 */
export const DEFAULT_PAGE_SIZE = 20 as const;

/** 유통기한 임박 기준 (일수) */
export const EXPIRY_WARNING_DAYS = 3 as const;

/** 식사 타입 목록 (한국어 레이블 포함) */
export const MEAL_TYPE_LABELS = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
} as const;

/** 재료 카테고리 목록 (한국어 레이블 포함) */
export const INGREDIENT_CATEGORY_LABELS = {
  meat: '육류',
  vegetable: '채소',
  dairy: '유제품',
  seafood: '해산물',
  grain: '곡물',
  sauce: '소스/양념',
  frozen: '냉동식품',
  other: '기타',
} as const;

/** 멤버 역할 목록 (한국어 레이블 포함) */
export const MEMBER_ROLE_LABELS = {
  owner: '관리자',
  editor: '편집자',
  viewer: '뷰어',
} as const;
