/**
 * 쇼핑 리스트 API 서비스 (Shopping Service)
 *
 * 쇼핑 항목 추가/수정/삭제, 체크 토글, 완료 항목 일괄 삭제 API 호출을 담당합니다.
 */

import type { ShoppingItem } from '@mealplan/shared';
import { apiClient } from './api.client';

export const shoppingService = {
  /**
   * 그룹 쇼핑 목록 조회
   */
  getList: async (groupId: string): Promise<ShoppingItem[]> => {
    const { data } = await apiClient.get<{ success: true; data: ShoppingItem[] }>('/shopping', {
      params: { groupId },
    });
    return data.data;
  },

  /**
   * 쇼핑 항목 추가
   */
  create: async (body: { groupId: string; name: string; quantity?: number; unit?: string }): Promise<ShoppingItem> => {
    const { data } = await apiClient.post<{ success: true; data: ShoppingItem }>('/shopping', body);
    return data.data;
  },

  /**
   * 쇼핑 항목 수정
   */
  update: async (id: string, body: { name?: string; quantity?: number; unit?: string }): Promise<ShoppingItem> => {
    const { data } = await apiClient.put<{ success: true; data: ShoppingItem }>(
      `/shopping/${id}`,
      body,
    );
    return data.data;
  },

  /**
   * 체크 상태 토글 (구매 완료 ↔ 미완료)
   */
  toggleCheck: async (id: string): Promise<ShoppingItem> => {
    const { data } = await apiClient.patch<{ success: true; data: ShoppingItem }>(
      `/shopping/${id}/check`,
    );
    return data.data;
  },

  /**
   * 쇼핑 항목 삭제
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/shopping/${id}`);
  },

  /**
   * 완료(체크) 항목 일괄 삭제
   */
  clearChecked: async (groupId: string): Promise<void> => {
    await apiClient.delete('/shopping/checked', { params: { groupId } });
  },
};
