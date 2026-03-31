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

export function useIngredients(expiringOnly = false) {
  const { currentGroupId } = useGroupStore();

  return useQuery({
    // queryKey: 그룹 및 expiringOnly 파라미터가 바뀌면 자동으로 새 데이터 요청
    queryKey: ['ingredients', currentGroupId, expiringOnly],
    queryFn: () =>
      ingredientService.getList({ groupId: currentGroupId ?? '', expiringOnly }),
    enabled: !!currentGroupId,
  });
}
