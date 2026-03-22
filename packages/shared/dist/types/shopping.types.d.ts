/**
 * 쇼핑 리스트(Shopping) 관련 공통 타입 정의
 */
/** 쇼핑 리스트 항목 단건 */
export interface ShoppingItem {
    id: string;
    groupId: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    /** 체크(구매 완료) 여부 */
    isChecked: boolean;
    createdAt: string;
}
/** 쇼핑 항목 추가 요청 바디 */
export interface CreateShoppingItemRequest {
    groupId: string;
    name: string;
    quantity?: number;
    unit?: string;
}
/** 식단 기반 쇼핑 리스트 자동 생성 요청 바디 */
export interface GenerateShoppingListRequest {
    groupId: string;
    /** 대상 주간의 시작 날짜 (YYYY-MM-DD, 월요일 기준) */
    weekStartDate: string;
}
//# sourceMappingURL=shopping.types.d.ts.map