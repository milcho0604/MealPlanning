/**
 * 날짜 관련 공통 유틸리티 (date.ts)
 *
 * 여러 화면에서 공통으로 사용하는 요일 배열과 날짜 포맷 함수를 제공합니다.
 */

/** 요일 레이블 (일요일 시작) */
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** Date → YYYY-MM-DD */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
