/**
 * 식단 생성/수정/삭제 뮤테이션 훅 (useMealPlanMutation)
 *
 * React Query의 useMutation을 사용하여 식단 데이터를 변경합니다.
 * 성공 시 관련 쿼리 캐시를 자동으로 무효화하여 화면을 갱신합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateMealPlanRequest, UpdateMealPlanRequest } from '@mealplan/shared';
import { mealPlanService } from '../../services/meal-plan.service';

export function useMealPlanMutation() {
  const queryClient = useQueryClient();

  /** 캐시 무효화 - 식단 데이터가 변경될 때마다 호출 */
  const invalidateMealPlans = () => {
    queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    queryClient.invalidateQueries({ queryKey: ['meal-plans-range'] });
  };

  /** 식단 생성 */
  const createMutation = useMutation({
    mutationFn: (body: CreateMealPlanRequest) => mealPlanService.create(body),
    onSuccess: invalidateMealPlans,
  });

  /** 식단 수정 */
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMealPlanRequest }) =>
      mealPlanService.update(id, body),
    onSuccess: invalidateMealPlans,
  });

  /** 식단 삭제 */
  const removeMutation = useMutation({
    mutationFn: (id: string) => mealPlanService.remove(id),
    onSuccess: invalidateMealPlans,
  });

  return {
    createMealPlan: createMutation.mutateAsync,
    updateMealPlan: updateMutation.mutateAsync,
    removeMealPlan: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
