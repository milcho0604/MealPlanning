/**
 * 현재 테마에 맞는 색상을 반환하는 훅
 */

import { lightColors, darkColors } from '../constants/colors';
import { useThemeStore } from '../stores/theme.store';

export function useColors() {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkColors : lightColors;
}
