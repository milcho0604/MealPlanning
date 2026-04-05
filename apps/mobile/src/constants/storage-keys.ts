/**
 * SecureStore 키 상수 (Storage Keys)
 *
 * expo-secure-store에 저장/조회할 때 사용하는 키를 중앙 관리합니다.
 * 오타 방지 및 일관성 유지를 위해 상수로 정의합니다.
 */

export const STORAGE_KEYS = {
  /** JWT 액세스 토큰 */
  ACCESS_TOKEN: 'mealplan_access_token',
  /** JWT 리프레시 토큰 */
  REFRESH_TOKEN: 'mealplan_refresh_token',
  /** 로그인 사용자 정보 (JSON 문자열) */
  USER: 'mealplan_user',
  /** 테마 모드 (light/dark/system) */
  THEME_MODE: 'mealplan_theme_mode',
  /** 알림 활성화 여부 (true/false) */
  NOTIFICATIONS_ENABLED: 'mealplan_notifications_enabled',
} as const;
