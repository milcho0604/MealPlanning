/**
 * 식단 목록 조회 훅 (useMealPlans)
 *
 * React Query를 사용하여 특정 월의 식단 목록을 가져옵니다.
 * 캘린더 화면과 홈 화면에서 공통으로 사용합니다.
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
  const { currentGroupId } = useGroupStore();

  // 해당 월의 첫째 날과 마지막 날 계산
  const from = toDateString(new Date(year, month - 1, 1));
  const to = toDateString(new Date(year, month, 0)); // month 0일 = 전달 마지막 날

  return useQuery({
    // queryKey: 그룹/연월이 바뀌면 자동으로 새 데이터 요청
    queryKey: ['meal-plans', currentGroupId, year, month],
    queryFn: () =>
      mealPlanService.getList({ groupId: currentGroupId ?? '', from, to }),
    // 그룹이 선택된 경우에만 쿼리 실행
    enabled: !!currentGroupId,
  });
}
