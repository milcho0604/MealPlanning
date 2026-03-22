/**
 * 홈 화면 (Home Screen)
 *
 * 오늘의 식단(아침/점심/저녁/간식)을 카드 목록으로 보여줍니다.
 * - 날짜 헤더: 오늘 날짜 표시
 * - 식단 목록: 오늘 날짜에 등록된 식단 카드
 * - 추가 버튼: 우하단 FAB(Floating Action Button)으로 식단 추가
 */

import { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans } from '../../src/hooks/meal-plan/use-meal-plans.hook';
import { MealPlanCard } from '../../src/components/meal-plan/MealPlanCard';
import { MealPlanFormModal } from '../../src/components/meal-plan/MealPlanFormModal';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useMealPlanMutation } from '../../src/hooks/meal-plan/use-meal-plan-mutation.hook';
import { useGroupStore } from '../../src/stores/group.store';
import type { MealPlanWithUser } from '../../src/services/meal-plan.service';
import { colors } from '../../src/constants/colors';

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/** 날짜 문자열을 "2월 15일 (토)" 형식으로 포맷 */
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export default function HomeScreen() {
  const today = getTodayString();
  const now = new Date();
  const { currentGroupId } = useGroupStore();

  // 그룹이 없으면 안내 화면 표시
  if (!currentGroupId) return <NoGroupView />;

  // 오늘 날짜 기준으로 해당 월의 식단을 모두 가져온 후 오늘 것만 필터링
  const { data: allMealPlans, isLoading } = useMealPlans(
    now.getFullYear(),
    now.getMonth() + 1,
  );
  const { removeMealPlan } = useMealPlanMutation();

  // ── 모달 상태 ──────────────────────────────────────────
  /** 추가/수정 모달 표시 여부 */
  const [isModalVisible, setIsModalVisible] = useState(false);
  /** 수정 중인 식단 (null이면 추가 모드) */
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlanWithUser | null>(null);

  // 오늘 날짜의 식단만 필터링
  const todayMealPlans = (allMealPlans ?? []).filter((mp) => mp.date === today);

  /** 수정 버튼 핸들러 */
  const handleEdit = (mealPlan: MealPlanWithUser) => {
    setEditingMealPlan(mealPlan);
    setIsModalVisible(true);
  };

  /** 삭제 버튼 핸들러 */
  const handleDelete = async (id: string) => {
    await removeMealPlan(id);
  };

  /** 추가 FAB 핸들러 */
  const handleAddPress = () => {
    setEditingMealPlan(null);
    setIsModalVisible(true);
  };

  /** 모달 닫기 */
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingMealPlan(null);
  };

  // ── 렌더링 ────────────────────────────────────────────
  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 날짜 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>오늘의 식단</Text>
        <Text style={styles.headerDate}>{formatDateHeader(today)}</Text>
      </View>

      {/* 식단 목록 */}
      <FlatList
        data={todayMealPlans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MealPlanCard
            mealPlan={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            message={'오늘 등록된 식단이 없습니다.\n+ 버튼을 눌러 식단을 추가해보세요!'}
          />
        }
      />

      {/* 추가 FAB (Floating Action Button) */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 식단 추가/수정 모달 */}
      <MealPlanFormModal
        visible={isModalVisible}
        onClose={handleModalClose}
        date={today}
        mealPlan={editingMealPlan ?? undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── 헤더 ────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // ── 리스트 ───────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // FAB에 가리지 않게 여유 공간
    flexGrow: 1,        // EmptyState가 세로 중앙에 오도록
  },
  // ── FAB ─────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    /** 그림자 (iOS) */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    /** 그림자 (Android) */
    elevation: 6,
  },
});
