/**
 * 테마 스토어 (Theme Store)
 *
 * 다크 모드 설정을 관리합니다.
 * - 'light' | 'dark' | 'system' 모드 지원
 * - SecureStore에 설정 저장
 * - 앱 시작 시 저장된 테마 복원
 */

import { create } from 'zustand';
import { Appearance } from 'react-native';
import { storage } from '../utils/storage';

const THEME_KEY = 'theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** 사용자 설정 모드 */
  mode: ThemeMode;
  /** 실제 적용되는 테마 (system 모드일 때 시스템 설정 반영) */
  isDark: boolean;
  /** 최초 팝업 표시 여부 */
  hasAskedTheme: boolean;

  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  markAsked: () => Promise<void>;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') return Appearance.getColorScheme() === 'dark';
  return mode === 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,
  hasAskedTheme: false,

  initialize: async () => {
    const saved = await storage.getItem(THEME_KEY);
    const asked = await storage.getItem('theme_asked');
    const mode = (saved as ThemeMode) || 'light';
    set({ mode, isDark: resolveIsDark(mode), hasAskedTheme: asked === 'true' });
  },

  setMode: async (mode) => {
    await storage.setItem(THEME_KEY, mode);
    set({ mode, isDark: resolveIsDark(mode) });
  },

  markAsked: async () => {
    await storage.setItem('theme_asked', 'true');
    set({ hasAskedTheme: true });
  },
}));
