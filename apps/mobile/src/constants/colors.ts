/**
 * 앱 전체 컬러 팔레트 (Color Palette)
 *
 * 라이트/다크 테마를 지원합니다.
 * useTheme() 훅으로 현재 테마의 색상을 가져옵니다.
 */

/** 라이트 테마 색상 */
export const lightColors = {
  primary: '#4CAF50',
  secondary: '#81C784',
  text: '#1A1A1A',
  textSecondary: '#757575',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
} as const;

/** 다크 테마 색상 */
export const darkColors = {
  primary: '#66BB6A',
  secondary: '#81C784',
  text: '#E0E0E0',
  textSecondary: '#9E9E9E',
  background: '#121212',
  surface: '#1E1E1E',
  border: '#333333',
  error: '#EF5350',
  warning: '#FFA726',
  success: '#66BB6A',
} as const;

/** 기본 내보내기 (라이트 테마 - 하위 호환성) */
export const colors = lightColors;

/** 색상 타입 */
export type ColorKey = keyof typeof lightColors;
