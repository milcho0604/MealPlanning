/**
 * 뷰 모드 스토어 (View Mode Store)
 *
 * 캘린더 화면의 뷰 모드(캘린더/리스트)를 전역으로 관리합니다.
 * 다른 탭으로 이동했다가 돌아와도 선택한 뷰 모드가 유지됩니다.
 */

import { create } from 'zustand';

type ViewMode = 'calendar' | 'list';

interface ViewModeState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  viewMode: 'calendar',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
