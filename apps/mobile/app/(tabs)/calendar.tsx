/**
 * 캘린더 화면 (Calendar Screen)
 *
 * 월간 캘린더로 날짜별 식단을 시각화합니다.
 * - 상단: 월 이동 헤더 (◀ 2025년 3월 ▶)
 * - 캘린더 그리드: 날짜 셀에 식단 등록 여부 점으로 표시
 * - 하단 패널: 선택된 날짜의 식단 카드 목록
 * - FAB: 선택 날짜에 식단 추가
 */

import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans } from '../../src/hooks/meal-plan/use-meal-plans.hook';
import { MealPlanCard } from '../../src/components/meal-plan/MealPlanCard';
import { SwipeToDelete } from '../../src/components/common/SwipeToDelete';
import { MealPlanListView } from '../../src/components/meal-plan/MealPlanListView';
import { MealPlanFormModal } from '../../src/components/meal-plan/MealPlanFormModal';
import { SkeletonLoader } from '../../src/components/common/SkeletonLoader';
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useMealPlanMutation } from '../../src/hooks/meal-plan/use-meal-plan-mutation.hook';
import { useGroupStore } from '../../src/stores/group.store';
import { useViewModeStore } from '../../src/stores/view-mode.store';
import type { MealPlanWithUser } from '../../src/services/meal-plan.service';
import { colors } from '../../src/constants/colors';
import type { MyGroup } from '../../src/services/group.service';

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
  const { groups, currentGroupId, setCurrentGroupId } = useGroupStore();
  const { viewMode, setViewMode } = useViewModeStore();
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  /** 현재 선택된 그룹의 색상 */
  const currentGroup = groups.find((g) => g.id === currentGroupId);

  // ── 현재 보여주는 연/월 상태 ───────────────────────────
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1~12

  // ── 선택된 날짜 (YYYY-MM-DD) ─────────────────────────
  const [selectedDate, setSelectedDate] = useState(TODAY);

  // ── 모달 상태 ──────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlanWithUser | null>(null);
  const [copyingMealPlan, setCopyingMealPlan] = useState<MealPlanWithUser | null>(null);

  // ── 데이터 ─────────────────────────────────────────────
  const { data: mealPlans, isLoading, refetch } = useMealPlans(year, month);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const { removeMealPlan } = useMealPlanMutation();

  // 날짜별 식단 맵 생성: { 'YYYY-MM-DD': MealPlanWithUser[] }
  const mealPlansByDate = useMemo(() => (mealPlans ?? []).reduce<Record<string, MealPlanWithUser[]>>(
    (acc, mp) => {
      if (!acc[mp.date]) acc[mp.date] = [];
      acc[mp.date].push(mp);
      return acc;
    },
    {},
  ), [mealPlans]);

  // 선택된 날짜의 식단 목록
  const selectedDateMealPlans = mealPlansByDate[selectedDate] ?? [];

  // ── 캘린더 그리드 데이터 생성 (메모이제이션) ──────────────
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const lastDay = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDayOfWeek).fill(null),
      ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ];
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      cells.push(...Array(7 - remainder).fill(null));
    }
    return cells;
  }, [year, month]);

  // ── 스와이프로 월 이동 ──────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -80) goNextMonth();
        else if (gestureState.dx > 80) goPrevMonth();
      },
    }),
  ).current;

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
  const handleCopy = (mealPlan: MealPlanWithUser) => {
    setCopyingMealPlan(mealPlan);
    setEditingMealPlan(null);
    setIsModalVisible(true);
  };
  const handleAddPress = () => {
    setEditingMealPlan(null);
    setCopyingMealPlan(null);
    setIsModalVisible(true);
  };
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingMealPlan(null);
    setCopyingMealPlan(null);
  };

  if (groups.length === 0) return <NoGroupView />;
  if (isLoading) return <SkeletonLoader rows={5} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── 뷰 전환 탭 ── */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'calendar' && styles.viewToggleBtnActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.viewToggleText, viewMode === 'calendar' && styles.viewToggleTextActive]}>캘린더</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>리스트</Text>
        </TouchableOpacity>
      </View>

      {/* ── 그룹 드롭다운 선택 ── */}
      {groups.length >= 1 && (
        <View style={styles.groupDropdownWrapper}>
          <TouchableOpacity
            style={styles.groupDropdownBtn}
            onPress={() => setShowGroupDropdown(!showGroupDropdown)}
          >
            {currentGroup ? (
              <View style={[styles.groupDropdownDot, { backgroundColor: currentGroup.color ?? colors.primary }]} />
            ) : (
              <Ionicons name="apps" size={14} color={colors.text} />
            )}
            <Text style={styles.groupDropdownBtnText} numberOfLines={1}>
              {currentGroup?.name ?? '전체 그룹'}
            </Text>
            <Ionicons name={showGroupDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {showGroupDropdown && (
            <View style={styles.groupDropdownList}>
              <TouchableOpacity
                style={[styles.groupDropdownItem, !currentGroupId && styles.groupDropdownItemActive]}
                onPress={() => { setCurrentGroupId(null); setShowGroupDropdown(false); }}
              >
                <Ionicons name="apps" size={14} color={!currentGroupId ? colors.primary : colors.textSecondary} />
                <Text style={[styles.groupDropdownItemText, !currentGroupId && { color: colors.primary, fontWeight: '700' }]}>전체 그룹</Text>
              </TouchableOpacity>
              {groups.map((g) => {
                const isSelected = g.id === currentGroupId;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupDropdownItem, isSelected && styles.groupDropdownItemActive]}
                    onPress={() => { setCurrentGroupId(g.id); setShowGroupDropdown(false); }}
                  >
                    <View style={[styles.groupDropdownDot, { backgroundColor: g.color ?? colors.primary }]} />
                    <Text style={[styles.groupDropdownItemText, isSelected && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                      {g.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ── 리스트 뷰 ── */}
      {viewMode === 'list' ? (
        <MealPlanListView
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopy={handleCopy}
        />
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
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

        {/* ── 날짜 그리드 (스와이프 가능) ── */}
        <View style={styles.grid} {...panResponder.panHandlers}>
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
                  <View style={[styles.dot, { backgroundColor: currentGroup?.color ?? groups[0]?.color ?? '#66BB6A' }, isSelected && styles.dotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 선택된 날짜 식단 목록 ── */}
        <View style={styles.panel}>
          <View style={styles.panelTitleRow}>
            <Text style={styles.panelTitle}>
              {month}월 {parseInt(selectedDate.split('-')[2], 10)}일 식단
            </Text>
            {(() => {
              const total = selectedDateMealPlans.reduce((s, mp) => s + (mp.calories ?? 0), 0);
              return total > 0 ? <Text style={styles.panelCalorie}>{total}kcal</Text> : null;
            })()}
          </View>

          {selectedDateMealPlans.length === 0 ? (
            <Text style={styles.panelEmpty}>등록된 식단이 없습니다.</Text>
          ) : (
            selectedDateMealPlans.map((mp) => (
              <SwipeToDelete key={mp.id} confirmMessage={`"${mp.menuName}"을(를) 삭제할까요?`} onDelete={() => handleDelete(mp.id)}>
                <MealPlanCard
                  mealPlan={mp}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopy={handleCopy}
                />
              </SwipeToDelete>
            ))
          )}
          {/* FAB 공간 확보 */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
      )}

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
        copyFrom={copyingMealPlan ?? undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── 뷰 전환 탭 ──────────────────────────────────────────
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewToggleTextActive: {
    color: '#fff',
  },
  // ── 그룹 드롭다운 ───────────────────────────────────────
  groupDropdownWrapper: {
    marginHorizontal: 16,
    marginBottom: 4,
    zIndex: 10,
  },
  groupDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupDropdownBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  groupDropdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupDropdownList: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  groupDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  groupDropdownItemActive: {
    backgroundColor: colors.primaryLight,
  },
  groupDropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  // ── 월 헤더 ─────────────────────────────────────────────
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    marginHorizontal: 16,
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
  sundayLabel: { color: colors.sunday },
  saturdayLabel: { color: colors.saturday },
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
    paddingVertical: 6,
    minHeight: 48,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.selectedDate,
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
  sundayText: { color: colors.sunday },
  saturdayText: { color: colors.saturday },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#66BB6A',
    marginTop: 3,
  },
  dotSelected: {
    backgroundColor: colors.surface,
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
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  panelCalorie: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.calorie,
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
