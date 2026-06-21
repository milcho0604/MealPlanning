/**
 * 식단 리스트 뷰 컴포넌트 (MealPlanListView)
 *
 * 전체 식단을 날짜순으로 일자 나열하여 보여줍니다.
 * - 검색: 메뉴명, 메모로 필터링
 * - 기간 필터: 전체 / 1개월 / 3개월 / 6개월 / 직접 입력
 * - 가상 스크롤(FlatList)로 대량 데이터 대응
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { useMealPlansRange } from '../../hooks/meal-plan/use-meal-plans-range.hook';
import { useGroupStore } from '../../stores/group.store';
import { groupService } from '../../services/group.service';
import { MealPlanCard } from './MealPlanCard';
import { SwipeToDelete } from '../common/SwipeToDelete';
import { colors } from '../../constants/colors';
import { WEEKDAYS, toDateString } from '../../utils/date';

/** 기간 필터 옵션 */
type PeriodFilter = 'thisMonth' | '1m' | '3m' | '6m' | 'all' | 'custom';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'thisMonth', label: '이번 달' },
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '6m', label: '6개월' },
  { value: 'all', label: '전체' },
  { value: 'custom', label: '직접 설정' },
];

/** 날짜를 "M월 D일 (요일)" 형식으로 포맷 */
function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${WEEKDAYS[d.getDay()]})`;
}

/** 기간 필터에 따른 시작 날짜 계산 */
function getStartDate(period: PeriodFilter): string | null {
  if (period === 'all') return null;
  const d = new Date();
  if (period === 'thisMonth') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (period === '1m') d.setMonth(d.getMonth() - 1);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  else if (period === '6m') d.setMonth(d.getMonth() - 6);
  return toDateString(d);
}

interface MealPlanListViewProps {
  onEdit: (mealPlan: MealPlanWithUser) => void;
  onDelete: (id: string) => void;
  onCopy?: (mealPlan: MealPlanWithUser) => void;
}

/** 날짜 섹션 헤더 + 식단 카드를 하나의 리스트로 표현하기 위한 타입 */
type ListItem =
  | { type: 'header'; date: string; count: number }
  | { type: 'meal'; data: MealPlanWithUser };

export function MealPlanListView({
  onEdit,
  onDelete,
  onCopy,
}: MealPlanListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('thisMonth');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [members, setMembers] = useState<{ userId: string; name: string }[]>([]);
  const { currentGroupId } = useGroupStore();

  // 그룹 멤버 목록 로드
  useEffect(() => {
    if (!currentGroupId) return;
    let cancelled = false;
    groupService.getMembers(currentGroupId).then((m) => {
      if (cancelled) return;
      setMembers(m.map((mem) => ({ userId: mem.user.id, name: mem.user.name ?? '알 수 없음' })));
    }).catch(() => {
      if (!cancelled) setMembers([]);
    });
    return () => { cancelled = true; };
  }, [currentGroupId]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  /** 기간 필터에 따른 API 조회 범위 계산 */
  const queryFrom = period === 'custom' ? (customFrom || null) : getStartDate(period);
  const queryTo = period === 'custom' ? (customTo || null)
    : period === 'thisMonth' ? toDateString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
    : null;

  const { data: mealPlans = [], isLoading, refetch } = useMealPlansRange(queryFrom, queryTo);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempFrom, setTempFrom] = useState('');
  const [tempTo, setTempTo] = useState('');
  /** 캘린더 선택 대상: 'from' 또는 'to' */
  const [calendarTarget, setCalendarTarget] = useState<'from' | 'to' | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);

  /** 검색어 + 사용자 필터링된 식단 목록 (기간은 API에서 처리) */
  const filteredMealPlans = useMemo(() => {
    let filtered = [...mealPlans];

    // 사용자 필터
    if (selectedUserId) {
      filtered = filtered.filter((mp) => mp.createdBy === selectedUserId);
    }

    // 검색 필터 (메뉴명, 메모)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (mp) =>
          mp.menuName.toLowerCase().includes(q) ||
          (mp.memo ?? '').toLowerCase().includes(q),
      );
    }

    // 날짜 내림차순 정렬 (최신순)
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    return filtered;
  }, [mealPlans, searchQuery, selectedUserId]);

  /** FlatList에 넘길 데이터: 날짜 헤더 + 식단 카드 */
  const listItems = useMemo(() => {
    const items: ListItem[] = [];
    let currentDate = '';

    for (const mp of filteredMealPlans) {
      if (mp.date !== currentDate) {
        currentDate = mp.date;
        const count = filteredMealPlans.filter((m) => m.date === mp.date).length;
        items.push({ type: 'header', date: mp.date, count });
      }
      items.push({ type: 'meal', data: mp });
    }

    return items;
  }, [filteredMealPlans]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        const today = toDateString(new Date());
        const isToday = item.date === today;
        return (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDateLabel(item.date)}
              {isToday && <Text style={styles.todayBadge}> 오늘</Text>}
            </Text>
            <Text style={styles.dateHeaderCount}>{item.count}건</Text>
          </View>
        );
      }
      return (
        <SwipeToDelete confirmMessage={`"${item.data.menuName}"을(를) 삭제할까요?`} onDelete={() => onDelete(item.data.id)}>
          <MealPlanCard
            mealPlan={item.data}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopy={onCopy}
          />
        </SwipeToDelete>
      );
    },
    [onEdit, onDelete],
  );

  const keyExtractor = useCallback(
    (item: ListItem, index: number) =>
      item.type === 'header' ? `header-${item.date}` : `meal-${item.data.id}`,
    [],
  );

  /** 기간 필터 버튼 클릭 */
  const handlePeriodSelect = (value: PeriodFilter) => {
    if (value === 'custom') {
      setTempFrom(customFrom);
      setTempTo(customTo);
      setShowCustomModal(true);
    } else {
      setPeriod(value);
      setCustomFrom('');
      setCustomTo('');
    }
  };

  /** 직접 설정 모달 확인 */
  const handleCustomConfirm = () => {
    setPeriod('custom');
    setCustomFrom(tempFrom);
    setCustomTo(tempTo);
    setShowCustomModal(false);
  };

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="메뉴명, 메모로 검색..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 기간 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodRow}
        contentContainerStyle={styles.periodRowContent}
      >
        {PERIOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.periodBtn,
              period === opt.value && styles.periodBtnActive,
            ]}
            onPress={() => handlePeriodSelect(opt.value)}
          >
            <Text
              style={[
                styles.periodBtnText,
                period === opt.value && styles.periodBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 사용자(등록자) 필터 */}
      {members.length > 1 && (
        <View style={styles.periodRow}>
          <TouchableOpacity
            style={[styles.periodBtn, !selectedUserId && styles.periodBtnActive]}
            onPress={() => setSelectedUserId(null)}
          >
            <Text style={[styles.periodBtnText, !selectedUserId && styles.periodBtnTextActive]}>전체</Text>
          </TouchableOpacity>
          {members.map((m) => (
            <TouchableOpacity
              key={m.userId}
              style={[styles.periodBtn, selectedUserId === m.userId && styles.periodBtnActive]}
              onPress={() => setSelectedUserId(selectedUserId === m.userId ? null : m.userId)}
            >
              <Text style={[styles.periodBtnText, selectedUserId === m.userId && styles.periodBtnTextActive]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 직접 설정 기간 표시 */}
      {period === 'custom' && (customFrom || customTo) && (
        <View style={styles.customPeriodBadge}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.customPeriodText}>
            {customFrom || '시작일 없음'} ~ {customTo || '종료일 없음'}
          </Text>
          <TouchableOpacity onPress={() => { setPeriod('all'); setCustomFrom(''); setCustomTo(''); }}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 결과 건수 + 칼로리 요약 */}
      {(() => {
        const totalCal = filteredMealPlans.reduce((s, mp) => s + (mp.calories ?? 0), 0);
        const daysWithMeals = new Set(filteredMealPlans.map((mp) => mp.date)).size;
        const avgCal = daysWithMeals > 0 ? Math.round(totalCal / daysWithMeals) : 0;
        return (
          <View style={styles.summaryRow}>
            <Text style={styles.resultCount}>{filteredMealPlans.length}건의 식단</Text>
            {totalCal > 0 && (
              <Text style={styles.calorieSummary}>
                총 {totalCal.toLocaleString()}kcal · 일 평균 {avgCal.toLocaleString()}kcal
              </Text>
            )}
          </View>
        );
      })()}

      {/* 식단 리스트 (가상 스크롤) */}
      <FlatList
        data={listItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={7}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>식단을 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 식단이 없습니다.'}
              </Text>
            </View>
          )
        }
      />

      {/* 직접 설정 모달 */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowCustomModal(false); setCalendarTarget(null); }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>기간 직접 설정</Text>

            {/* 캘린더 선택기가 열린 상태 */}
            {calendarTarget ? (
              <View>
                <Text style={styles.dialogLabel}>
                  {calendarTarget === 'from' ? '시작일 선택' : '종료일 선택'}
                </Text>
                {/* 미니 캘린더 헤더 */}
                <View style={styles.miniCalHeader}>
                  <TouchableOpacity onPress={() => {
                    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
                    else setCalMonth(m => m - 1);
                  }}>
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.miniCalTitle}>{calYear}년 {calMonth}월</Text>
                  <TouchableOpacity onPress={() => {
                    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
                    else setCalMonth(m => m + 1);
                  }}>
                    <Ionicons name="chevron-forward" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                {/* 요일 헤더 */}
                <View style={styles.miniCalWeekRow}>
                  {['일','월','화','수','목','금','토'].map(d => (
                    <Text key={d} style={styles.miniCalWeekLabel}>{d}</Text>
                  ))}
                </View>
                {/* 날짜 그리드 */}
                <View style={styles.miniCalGrid}>
                  {(() => {
                    const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
                    const lastDay = new Date(calYear, calMonth, 0).getDate();
                    const cells: (number | null)[] = [
                      ...Array(firstDay).fill(null),
                      ...Array.from({ length: lastDay }, (_, i) => i + 1),
                    ];
                    const rem = cells.length % 7;
                    if (rem !== 0) cells.push(...Array(7 - rem).fill(null));
                    return cells.map((day, idx) => {
                      if (day === null) return <View key={`e-${idx}`} style={styles.miniCalCell} />;
                      const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const isSelected = (calendarTarget === 'from' ? tempFrom : tempTo) === dateStr;
                      return (
                        <TouchableOpacity
                          key={dateStr}
                          style={[styles.miniCalCell, isSelected && styles.miniCalCellSelected]}
                          onPress={() => {
                            if (calendarTarget === 'from') setTempFrom(dateStr);
                            else setTempTo(dateStr);
                            setCalendarTarget(null);
                          }}
                        >
                          <Text style={[styles.miniCalDayText, isSelected && styles.miniCalDayTextSelected]}>{day}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
                <TouchableOpacity style={styles.miniCalBackBtn} onPress={() => setCalendarTarget(null)}>
                  <Text style={styles.miniCalBackText}>돌아가기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* 시작일 */}
                <Text style={styles.dialogLabel}>시작일</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.dialogInput, { flex: 1, marginBottom: 0 }]}
                    value={tempFrom}
                    onChangeText={setTempFrom}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={10}
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                  <TouchableOpacity
                    style={styles.calendarPickBtn}
                    onPress={() => { setCalendarTarget('from'); setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth() + 1); }}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* 종료일 */}
                <Text style={[styles.dialogLabel, { marginTop: 12 }]}>종료일</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.dialogInput, { flex: 1, marginBottom: 0 }]}
                    value={tempTo}
                    onChangeText={setTempTo}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={10}
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                  <TouchableOpacity
                    style={styles.calendarPickBtn}
                    onPress={() => { setCalendarTarget('to'); setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth() + 1); }}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.dialogButtons, { marginTop: 16 }]}>
                  <TouchableOpacity
                    style={styles.dialogCancelBtn}
                    onPress={() => setShowCustomModal(false)}
                  >
                    <Text style={styles.dialogCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dialogConfirmBtn}
                    onPress={handleCustomConfirm}
                  >
                    <Text style={styles.dialogConfirmText}>적용</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // ── 검색바 ─────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  // ── 기간 필터 ──────────────────────────────────────────
  periodRow: {
    marginBottom: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  periodRowContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  customPeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  customPeriodText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  // ── 결과 요약 ──────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calorieSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.calorie,
  },
  // ── 리스트 ─────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  // ── 날짜 헤더 ──────────────────────────────────────────
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  dateHeaderCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // ── 빈 상태 ───────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // ── 직접 설정 모달 ─────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  dialogLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dialogInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  calendarPickBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── 미니 캘린더 ────────────────────────────────────────
  miniCalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  miniCalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  miniCalWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  miniCalWeekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  miniCalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniCalCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  miniCalCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  miniCalDayText: {
    fontSize: 13,
    color: colors.text,
  },
  miniCalDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  miniCalBackBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  miniCalBackText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
