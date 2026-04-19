/**
 * 냉장고 화면 (Fridge Screen)
 *
 * 냉장고에 등록된 재료를 카테고리 탭 + 전체 목록으로 보여줍니다.
 * - 상단 경고 배너: 유통기한 임박(3일 이내) 재료 수 표시
 * - 카테고리 필터 탭: 전체 / 육류 / 채소 / 유제품 / 해산물 / ...
 * - 재료 카드 목록: 소진되지 않은 재료만 표시
 * - FAB: 재료 추가
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EXPIRY_WARNING_DAYS, INGREDIENT_CATEGORY_LABELS } from '@mealplan/shared';
import type { Ingredient, IngredientCategory } from '@mealplan/shared';
import { useIngredients } from '../../src/hooks/ingredient/use-ingredients.hook';
import { useIngredientMutation } from '../../src/hooks/ingredient/use-ingredient-mutation.hook';
import { IngredientCard } from '../../src/components/ingredient/IngredientCard';
import { SwipeToDelete } from '../../src/components/common/SwipeToDelete';
import { IngredientFormModal } from '../../src/components/ingredient/IngredientFormModal';
import { SkeletonLoader } from '../../src/components/common/SkeletonLoader';
import { EmptyState } from '../../src/components/common/EmptyState';
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useGroupStore } from '../../src/stores/group.store';
import { colors } from '../../src/constants/colors';

/** 필터 탭 타입: 'all' 또는 카테고리 */
type FilterTab = 'all' | IngredientCategory;

/** 탭 레이블 목록 (전체 + 카테고리 순서) */
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  ...(Object.keys(INGREDIENT_CATEGORY_LABELS) as IngredientCategory[]).map((cat) => ({
    key: cat,
    label: INGREDIENT_CATEGORY_LABELS[cat],
  })),
];

/** 유통기한 임박 여부 체크 */
function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return days <= EXPIRY_WARNING_DAYS;
}

