/**
 * 식단 템플릿 API 서비스 (Template Service)
 *
 * 템플릿 조회 / 저장 / 삭제 API 호출을 담당합니다.
 */

import type { MealTemplate, CreateMealTemplateRequest } from '@mealplan/shared';
import { apiClient } from './api.client';

export const templateService = {
  /**
   * 그룹 템플릿 목록 조회
   */
  getList: async (groupId: string): Promise<MealTemplate[]> => {
    const { data } = await apiClient.get<{ success: true; data: MealTemplate[] }>(
      '/meal-templates',
      { params: { groupId } },
    );
    return data.data;
  },

  /**
   * 템플릿 저장
   */
  create: async (body: CreateMealTemplateRequest): Promise<MealTemplate> => {
    const { data } = await apiClient.post<{ success: true; data: MealTemplate }>(
      '/meal-templates',
      body,
    );
    return data.data;
  },

  /**
   * 템플릿 삭제
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/meal-templates/${id}`);
  },
};
