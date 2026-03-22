/**
 * 재료 생성/수정/삭제/소진 뮤테이션 훅 (useIngredientMutation)
 *
 * React Query의 useMutation을 사용하여 재료 데이터를 변경합니다.
 * 성공 시 재료 목록 캐시를 자동으로 무효화하여 화면을 갱신합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateIngredientRequest, UpdateIngredientRequest } from '@mealplan/shared';
import { ingredientService } from '../../services/ingredient.service';
import { useGroupStore } from '../../stores/group.store';

export function useIngredientMutation() {
  const queryClient = useQueryClient();
  const { currentGroupId } = useGroupStore();

  /** 캐시 무효화 - 재료 데이터가 변경될 때마다 호출 */
  const invalidateIngredients = () => {
    queryClient.invalidateQueries({ queryKey: ['ingredients', currentGroupId] });
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

  /** 재료 소진 처리 */
  const consumeMutation = useMutation({
    mutationFn: (id: string) => ingredientService.consume(id),
    onSuccess: invalidateIngredients,
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
