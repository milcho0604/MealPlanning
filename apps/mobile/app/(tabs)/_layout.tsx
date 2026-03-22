/**
 * 메인 탭 레이아웃 (Tabs Layout)
 *
 * 로그인 후 보이는 하단 탭 바를 정의합니다.
 * 탭 순서: 홈 → 캘린더 → 냉장고 → 쇼핑 → 설정
 *
 * 동작:
 * - 비로그인 상태이면 로그인 화면으로 리다이렉트
 * - 최초 진입 시 그룹 목록 자동 로드
 */

import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useGroupStore } from '../../src/stores/group.store';
import { colors } from '../../src/constants/colors';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const { loadGroups } = useGroupStore();

  // 로그인 상태가 확인되면 그룹 목록 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated, loadGroups]);

  // 비로그인 상태이면 인증 화면으로 이동
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: '#fff',
        },
        headerShown: false,
      }}
    >
      {/* 홈 - 오늘의 식단 */}
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 캘린더 - 월간 식단 뷰 */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: '캘린더',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 냉장고 - 재료 관리 */}
      <Tabs.Screen
        name="fridge"
        options={{
          title: '냉장고',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 쇼핑 - 쇼핑 리스트 */}
      <Tabs.Screen
        name="shopping"
        options={{
          title: '쇼핑',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 설정 - 프로필, 그룹 관리 */}
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
