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
  // ── 연한 배경 (뱃지, 버튼 등) ─────────────────────────
  primaryLight: '#E8F5E9',
  errorLight: '#FFEBEE',
  warningLight: '#FFF3E0',
  infoLight: '#E3F2FD',
  purpleLight: '#F3E5F5',
  // ── 특수 색상 ─────────────────────────────────────────
  calorie: '#FF6B35',
  sunday: '#EF5350',
  saturday: '#42A5F5',
  selectedDate: '#2E7D32',
  info: '#1976D2',
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
  primaryLight: '#1B3A1D',
  errorLight: '#3E2020',
  warningLight: '#3E3020',
  infoLight: '#1E2A3E',
  purpleLight: '#2E1E3E',
  calorie: '#FF6B35',
  sunday: '#EF5350',
  saturday: '#42A5F5',
  selectedDate: '#2E7D32',
  info: '#1976D2',
} as const;

/** 기본 내보내기 (라이트 테마 - 하위 호환성) */
export const colors = lightColors;

/** 색상 타입 */
export type ColorKey = keyof typeof lightColors;

/** 통일된 border-radius 체계 */
export const radii = {
  /** 칩, 작은 버튼 */
  sm: 8,
  /** 카드, 입력필드, 일반 버튼 */
  md: 12,
  /** 뱃지, 태그 (pill) */
  lg: 20,
  /** 원형 (아바타) */
  full: 50,
} as const;

/** 통일된 spacing 체계 */
export const spacing = {
  /** 요소 내부 작은 간격 */
  xs: 4,
  /** 칩 간격, 아이콘 간격 */
  sm: 8,
  /** 리스트 간격, 카드 내부 */
  md: 12,
  /** 섹션 패딩 */
  lg: 16,
  /** 화면 좌우 패딩 */
  xl: 20,
  /** 섹션 간 간격 */
  xxl: 24,
} as const;
