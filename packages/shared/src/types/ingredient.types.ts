/**
 * 냉장고 재료(Ingredient) 관련 공통 타입 정의
 */

/** 재료 카테고리 */
export type IngredientCategory =
  | 'meat'       // 육류
  | 'vegetable'  // 채소
  | 'dairy'      // 유제품
  | 'seafood'    // 해산물
  | 'grain'      // 곡물
  | 'sauce'      // 소스/양념
  | 'frozen'     // 냉동식품
  | 'other';     // 기타

/** 재료 수량 단위 */
export type IngredientUnit = 'g' | 'kg' | 'ml' | 'L' | '개' | '봉' | '팩' | '캔' | '인분';

/** 냉장고 재료 단건 */
export interface Ingredient {
  id: string;
  groupId: string;
  name: string;
  quantity: number | null;
  unit: IngredientUnit | null;
  category: IngredientCategory | null;
  /** 유통기한 (YYYY-MM-DD) */
  expiryDate: string | null;
  /** 소진 여부 */
  isConsumed: boolean;
  createdAt: string;
}

/** 재료 추가 요청 바디 */
export interface CreateIngredientRequest {
  groupId: string;
  name: string;
  quantity?: number;
  unit?: IngredientUnit;
  category?: IngredientCategory;
  expiryDate?: string;
}

/** 재료 수정 요청 바디 */
export type UpdateIngredientRequest = Partial<
  Pick<CreateIngredientRequest, 'name' | 'quantity' | 'unit' | 'category' | 'expiryDate'>
>;
