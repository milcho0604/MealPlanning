/**
 * 식단 리스트 뷰 컴포넌트 (MealPlanListView)
 *
 * 전체 식단을 날짜순으로 일자 나열하여 보여줍니다.
 * - 검색: 메뉴명, 메모로 필터링
 * - 기간 필터: 전체 / 1개월 / 3개월 / 6개월 / 직접 입력
 * - 가상 스크롤(FlatList)로 대량 데이터 대응
 */

import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { MealPlanCard } from './MealPlanCard';
import { colors } from '../../constants/colors';

/** 기간 필터 옵션 */
type PeriodFilter = 'all' | '1m' | '3m' | '6m' | 'custom';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '6m', label: '6개월' },
  { value: 'custom', label: '직접 설정' },
];

/** 날짜를 "M월 D일 (요일)" 형식으로 포맷 */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = weekdays[d.getDay()];
  return `${m}월 ${day}일 (${wd})`;
}

/** YYYY-MM-DD 형식으로 Date를 변환 */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 기간 필터에 따른 시작 날짜 계산 */
function getStartDate(period: PeriodFilter): string | null {
  if (period === 'all') return null;
  const d = new Date();
  if (period === '1m') d.setMonth(d.getMonth() - 1);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  else if (period === '6m') d.setMonth(d.getMonth() - 6);
  return toDateStr(d);
}

interface MealPlanListViewProps {
  mealPlans: MealPlanWithUser[];
  onEdit: (mealPlan: MealPlanWithUser) => void;
  onDelete: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

/** 날짜 섹션 헤더 + 식단 카드를 하나의 리스트로 표현하기 위한 타입 */
type ListItem =
  | { type: 'header'; date: string; count: number }
  | { type: 'meal'; data: MealPlanWithUser };

export function MealPlanListView({
  mealPlans,
  onEdit,
  onDelete,
  refreshing,
  onRefresh,
}: MealPlanListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempFrom, setTempFrom] = useState('');
  const [tempTo, setTempTo] = useState('');

  /** 기간 + 검색어로 필터링된 식단 목록 */
  const filteredMealPlans = useMemo(() => {
    let filtered = [...mealPlans];

    // 기간 필터
    if (period === 'custom' && customFrom) {
      filtered = filtered.filter((mp) => mp.date >= customFrom);
    }
    if (period === 'custom' && customTo) {
      filtered = filtered.filter((mp) => mp.date <= customTo);
    }
    if (period !== 'all' && period !== 'custom') {
      const startDate = getStartDate(period);
      if (startDate) {
        filtered = filtered.filter((mp) => mp.date >= startDate);
      }
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
  }, [mealPlans, searchQuery, period, customFrom, customTo]);

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
        const today = toDateStr(new Date());
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
        <MealPlanCard
          mealPlan={item.data}
          onEdit={onEdit}
          onDelete={onDelete}
        />
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
      <View style={styles.periodRow}>
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
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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

      {/* 결과 건수 */}
      <Text style={styles.resultCount}>
        {filteredMealPlans.length}건의 식단
      </Text>

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
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 식단이 없습니다.'}
            </Text>
          </View>
        }
      />

      {/* 직접 설정 모달 */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>기간 직접 설정</Text>
            <Text style={styles.dialogLabel}>시작일 (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.dialogInput}
              value={tempFrom}
              onChangeText={setTempFrom}
              placeholder="2026-01-01"
              placeholderTextColor={colors.textSecondary}
              maxLength={10}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />
            <Text style={styles.dialogLabel}>종료일 (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.dialogInput}
              value={tempTo}
              onChangeText={setTempTo}
              placeholder="2026-12-31"
              placeholderTextColor={colors.textSecondary}
              maxLength={10}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />
            <View style={styles.dialogButtons}>
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
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
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
  // ── 결과 건수 ──────────────────────────────────────────
  resultCount: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 4,
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
