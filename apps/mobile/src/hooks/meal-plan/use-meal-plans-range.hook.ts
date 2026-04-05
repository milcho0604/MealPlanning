/**
 * 기간별 식단 조회 훅 (useMealPlansRange)
 *
 * 리스트 뷰에서 전체/1개월/3개월/6개월/직접 설정 기간의
 * 식단을 조회합니다.
 *
 * @param from - 시작 날짜 (YYYY-MM-DD), null이면 1년 전부터
 * @param to   - 종료 날짜 (YYYY-MM-DD), null이면 오늘까지
 */

import { useQuery } from '@tanstack/react-query';
import { useGroupStore } from '../../stores/group.store';
import { mealPlanService } from '../../services/meal-plan.service';

/** 날짜를 YYYY-MM-DD 형식 문자열로 변환 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useMealPlansRange(from: string | null, to: string | null) {
  const { currentGroupId, groups } = useGroupStore();

  const actualFrom = from ?? toDateString(new Date(new Date().setFullYear(new Date().getFullYear() - 2)));
  const actualTo = to ?? toDateString(new Date());

  return useQuery({
    queryKey: ['meal-plans-range', currentGroupId ?? 'all', actualFrom, actualTo],
    queryFn: async () => {
      if (currentGroupId) {
        return mealPlanService.getList({ groupId: currentGroupId, from: actualFrom, to: actualTo });
      }
      // 전체 그룹 병렬 조회 후 합치기
      const results = await Promise.all(
        groups.map((g) => mealPlanService.getList({ groupId: g.id, from: actualFrom, to: actualTo })),
      );
      return results.flat();
    },
    enabled: groups.length > 0,
  });
}
