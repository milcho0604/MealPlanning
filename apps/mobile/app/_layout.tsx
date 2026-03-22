/**
 * 루트 레이아웃 (Root Layout)
 *
 * 앱 전체를 감싸는 최상위 레이아웃입니다.
 * - QueryClientProvider: React Query 서버 상태 관리
 * - 인증 상태에 따라 라우팅 처리
 * - 로그인 후 푸시 알림 토큰 자동 등록
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/stores/auth.store';
import {
  registerForPushNotificationsAsync,
  savePushTokenToServer,
} from '../src/services/notification.service';

// 폰트가 로드될 때까지 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { initialize, isInitialized, isAuthenticated } = useAuthStore();

  // 앱 시작 시 저장된 토큰으로 인증 상태 복원
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 인증 상태 초기화 완료 후 스플래시 화면 숨기기
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  // 로그인 상태가 되면 푸시 알림 토큰 등록
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) savePushTokenToServer(token);
      });
    }
  }, [isAuthenticated]);

  if (!isInitialized) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
