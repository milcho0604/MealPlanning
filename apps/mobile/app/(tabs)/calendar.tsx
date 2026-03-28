/**
 * 캘린더 화면 (Calendar Screen)
 *
 * 월간 캘린더로 날짜별 식단을 시각화합니다.
 * - 상단: 월 이동 헤더 (◀ 2025년 3월 ▶)
 * - 캘린더 그리드: 날짜 셀에 식단 등록 여부 점으로 표시
 * - 하단 패널: 선택된 날짜의 식단 카드 목록
 * - FAB: 선택 날짜에 식단 추가
 */

import { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
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
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useMealPlanMutation } from '../../src/hooks/meal-plan/use-meal-plan-mutation.hook';
import { useGroupStore } from '../../src/stores/group.store';
import type { MealPlanWithUser } from '../../src/services/meal-plan.service';
import { colors } from '../../src/constants/colors';

/** 요일 헤더 레이블 (일요일 시작) */
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 날짜를 YYYY-MM-DD 형식 문자열로 변환 */
function toDateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** 오늘 날짜 문자열 */
const TODAY = new Date().toISOString().split('T')[0];

export default function CalendarScreen() {
  const now = new Date();
  const { currentGroupId } = useGroupStore();

  // ── 현재 보여주는 연/월 상태 ───────────────────────────
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1~12

  // ── 선택된 날짜 (YYYY-MM-DD) ─────────────────────────
  const [selectedDate, setSelectedDate] = useState(TODAY);

  // ── 모달 상태 ──────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlanWithUser | null>(null);

  // ── 데이터 ─────────────────────────────────────────────
  const { data: mealPlans, isLoading } = useMealPlans(year, month);
  const { removeMealPlan } = useMealPlanMutation();

  // 날짜별 식단 맵 생성: { 'YYYY-MM-DD': MealPlanWithUser[] }
  const mealPlansByDate = (mealPlans ?? []).reduce<Record<string, MealPlanWithUser[]>>(
    (acc, mp) => {
      if (!acc[mp.date]) acc[mp.date] = [];
      acc[mp.date].push(mp);
      return acc;
    },
    {},
  );

  // 선택된 날짜의 식단 목록
  const selectedDateMealPlans = mealPlansByDate[selectedDate] ?? [];

  // ── 캘린더 그리드 데이터 생성 ─────────────────────────
  // 해당 월의 1일이 무슨 요일인지 (0=일 ~ 6=토)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  // 해당 월의 마지막 날짜
  const lastDay = new Date(year, month, 0).getDate();

  // 그리드 셀 배열: null은 빈 셀(이전 달 날짜 자리), number는 날짜
  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];
  // 7의 배수로 맞추기
  const remainder = calendarCells.length % 7;
  if (remainder !== 0) {
    calendarCells.push(...Array(7 - remainder).fill(null));
  }

  // ── 월 이동 핸들러 ─────────────────────────────────────
  const goPrevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // ── 모달 핸들러 ────────────────────────────────────────
  const handleEdit = (mealPlan: MealPlanWithUser) => {
    setEditingMealPlan(mealPlan);
    setIsModalVisible(true);
  };
  const handleDelete = async (id: string) => {
    await removeMealPlan(id);
  };
  const handleAddPress = () => {
    setEditingMealPlan(null);
    setIsModalVisible(true);
  };
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingMealPlan(null);
  };

  if (!currentGroupId) return <NoGroupView />;
  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* ── 월 이동 헤더 (sticky) ── */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goPrevMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{year}년 {month}월</Text>
          <TouchableOpacity onPress={goNextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── 요일 헤더 ── */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, idx) => (
            <Text
              key={label}
              style={[
                styles.weekdayLabel,
                idx === 0 && styles.sundayLabel,
                idx === 6 && styles.saturdayLabel,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>

        {/* ── 날짜 그리드 ── */}
        <View style={styles.grid}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.cell} />;
            }

            const dateStr = toDateString(year, month, day);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === TODAY;
            const hasMeals = (mealPlansByDate[dateStr]?.length ?? 0) > 0;
            const dayOfWeek = idx % 7; // 0=일, 6=토

            return (
              <TouchableOpacity
                key={dateStr}
                style={styles.cell}
                onPress={() => setSelectedDate(dateStr)}
              >
                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, isToday && !isSelected && styles.dayCircleToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      isToday && !isSelected && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                      dayOfWeek === 0 && !isSelected && styles.sundayText,
                      dayOfWeek === 6 && !isSelected && styles.saturdayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {/* 식단 등록 여부 점 표시 */}
                {hasMeals && (
                  <View style={[styles.dot, isSelected && styles.dotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 선택된 날짜 식단 목록 ── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>
            {month}월 {parseInt(selectedDate.split('-')[2], 10)}일 식단
          </Text>

          {selectedDateMealPlans.length === 0 ? (
            <Text style={styles.panelEmpty}>등록된 식단이 없습니다.</Text>
          ) : (
            selectedDateMealPlans.map((mp) => (
              <MealPlanCard
                key={mp.id}
                mealPlan={mp}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
          {/* FAB 공간 확보 */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* 추가 FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 식단 추가/수정 모달 */}
      <MealPlanFormModal
        visible={isModalVisible}
        onClose={handleModalClose}
        date={selectedDate}
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
  // ── 월 헤더 ─────────────────────────────────────────────
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  monthArrow: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  // ── 요일 헤더 ────────────────────────────────────────────
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sundayLabel: { color: '#EF5350' },
  saturdayLabel: { color: '#42A5F5' },
  // ── 날짜 그리드 ─────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#2E7D32',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
  },
  dayTextToday: {
    fontWeight: '700',
    color: colors.primary,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  sundayText: { color: '#EF5350' },
  saturdayText: { color: '#42A5F5' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#66BB6A',
    marginTop: 3,
  },
  dotSelected: {
    backgroundColor: '#fff',
  },
  // ── 하단 식단 패널 ────────────────────────────────────────
  panel: {
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  panelEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
