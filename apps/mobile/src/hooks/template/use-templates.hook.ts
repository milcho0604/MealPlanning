/**
 * 식단 템플릿 조회 훅 (useTemplates)
 *
 * 현재 그룹의 템플릿 목록을 조회합니다.
 */

import { useQuery } from '@tanstack/react-query';
import { templateService } from '../../services/template.service';
import { useGroupStore } from '../../stores/group.store';

export function useTemplates() {
  const { currentGroupId } = useGroupStore();

  return useQuery({
    queryKey: ['templates', currentGroupId],
    queryFn: () => templateService.getList(currentGroupId ?? ''),
    enabled: !!currentGroupId,
  });
}
