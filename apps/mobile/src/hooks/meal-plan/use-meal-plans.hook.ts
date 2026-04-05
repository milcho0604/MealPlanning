/**
 * 식단 목록 조회 훅 (useMealPlans)
 *
 * React Query를 사용하여 특정 월의 식단 목록을 가져옵니다.
 * currentGroupId가 null이면 전체 그룹의 식단을 병렬 조회 후 합칩니다.
 *
 * @param year  - 조회할 연도
 * @param month - 조회할 월 (1~12)
 */

import { useQuery } from '@tanstack/react-query';
import { useGroupStore } from '../../stores/group.store';
import { mealPlanService } from '../../services/meal-plan.service';

/** 날짜를 YYYY-MM-DD 형식 문자열로 변환 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useMealPlans(year: number, month: number) {
  const { currentGroupId, groups } = useGroupStore();

  const from = toDateString(new Date(year, month - 1, 1));
  const to = toDateString(new Date(year, month, 0));

  return useQuery({
    queryKey: ['meal-plans', currentGroupId ?? 'all', year, month],
    queryFn: async () => {
      if (currentGroupId) {
        // 특정 그룹만 조회
        return mealPlanService.getList({ groupId: currentGroupId, from, to });
      }
      // 전체 그룹 병렬 조회 후 합치기
      const results = await Promise.all(
        groups.map((g) => mealPlanService.getList({ groupId: g.id, from, to })),
      );
      return results.flat();
    },
    enabled: groups.length > 0,
  });
}
