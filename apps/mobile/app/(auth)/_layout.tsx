/**
 * 인증 화면 그룹 레이아웃 (Auth Group Layout)
 *
 * 로그인, 회원가입 화면을 묶는 레이아웃입니다.
 * 이미 로그인된 상태라면 메인 탭 화면으로 리다이렉트합니다.
 */

import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // 이미 로그인 상태이면 메인으로 이동
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
