/**
 * 홈 화면 (Home Screen)
 *
 * 주간(7일) 날짜 탭과 선택된 날짜의 식단 목록을 보여줍니다.
 * - 상단 날짜 스트립: 이번 주 월~일 탭
 * - 선택 날짜의 식단 카드 목록
 * - 우하단 FAB으로 식단 추가
 * - Phase 2: 반복 식단, 레시피 URL 지원 (MealPlanFormModal에서 처리)
 */

import { useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans } from '../../src/hooks/meal-plan/use-meal-plans.hook';
import { mealPlanService } from '../../src/services/meal-plan.service';
import { MealPlanCard } from '../../src/components/meal-plan/MealPlanCard';
import { MealPlanFormModal } from '../../src/components/meal-plan/MealPlanFormModal';
import { SkeletonLoader } from '../../src/components/common/SkeletonLoader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useMealPlanMutation } from '../../src/hooks/meal-plan/use-meal-plan-mutation.hook';
import { useGroupStore } from '../../src/stores/group.store';
import type { MealPlanWithUser } from '../../src/services/meal-plan.service';
import { colors } from '../../src/constants/colors';

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date → YYYY-MM-DD */
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 이번 주 월요일부터 7일치 날짜 배열 반환 */
function getWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day; // 이번 주 월요일로
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** 날짜를 "월 (월)" 형식으로 포맷 */
function formatMonthLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 (${weekday})`;
}

/** 날짜를 "3월 22일 (토)" 형식으로 포맷 */
function formatDateHeader(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export default function HomeScreen() {
  const today = getTodayString();
  const weekDates = getWeekDates();
  const { currentGroupId } = useGroupStore();

  // 선택된 날짜 (기본값: 오늘, 없으면 이번 주 월요일)
  const defaultDate = weekDates.find((d) => toDateString(d) === today) ? today : toDateString(weekDates[0]);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const year = selectedDateObj.getFullYear();
  const month = selectedDateObj.getMonth() + 1;

  // 선택된 날짜가 속한 월의 식단을 조회
  const { data: allMealPlans, isLoading, refetch } = useMealPlans(year, month);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const { removeMealPlan } = useMealPlanMutation();

  // ── 모달 상태 ──────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlanWithUser | null>(null);

  // 그룹이 없으면 안내 화면 표시 (훅 호출 이후에 체크)
  if (!currentGroupId) return <NoGroupView />;

  // 선택된 날짜의 식단만 필터링
  const selectedMealPlans = (allMealPlans ?? []).filter((mp) => mp.date === selectedDate);

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

  // ── 검색 ──────────────────────────────────────────────
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MealPlanWithUser[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await mealPlanService.search(currentGroupId!, text.trim());
        setSearchResults(results);
      } catch { setSearchResults([]); }
    }, 300);
  };

  // ── 렌더링 ────────────────────────────────────────────
  if (isLoading) return <SkeletonLoader rows={4} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {selectedDate === today ? '오늘의 식단' : '식단'}
          </Text>
          <Text style={styles.headerDate}>{formatDateHeader(selectedDateObj)}</Text>
        </View>
        <TouchableOpacity onPress={() => {
          setIsSearching(!isSearching);
          setSearchQuery('');
          setSearchResults([]);
          if (searchTimeout.current) clearTimeout(searchTimeout.current);
        }}>
          <Ionicons name={isSearching ? 'close' : 'search'} size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      {isSearching && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="메뉴명으로 검색..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      {/* 검색 결과 */}
      {isSearching && searchQuery.trim() ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MealPlanCard mealPlan={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ListEmptyComponent={<Text style={styles.emptySearch}>검색 결과가 없습니다.</Text>}
        />
      ) : (
      <>
      {/* 주간 날짜 탭 스트립 */}
      <View style={styles.weekStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekScrollContent}
        >
          {weekDates.map((date) => {
            const dateStr = toDateString(date);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const dayNum = date.getDate();
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            const weekday = weekdays[date.getDay()];

            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.dayTab, isSelected && styles.dayTabSelected]}
                onPress={() => setSelectedDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayWeekdaySelected]}>
                  {weekday}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                  {dayNum}
                </Text>
                {/* 오늘 강조 점 */}
                {isToday && (
                  <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 식단 목록 */}
      <FlatList
        data={selectedMealPlans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MealPlanCard
            mealPlan={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            message={`${formatDateHeader(selectedDateObj)}에\n등록된 식단이 없습니다.\n+ 버튼을 눌러 추가해보세요!`}
          />
        }
      />

      </>
      )}

      {/* 추가 FAB (Floating Action Button) */}
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
  // ── 헤더 ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {},
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
  // ── 주간 날짜 탭 ─────────────────────────────────────────
  weekStrip: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  dayTab: {
    width: 44,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 4,
  },
  dayTabSelected: {
    backgroundColor: colors.primary,
  },
  dayWeekday: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayWeekdaySelected: {
    color: '#fff',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dayNumSelected: {
    color: '#fff',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  todayDotSelected: {
    backgroundColor: '#fff',
  },
  // ── 리스트 ───────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
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
  // ── 검색 ────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
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
  emptySearch: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 40,
  },
});
