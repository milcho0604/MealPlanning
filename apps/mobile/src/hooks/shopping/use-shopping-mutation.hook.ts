/**
 * 쇼핑 목록 뮤테이션 훅 (useShoppingMutation)
 *
 * 쇼핑 항목 생성/수정/삭제/체크 토글/일괄 삭제 처리 후 캐시를 자동 무효화합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingService } from '../../services/shopping.service';
import { useGroupStore } from '../../stores/group.store';

export function useShoppingMutation() {
  const queryClient = useQueryClient();
  const { currentGroupId } = useGroupStore();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shopping', currentGroupId] });
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

  return {
    createShoppingItem: createMutation.mutateAsync,
    updateShoppingItem: updateMutation.mutateAsync,
    toggleShoppingItem: toggleMutation.mutateAsync,
    removeShoppingItem: removeMutation.mutateAsync,
    clearCheckedItems: clearCheckedMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
