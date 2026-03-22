/**
 * 식단 템플릿 뮤테이션 훅 (useTemplateMutation)
 *
 * 템플릿 저장 / 삭제 후 캐시를 자동 무효화합니다.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../../services/template.service';
import { useGroupStore } from '../../stores/group.store';
import type { CreateMealTemplateRequest } from '@mealplan/shared';

export function useTemplateMutation() {
  const queryClient = useQueryClient();
  const { currentGroupId } = useGroupStore();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['templates', currentGroupId] });
  };

  /** 템플릿 저장 */
  const createMutation = useMutation({
    mutationFn: (body: CreateMealTemplateRequest) => templateService.create(body),
    onSuccess: invalidate,
  });

  /** 템플릿 삭제 */
  const removeMutation = useMutation({
    mutationFn: (id: string) => templateService.remove(id),
    onSuccess: invalidate,
  });

  return {
    saveTemplate: createMutation.mutateAsync,
    removeTemplate: removeMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
}