export default function FridgeScreen() {
  const { groups, currentGroupId } = useGroupStore();

  // 냉장고에서 볼 그룹 (local state, 기본값 = currentGroupId)
  const [fridgeGroupId, setFridgeGroupId] = useState<string | null>(currentGroupId);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const currentGroup = groups.find((g) => g.id === fridgeGroupId);

  // loadGroups 완료 후 동기화 (최초 1회만)
  useEffect(() => {
    if (currentGroupId && !fridgeGroupId) {
      setFridgeGroupId(currentGroupId);
    }
  }, [currentGroupId]);

  // ── 필터 탭 상태 ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // ── 모달 상태 ──────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── 데이터 ─────────────────────────────────────────────
  const { data: ingredients, isLoading, refetch } = useIngredients(false, fridgeGroupId);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const { removeIngredient, consumeIngredient } = useIngredientMutation();

  // 소진되지 않은 재료만 필터링
  const activeIngredients = (ingredients ?? []).filter((i) => !i.isConsumed);

  // 유통기한 임박 재료 수
  const expiringCount = activeIngredients.filter((i) => isExpiringSoon(i.expiryDate)).length;

  // 선택된 카테고리 탭으로 필터링
  const filteredIngredients =
    activeTab === 'all'
      ? activeIngredients
      : activeIngredients.filter((i) => i.category === activeTab);

  // ── 핸들러 ─────────────────────────────────────────────
  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsModalVisible(true);
  };
  const handleConsume = async (id: string) => {
    await consumeIngredient(id);
  };
  const handleDelete = async (id: string) => {
    await removeIngredient(id);
  };
  const handleAddPress = () => {
    setEditingIngredient(null);
    setIsModalVisible(true);
  };
  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingIngredient(null);
  };
  /** 선택 모드 토글 */
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
  };
  /** 개별 항목 선택/해제 */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  /** 전체 선택/해제 */
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIngredients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIngredients.map((i) => i.id)));
    }
  };
  /** 선택 항목 일괄 삭제 */
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    Alert.alert('일괄 삭제', `${selectedIds.size}개 재료를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await Promise.all([...selectedIds].map((id) => removeIngredient(id)));
          setSelectMode(false);
          setSelectedIds(new Set());
        },
      },
    ]);
  };

  if (groups.length === 0) return <NoGroupView />;
  if (isLoading) return <SkeletonLoader rows={4} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>냉장고</Text>
          <Text style={styles.headerSub}>{activeIngredients.length}개 재료</Text>
        </View>
        <TouchableOpacity onPress={toggleSelectMode}>
          <Text style={styles.selectModeBtn}>{selectMode ? '취소' : '선택'}</Text>
        </TouchableOpacity>
      </View>

      {/* 그룹 드롭다운 */}
      {groups.length >= 1 && (
        <View style={styles.groupDropdownWrapper}>
          <TouchableOpacity
            style={styles.groupDropdownBtn}
            onPress={() => setShowGroupDropdown(!showGroupDropdown)}
          >
            {currentGroup ? (
              <View style={[styles.groupDropdownDot, { backgroundColor: currentGroup.color ?? colors.primary }]} />
            ) : (
              <Ionicons name="nutrition-outline" size={14} color={colors.text} />
            )}
            <Text style={styles.groupDropdownBtnText} numberOfLines={1}>
              {currentGroup?.name ?? '그룹 선택'}
            </Text>
            <Ionicons name={showGroupDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {showGroupDropdown && (
            <View style={styles.groupDropdownList}>
              {groups.map((g) => {
                const isSelected = g.id === fridgeGroupId;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupDropdownItem, isSelected && styles.groupDropdownItemActive]}
                    onPress={() => { setFridgeGroupId(g.id); setShowGroupDropdown(false); }}
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

      {/* 선택 모드 액션 바 */}
      {selectMode && (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
            <Ionicons
              name={selectedIds.size === filteredIngredients.length && filteredIngredients.length > 0 ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.selectAllText}>전체 선택 ({selectedIds.size}/{filteredIngredients.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkDeleteBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.bulkDeleteText}>삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 유통기한 임박 경고 배너 */}
      {expiringCount > 0 && (
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.warningText}>
            유통기한 임박 재료 {expiringCount}개 — 확인하세요!
          </Text>
        </TouchableOpacity>
      )}

      {/* 카테고리 필터 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 재료 목록 */}
      <FlatList
        data={filteredIngredients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.selectRow}>
            {selectMode && (
              <TouchableOpacity onPress={() => toggleSelect(item.id)} style={styles.checkbox}>
                <Ionicons
                  name={selectedIds.has(item.id) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={selectedIds.has(item.id) ? colors.primary : colors.border}
                />
              </TouchableOpacity>
            )}
            <View style={styles.selectRowContent}>
              <SwipeToDelete confirmMessage={`"${item.name}"을(를) 삭제할까요?`} onDelete={() => handleDelete(item.id)}>
                <IngredientCard
                  ingredient={item}
                  onEdit={handleEdit}
                  onConsume={handleConsume}
                  onDelete={handleDelete}
                />
              </SwipeToDelete>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="nutrition-outline"
            message={
              activeTab === 'all'
                ? '냉장고가 비어있습니다.\n+ 버튼을 눌러 재료를 추가해보세요!'
                : `${INGREDIENT_CATEGORY_LABELS[activeTab as IngredientCategory]} 카테고리에\n재료가 없습니다.`
            }
          />
        }
      />

      {/* 추가 FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 재료 추가/수정 모달 */}
      <IngredientFormModal
        visible={isModalVisible}
        onClose={handleModalClose}
        ingredient={editingIngredient ?? undefined}
        groupId={fridgeGroupId}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  selectModeBtn: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  // ── 그룹 드롭다운 ───────────────────────────────────────
  groupDropdownWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 10,
  },
  groupDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  groupDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupDropdownItemActive: {
    backgroundColor: colors.primaryLight,
  },
  groupDropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  // ── 선택 모드 바 ──────────────────────────────────────
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: colors.text,
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bulkDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    paddingRight: 8,
  },
  selectRowContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // ── 경고 배너 ────────────────────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  // ── 카테고리 탭 ──────────────────────────────────────────
  tabScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  // ── 리스트 ───────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
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
});
