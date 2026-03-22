/**
 * 냉장고 재료 API 서비스 (Ingredient Service)
 *
 * 재료 관련 API 호출을 담당합니다.
 * 컴포넌트/훅에서 직접 axios를 호출하지 않고 이 서비스를 사용합니다.
 */

import type {
  CreateIngredientRequest,
  Ingredient,
  UpdateIngredientRequest,
} from '@mealplan/shared';
import { apiClient } from './api.client';

/** 재료 목록 조회 파라미터 */
interface GetIngredientsParams {
  groupId: string;
  /** true 전달 시 소진되지 않은 재료 중 유통기한 임박(3일 이내)만 반환 */
  expiringOnly?: boolean;
}

export const ingredientService = {
  /**
   * 재료 목록 조회
   * expiringOnly=true이면 유통기한 임박 재료만 반환
   */
  getList: async (params: GetIngredientsParams): Promise<Ingredient[]> => {
    const { data } = await apiClient.get<{ success: true; data: Ingredient[] }>(
      '/ingredients',
      { params },
    );
    return data.data;
  },

  /**
   * 재료 추가
   */
  create: async (body: CreateIngredientRequest): Promise<Ingredient> => {
    const { data } = await apiClient.post<{ success: true; data: Ingredient }>(
      '/ingredients',
      body,
    );
    return data.data;
  },

  /**
   * 재료 수정
   */
  update: async (id: string, body: UpdateIngredientRequest): Promise<Ingredient> => {
    const { data } = await apiClient.put<{ success: true; data: Ingredient }>(
      `/ingredients/${id}`,
      body,
    );
    return data.data;
  },

  /**
   * 재료 삭제
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/ingredients/${id}`);
  },

  /**
   * 재료 소진 처리 (isConsumed = true)
   */
  consume: async (id: string): Promise<Ingredient> => {
    const { data } = await apiClient.patch<{ success: true; data: Ingredient }>(
      `/ingredients/${id}/consume`,
    );
    return data.data;
  },
};
