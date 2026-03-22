/**
 * 그룹 상태 스토어 (Group Store)
 *
 * 현재 활성화된 그룹 ID를 전역으로 관리합니다.
 * 식단, 냉장고, 쇼핑 등 모든 기능이 그룹 단위로 동작하므로
 * 선택된 그룹을 단일 소스로 관리합니다.
 *
 * Phase 2에서 그룹 생성/초대 기능 구현 시 확장 예정.
 * 현재는 첫 로그인 시 개인 기본 그룹을 자동 생성하여 사용합니다.
 */

import { create } from 'zustand';

interface GroupState {
  /** 현재 선택된 그룹 ID (null이면 그룹 없음) */
  currentGroupId: string | null;
  /** 현재 그룹 설정 */
  setCurrentGroupId: (groupId: string) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  currentGroupId: null,
  setCurrentGroupId: (groupId) => set({ currentGroupId: groupId }),
}));
