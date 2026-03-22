/**
 * @mealplan/shared 패키지 루트 진입점
 *
 * 공통 타입, 상수, 유틸 함수를 모두 이곳에서 내보냅니다.
 * 모바일 앱(apps/mobile)과 API 서버(packages/api) 양쪽에서 사용합니다.
 */
export * from './types/api.types';
export * from './types/auth.types';
export * from './types/group.types';
export * from './types/ingredient.types';
export * from './types/meal-plan.types';
export * from './types/shopping.types';
export * from './types/user.types';
/** API 버전 prefix */
export declare const API_VERSION: "v1";
/** 기본 페이지 크기 */
export declare const DEFAULT_PAGE_SIZE: 20;
/** 유통기한 임박 기준 (일수) */
export declare const EXPIRY_WARNING_DAYS: 3;
/** 식사 타입 목록 (한국어 레이블 포함) */
export declare const MEAL_TYPE_LABELS: {
    readonly breakfast: "아침";
    readonly lunch: "점심";
    readonly dinner: "저녁";
    readonly snack: "간식";
};
/** 재료 카테고리 목록 (한국어 레이블 포함) */
export declare const INGREDIENT_CATEGORY_LABELS: {
    readonly meat: "육류";
    readonly vegetable: "채소";
    readonly dairy: "유제품";
    readonly seafood: "해산물";
    readonly grain: "곡물";
    readonly sauce: "소스/양념";
    readonly frozen: "냉동식품";
    readonly other: "기타";
};
/** 멤버 역할 목록 (한국어 레이블 포함) */
export declare const MEMBER_ROLE_LABELS: {
    readonly owner: "관리자";
    readonly editor: "편집자";
    readonly viewer: "뷰어";
};
//# sourceMappingURL=index.d.ts.map