/**
 * 식단 계획(Meal Plan) 관련 공통 타입 정의
 */
/** 식사 유형 - 아침/점심/저녁/간식 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
/** 반복 규칙 - 매주/매월/특정 날짜 */
export type RecurRule = 'weekly' | 'monthly' | 'custom';
/** 식단 단건 */
export interface MealPlan {
    id: string;
    groupId: string;
    createdBy: string;
    /** 식단 날짜 (YYYY-MM-DD) */
    date: string;
    mealType: MealType;
    menuName: string;
    memo: string | null;
    recipeUrl: string | null;
    /** 식단 사진 URL */
    photoUrl: string | null;
    isRecurring: boolean;
    recurRule: RecurRule | null;
    createdAt: string;
    updatedAt: string;
}
/** 식단 생성 요청 바디 */
export interface CreateMealPlanRequest {
    groupId: string;
    date: string;
    mealType: MealType;
    menuName: string;
    memo?: string;
    recipeUrl?: string;
    photoUrl?: string;
    isRecurring?: boolean;
    recurRule?: RecurRule;
    /** 특정 날짜 반복 시 추가 날짜 목록 (YYYY-MM-DD[]) */
    dates?: string[];
}
/** 식단 수정 요청 바디 - 모든 필드 선택적 */
export type UpdateMealPlanRequest = Partial<Pick<CreateMealPlanRequest, 'menuName' | 'memo' | 'recipeUrl' | 'photoUrl' | 'isRecurring' | 'recurRule'>>;
/** 식단 템플릿 */
export interface MealTemplate {
    id: string;
    groupId: string;
    /** 템플릿 이름 (사용자 지정) */
    name: string;
    mealType: MealType;
    menuName: string;
    memo: string | null;
    recipeUrl: string | null;
    createdAt: string;
}
/** 템플릿 생성 요청 바디 */
export interface CreateMealTemplateRequest {
    groupId: string;
    name: string;
    mealType: MealType;
    menuName: string;
    memo?: string;
    recipeUrl?: string;
}
/** 기간별 식단 조회 쿼리 파라미터 */
export interface GetMealPlansQuery {
    groupId: string;
    /** 조회 시작 날짜 (YYYY-MM-DD) */
    from: string;
    /** 조회 종료 날짜 (YYYY-MM-DD) */
    to: string;
}
//# sourceMappingURL=meal-plan.types.d.ts.map