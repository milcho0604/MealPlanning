/**
 * 재료 목록 조회 훅 (useIngredients)
 *
 * React Query를 사용하여 그룹의 재료 목록을 가져옵니다.
 * 냉장고 화면에서 사용하며, 선택적으로 유통기한 임박 재료만 조회합니다.
 *
 * @param expiringOnly - true이면 유통기한 임박(3일 이내) 재료만 조회
 */

import { useQuery } from '@tanstack/react-query';
import { useGroupStore } from '../../stores/group.store';
import { ingredientService } from '../../services/ingredient.service';

export function useIngredients(expiringOnly = false, groupId?: string | null) {
  const { currentGroupId } = useGroupStore();
  const targetGroupId = groupId ?? currentGroupId;

  return useQuery({
    queryKey: ['ingredients', targetGroupId, expiringOnly],
    queryFn: () =>
      ingredientService.getList({ groupId: targetGroupId ?? '', expiringOnly }),
    enabled: !!targetGroupId,
  });
}
