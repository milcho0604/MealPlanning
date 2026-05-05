/**
 * 재료 생성/수정/삭제/소진 뮤테이션 훅 (useIngredientMutation)
 *
 * React Query의 useMutation을 사용하여 재료 데이터를 변경합니다.
 * 성공 시 재료 목록 캐시를 자동으로 무효화하여 화면을 갱신합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateIngredientRequest, Ingredient, UpdateIngredientRequest } from '@mealplan/shared';
import { ingredientService } from '../../services/ingredient.service';
import { useGroupStore } from '../../stores/group.store';

export function useIngredientMutation(groupId?: string | null) {
  const queryClient = useQueryClient();
  const { currentGroupId, groups } = useGroupStore();
  // undefined → currentGroupId 사용 / null → 전체 그룹 모드
  const targetGroupId = groupId === undefined ? currentGroupId : groupId;

  /** 캐시 무효화 - 전체 그룹 모드이면 모든 재료 캐시 무효화 */
  const invalidateIngredients = () => {
    if (targetGroupId) {
      queryClient.invalidateQueries({ queryKey: ['ingredients', targetGroupId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    }
  };

  /** 재료 추가 */
  const createMutation = useMutation({
    mutationFn: (body: CreateIngredientRequest) => ingredientService.create(body),
    onSuccess: invalidateIngredients,
  });

  /** 재료 수정 */
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateIngredientRequest }) =>
      ingredientService.update(id, body),
    onSuccess: invalidateIngredients,
  });

  /** 재료 삭제 */
  const removeMutation = useMutation({
    mutationFn: (id: string) => ingredientService.remove(id),
    onSuccess: invalidateIngredients,
  });

  /** 재료 소진 처리 — Optimistic Update로 즉시 UI 반영 */
  const consumeMutation = useMutation({
    mutationFn: (id: string) => ingredientService.consume(id),
    onMutate: async (id: string) => {
      if (targetGroupId) {
        const qk = ['ingredients', targetGroupId] as const;
        await queryClient.cancelQueries({ queryKey: qk });
        const previous = queryClient.getQueryData<Ingredient[]>(qk);
        queryClient.setQueryData<Ingredient[]>(qk, (old) =>
          (old ?? []).map((item) => item.id === id ? { ...item, isConsumed: true } : item),
        );
        return { qk, previous };
      }
      for (const g of groups) {
        const qk = ['ingredients', g.id] as const;
        const cached = queryClient.getQueryData<Ingredient[]>(qk);
        if (cached?.some((i) => i.id === id)) {
          await queryClient.cancelQueries({ queryKey: qk });
          queryClient.setQueryData<Ingredient[]>(qk, (old) =>
            (old ?? []).map((item) => item.id === id ? { ...item, isConsumed: true } : item),
          );
          return { qk, previous: cached };
        }
      }
    },
    onError: (_err, _id, context) => {
      if (context?.qk && context?.previous) {
        queryClient.setQueryData(context.qk, context.previous);
      }
    },
    onSettled: invalidateIngredients,
  });

  return {
    createIngredient: createMutation.mutateAsync,
    updateIngredient: updateMutation.mutateAsync,
    removeIngredient: removeMutation.mutateAsync,
    consumeIngredient: consumeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
    isConsuming: consumeMutation.isPending,
  };
}
