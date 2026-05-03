/**
 * 쇼핑 목록 조회 훅 (useShopping)
 *
 * React Query를 사용하여 그룹의 쇼핑 목록을 가져옵니다.
 * - groupId가 undefined이면 currentGroupId 사용
 * - groupId가 null이면 전체 그룹 모드 (모든 그룹을 병렬 조회 후 합산)
 */

import { useQueries, useQuery } from '@tanstack/react-query';
import type { ShoppingItem } from '@mealplan/shared';
import { useGroupStore } from '../../stores/group.store';
import { shoppingService } from '../../services/shopping.service';

export function useShopping(groupId?: string | null) {
  const { currentGroupId, groups } = useGroupStore();
  // undefined → currentGroupId 사용 / null → 전체 그룹 모드
  const targetGroupId = groupId === undefined ? currentGroupId : groupId;
  const isAllGroups = targetGroupId === null;

  /** 단일 그룹 조회 */
  const singleQuery = useQuery({
    queryKey: ['shopping', targetGroupId],
    queryFn: () => shoppingService.getList(targetGroupId ?? ''),
    enabled: !isAllGroups && !!targetGroupId,
  });

  /** 전체 그룹 조회 — 그룹별 병렬 요청 후 합산 */
  const allGroupQueries = useQueries({
    queries: isAllGroups
      ? groups.map((g) => ({
          queryKey: ['shopping', g.id] as const,
          queryFn: () => shoppingService.getList(g.id),
        }))
      : [],
  });

  if (isAllGroups) {
    return {
      data: allGroupQueries.flatMap((q) => q.data ?? []) as ShoppingItem[],
      isLoading:
        allGroupQueries.length > 0 && allGroupQueries.some((q) => q.isLoading),
      refetch: async () => { await Promise.all(allGroupQueries.map((q) => q.refetch())); },
    };
  }

  return {
    ...singleQuery,
    refetch: async () => { await singleQuery.refetch(); },
  };
}
