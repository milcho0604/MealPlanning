/**
 * 쇼핑 목록 뮤테이션 훅 (useShoppingMutation)
 *
 * 쇼핑 항목 생성/수정/삭제/체크 토글/일괄 삭제 처리 후 캐시를 자동 무효화합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ShoppingItem } from '@mealplan/shared';
import { shoppingService } from '../../services/shopping.service';
import { useGroupStore } from '../../stores/group.store';

export function useShoppingMutation(groupId?: string | null) {
  const queryClient = useQueryClient();
  const { currentGroupId, groups } = useGroupStore();
  // undefined → currentGroupId 사용 / null → 전체 그룹 모드
  const targetGroupId = groupId === undefined ? currentGroupId : groupId;

  /** 전체 그룹 모드이면 모든 쇼핑 캐시 무효화 */
  const invalidate = () => {
    if (targetGroupId) {
      queryClient.invalidateQueries({ queryKey: ['shopping', targetGroupId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    }
  };

  /** 항목 추가 */
  const createMutation = useMutation({
    mutationFn: (body: { groupId: string; name: string; quantity?: number; unit?: string }) =>
      shoppingService.create(body),
    onSuccess: invalidate,
  });

  /** 항목 수정 */
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; quantity?: number; unit?: string } }) =>
      shoppingService.update(id, body),
    onSuccess: invalidate,
  });

  /** 체크 토글 — Optimistic Update로 탭 즉시 UI 반영 */
  const toggleMutation = useMutation({
    mutationFn: (id: string) => shoppingService.toggleCheck(id),
    onMutate: async (id: string) => {
      if (targetGroupId) {
        // 단일 그룹: 해당 캐시 즉시 반영
        const qk = ['shopping', targetGroupId] as const;
        await queryClient.cancelQueries({ queryKey: qk });
        const previous = queryClient.getQueryData<ShoppingItem[]>(qk);
        queryClient.setQueryData<ShoppingItem[]>(qk, (old) =>
          (old ?? []).map((item) => item.id === id ? { ...item, isChecked: !item.isChecked } : item),
        );
        return { qk, previous };
      }
      // 전체 그룹 모드: 아이템이 있는 캐시를 찾아 즉시 반영
      for (const g of groups) {
        const qk = ['shopping', g.id] as const;
        const cached = queryClient.getQueryData<ShoppingItem[]>(qk);
        if (cached?.some((i) => i.id === id)) {
          await queryClient.cancelQueries({ queryKey: qk });
          queryClient.setQueryData<ShoppingItem[]>(qk, (old) =>
            (old ?? []).map((item) => item.id === id ? { ...item, isChecked: !item.isChecked } : item),
          );
          return { qk, previous: cached };
        }
      }
    },
    // 서버 오류 시 이전 상태로 롤백
    onError: (_err, _id, context) => {
      if (context?.qk && context?.previous) {
        queryClient.setQueryData(context.qk, context.previous);
      }
    },
    // 성공/실패 모두 서버와 최종 동기화
    onSettled: invalidate,
  });

  /** 항목 삭제 */
  const removeMutation = useMutation({
    mutationFn: (id: string) => shoppingService.remove(id),
    onSuccess: invalidate,
  });

  /** 완료 항목 일괄 삭제 */
  const clearCheckedMutation = useMutation({
    mutationFn: (groupId: string) => shoppingService.clearChecked(groupId),
    onSuccess: invalidate,
  });

  /** 주간 식단 기반 자동 생성 */
  const generateMutation = useMutation({
    mutationFn: ({ groupId, weekStartDate, mealPlanGroupId }: { groupId: string; weekStartDate: string; mealPlanGroupId?: string }) =>
      shoppingService.generate(groupId, weekStartDate, mealPlanGroupId),
    onSuccess: invalidate,
  });

  return {
    createShoppingItem: createMutation.mutateAsync,
    updateShoppingItem: updateMutation.mutateAsync,
    toggleShoppingItem: toggleMutation.mutateAsync,
    removeShoppingItem: removeMutation.mutateAsync,
    clearCheckedItems: clearCheckedMutation.mutateAsync,
    generateShoppingItems: generateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isGenerating: generateMutation.isPending,
  };
}
