/**
 * 앱 진입점 (Entry Point)
 *
 * 앱 실행 시 인증 상태에 따라 적절한 화면으로 리다이렉트합니다.
 * - 로그인 상태: 메인 탭 화면 (/(tabs)/home)
 * - 비로그인 상태: 로그인 화면 (/(auth)/sign-in)
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
