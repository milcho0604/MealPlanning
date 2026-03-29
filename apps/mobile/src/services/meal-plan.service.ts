/**
 * 식단 API 서비스 (Meal Plan Service)
 *
 * 식단 관련 API 호출을 담당합니다.
 * 컴포넌트/훅에서 직접 axios를 호출하지 않고 이 서비스를 사용합니다.
 */

import type { CreateMealPlanRequest, MealPlan, UpdateMealPlanRequest } from '@mealplan/shared';
import { apiClient } from './api.client';

/** 식단 목록 조회 파라미터 */
interface GetMealPlansParams {
  groupId: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/** 식단에 등록자 정보가 포함된 응답 타입 */
export interface MealPlanWithUser extends MealPlan {
  createdByUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export const mealPlanService = {
  /**
   * 기간별 식단 목록 조회
   * 캘린더(월간), 주간 리스트 뷰에서 사용
   */
  getList: async (params: GetMealPlansParams): Promise<MealPlanWithUser[]> => {
    const { data } = await apiClient.get<{ success: true; data: MealPlanWithUser[] }>(
      '/meal-plans',
      { params },
    );
    return data.data;
  },

  /** 식단 통계 */
  getStats: async (groupId: string): Promise<{
    topMenus: { menuName: string; count: number }[];
    monthlyDistribution: Record<string, Record<string, number>>;
  }> => {
    const { data } = await apiClient.get<{ success: true; data: any }>(
      '/meal-plans/stats',
      { params: { groupId } },
    );
    return data.data;
  },

  /** 메뉴명으로 식단 검색 */
  search: async (groupId: string, query: string): Promise<MealPlanWithUser[]> => {
    const { data } = await apiClient.get<{ success: true; data: MealPlanWithUser[] }>(
      '/meal-plans/search',
      { params: { groupId, query } },
    );
    return data.data;
  },

  /**
   * 식단 생성
   */
  create: async (body: CreateMealPlanRequest): Promise<MealPlanWithUser> => {
    const { data } = await apiClient.post<{ success: true; data: MealPlanWithUser }>(
      '/meal-plans',
      body,
    );
    return data.data;
  },

  /**
   * 식단 수정
   */
  update: async (id: string, body: UpdateMealPlanRequest): Promise<MealPlanWithUser> => {
    const { data } = await apiClient.put<{ success: true; data: MealPlanWithUser }>(
      `/meal-plans/${id}`,
      body,
    );
    return data.data;
  },

  /**
   * 식단 삭제
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/meal-plans/${id}`);
  },
};
