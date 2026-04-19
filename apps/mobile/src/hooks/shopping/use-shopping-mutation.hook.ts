/**
 * 쇼핑 목록 뮤테이션 훅 (useShoppingMutation)
 *
 * 쇼핑 항목 생성/수정/삭제/체크 토글/일괄 삭제 처리 후 캐시를 자동 무효화합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingService } from '../../services/shopping.service';
import { useGroupStore } from '../../stores/group.store';

export function useShoppingMutation(groupId?: string | null) {
  const queryClient = useQueryClient();
  const { currentGroupId } = useGroupStore();
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

  /** 체크 토글 */
  const toggleMutation = useMutation({
    mutationFn: (id: string) => shoppingService.toggleCheck(id),
    onSuccess: invalidate,
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
