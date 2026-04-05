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
import { Platform } from 'react-native';
import { initializeKakaoSDK } from '@react-native-kakao/core';
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
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지 (재호출 안 함)
      gcTime: 1000 * 60 * 30,   // 30분간 캐시 유지 (탭 전환 시 즉시 표시)
      refetchOnMount: false,     // 마운트 시 자동 재호출 방지 (캐시 우선)
    },
  },
});

export default function RootLayout() {
  const { initialize, isInitialized, isAuthenticated } = useAuthStore();

  // 앱 시작 시 저장된 토큰으로 인증 상태 복원 + 카카오 SDK 초기화
  useEffect(() => {
    initialize();

    // 카카오 SDK 초기화 (네이티브에서만 실행, 웹은 불필요)
    if (Platform.OS !== 'web') {
      initializeKakaoSDK('e853e6f283f75a8256546445c2add6d1').catch(() => {
        // 카카오 SDK 초기화 실패 시 무시 (로그인 시점에 에러 처리)
      });
    }
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
