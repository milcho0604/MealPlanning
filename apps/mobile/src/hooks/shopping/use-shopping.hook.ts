/**
 * 쇼핑 목록 조회 훅 (useShopping)
 *
 * React Query를 사용하여 그룹의 쇼핑 목록을 가져옵니다.
 */

import { useQuery } from '@tanstack/react-query';
import { useGroupStore } from '../../stores/group.store';
import { shoppingService } from '../../services/shopping.service';

export function useShopping() {
  const { currentGroupId } = useGroupStore();

  return useQuery({
    queryKey: ['shopping', currentGroupId],
    queryFn: () => shoppingService.getList(currentGroupId!),
    enabled: !!currentGroupId,
  });
}
