/**
 * 루트 레이아웃 (Root Layout)
 *
 * 앱 전체를 감싸는 최상위 레이아웃입니다.
 * - QueryClientProvider: React Query 서버 상태 관리
 * - AuthProvider: 인증 상태에 따라 라우팅 처리
 * - 폰트 로딩, 스플래시 화면 처리
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/stores/auth.store';

// 폰트가 로드될 때까지 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 네트워크 재연결 시 자동 refetch
      refetchOnWindowFocus: false,
      // 실패 시 3번까지 재시도
      retry: 3,
      // 5분 동안 캐시 유지
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();

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

  // 초기화 중에는 아무것도 렌더링하지 않음 (스플래시 화면이 표시됨)
  if (!isInitialized) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 인증 화면 그룹 (로그인, 회원가입) */}
        <Stack.Screen name="(auth)" />
        {/* 메인 탭 화면 그룹 */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
