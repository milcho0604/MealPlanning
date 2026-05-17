/**
 * 쇼핑 리스트 화면 (Shopping Screen)
 *
 * 그룹 쇼핑 목록을 관리합니다.
 * - 그룹 드롭다운: 보고 싶은 그룹의 쇼핑 목록 전환
 * - 미완료 항목 / 완료 항목 섹션으로 구분
 * - 항목 탭하면 체크 토글 (취소선 + 색상 변경)
 * - 하단 입력바: 항목명 입력 후 즉시 추가
 * - "완료 항목 지우기" 버튼으로 체크된 항목 일괄 삭제
 * - "이번 주 식단으로 생성" 버튼: 식단 소스 그룹과 추가 대상 그룹을 선택하여 자동 생성
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ShoppingItem } from '@mealplan/shared';

/** FlatList 데이터 아이템 타입 (쇼핑 항목 또는 완료 섹션 구분선) */
type ShoppingListItem = ShoppingItem | { id: string; isSection: true };
import { useShopping } from '../../src/hooks/shopping/use-shopping.hook';
import { useShoppingMutation } from '../../src/hooks/shopping/use-shopping-mutation.hook';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useGroupStore } from '../../src/stores/group.store';
import { colors } from '../../src/constants/colors';
import { useRefresh } from '../../src/hooks/use-refresh.hook';

export default function ShoppingScreen() {
  const { groups, currentGroupId } = useGroupStore();

  // 쇼핑 화면에서 볼 그룹 (undefined = 미초기화, null = 전체 그룹, string = 특정 그룹)
  const [shoppingGroupId, setShoppingGroupId] = useState<string | null | undefined>(undefined);
  const isAllGroups = shoppingGroupId === null;

  // loadGroups() 완료 후 동기화 (미초기화 상태일 때만)
  useEffect(() => {
    if (currentGroupId && shoppingGroupId === undefined) {
      setShoppingGroupId(currentGroupId);
    }
  }, [currentGroupId]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const currentGroup = groups.find((g) => g.id === shoppingGroupId);

  const { data: items, isLoading, refetch } = useShopping(shoppingGroupId);
  const { refreshing, onRefresh } = useRefresh(refetch);
  const {
    createShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearCheckedItems,
    generateShoppingItems,
    isCreating,
    isGenerating,
  } = useShoppingMutation(shoppingGroupId);

  // ── 입력바 상태 ──────────────────────────────────────────
  const [inputText, setInputText] = useState('');
  const [inputQty, setInputQty] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── 자동 생성 모달 상태 ──────────────────────────────────
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  // 식단을 가져올 그룹 (소스)
  const [genSourceGroupId, setGenSourceGroupId] = useState<string>(shoppingGroupId ?? groups[0]?.id ?? '');
  // 쇼핑 목록에 넣을 그룹 (타겟)
  const [genTargetGroupId, setGenTargetGroupId] = useState<string>(shoppingGroupId ?? groups[0]?.id ?? '');

  /** 이번 주 월요일 날짜를 YYYY-MM-DD 형식으로 반환 */
  function getWeekStartDate(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split('T')[0];
  }

  /** 자동 생성 모달 열기 */
  const handleOpenGenerateModal = () => {
    const defaultId = shoppingGroupId ?? groups[0]?.id ?? '';
    setGenSourceGroupId(defaultId);
    setGenTargetGroupId(defaultId);
    setGenerateModalVisible(true);
  };

  /** 자동 생성 실행 */
  const handleGenerate = async () => {
    setGenerateModalVisible(false);
    try {
      const result = await generateShoppingItems({
        groupId: genTargetGroupId,
        weekStartDate: getWeekStartDate(),
        mealPlanGroupId: genSourceGroupId !== genTargetGroupId ? genSourceGroupId : undefined,
      });
      // 생성 후 해당 그룹으로 뷰 전환
      setShoppingGroupId(genTargetGroupId);
      if (result.created === 0) {
        Alert.alert('알림', result.message ?? '추가할 항목이 없습니다.');
      } else {
        Alert.alert('완료', `${result.created}개 항목이 추가되었습니다.`);
      }
    } catch {
      Alert.alert('오류', '자동 생성에 실패했습니다.');
    }
  };

  // useCallback/useMemo는 조건부 return 이전에 위치해야 함 (Rules of Hooks)
  const allItems = items ?? [];
  const uncheckedItems = allItems.filter((i) => !i.isChecked);
  const checkedItems = allItems.filter((i) => i.isChecked);

  /** 항목 삭제 확인 — renderItem deps에 포함되므로 useCallback으로 안정화 */
  const handleDelete = useCallback((item: ShoppingItem) => {
    Alert.alert('삭제', `"${item.name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeShoppingItem(item.id) },
    ]);
  }, [removeShoppingItem]);

  /** 쇼핑 항목 렌더링 */
  const renderItem = useCallback(({ item }: { item: ShoppingListItem }) => {
    if ('isSection' in item) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>완료됨 ({checkedItems.length})</Text>
        </View>
      );
    }
    const itemGroup = isAllGroups ? groups.find((g) => g.id === item.groupId) : undefined;
    return (
      <TouchableOpacity
        style={[styles.item, item.isChecked && styles.itemChecked]}
        onPress={() => {
          if (selectMode) {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(item.id)) next.delete(item.id);
              else next.add(item.id);
              return next;
            });
          } else {
            toggleShoppingItem(item.id);
          }
        }}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        {selectMode ? (
          <Ionicons
            name={selectedIds.has(item.id) ? 'checkbox' : 'square-outline'}
            size={22}
            color={selectedIds.has(item.id) ? colors.primary : colors.border}
            style={{ marginRight: 10 }}
          />
        ) : (
          <View style={[styles.checkboxIcon, item.isChecked && styles.checkboxChecked]}>
            {item.isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        )}

        <View style={styles.itemContent}>
          {itemGroup && (
            <View style={styles.groupIndicatorRow}>
              <View style={[styles.groupIndicatorDot, { backgroundColor: itemGroup.color ?? colors.primary }]} />
              <Text style={styles.groupIndicatorText}>{itemGroup.name}</Text>
            </View>
          )}
          <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.quantity != null && (
            <Text style={styles.itemQuantity}>
              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [selectMode, selectedIds, isAllGroups, groups, checkedItems.length, toggleShoppingItem, handleDelete]);

  // 그룹이 없으면 안내 화면 표시
  if (groups.length === 0) return <NoGroupView />;
  if (isLoading) return <LoadingSpinner />;

  /** 항목 빠른 추가 */
  const handleAdd = async () => {
    const name = inputText.trim();
    if (!name || !shoppingGroupId) return;
    const parsedQty = parseFloat(inputQty.trim());
    const quantity = inputQty.trim() && !isNaN(parsedQty) ? parsedQty : undefined;
    const unit = inputUnit.trim() || undefined;
    setInputText('');
    setInputQty('');
    setInputUnit('');
    try {
      await createShoppingItem({ groupId: shoppingGroupId, name, quantity, unit });
    } catch {
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    }
  };

  /** 쇼핑 리스트 공유 */
  const handleShareList = async () => {
    if (uncheckedItems.length === 0) {
      Alert.alert('공유', '공유할 쇼핑 항목이 없습니다.');
      return;
    }
    const lines = uncheckedItems.map((item) => {
      const qty = item.quantity != null ? ` ${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '';
      // 전체 그룹 모드에서는 그룹명 접두어 추가
      const groupPrefix = isAllGroups
        ? `[${groups.find((g) => g.id === item.groupId)?.name ?? ''}] `
        : '';
      return `☐ ${groupPrefix}${item.name}${qty}`;
    });
    const title = isAllGroups ? '전체 그룹' : (currentGroup?.name ?? '');
    try {
      await Share.share({
        message: `[MealPlan] ${title ? `${title} ` : ''}쇼핑 리스트\n\n${lines.join('\n')}`,
      });
    } catch { /* 공유 취소 시 무시 */ }
  };

  /** 완료 항목 일괄 삭제 */
  const handleClearChecked = () => {
    if (checkedItems.length === 0 || !shoppingGroupId) return;
    Alert.alert('완료 항목 지우기', `${checkedItems.length}개 항목을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => clearCheckedItems(shoppingGroupId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>쇼핑 리스트</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }} style={styles.headerActionBtn}>
              <Text style={styles.clearBtn}>{selectMode ? '취소' : '선택'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShareList} style={styles.headerActionBtn}>
              <Ionicons name="share-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            {checkedItems.length > 0 && !isAllGroups && (
              <TouchableOpacity onPress={handleClearChecked} style={styles.headerActionBtn}>
                <Text style={styles.clearBtn}>완료 지우기 ({checkedItems.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 그룹 드롭다운 */}
        {showGroupDropdown && (
          <Pressable
            style={[StyleSheet.absoluteFillObject, { zIndex: 9 }]}
            onPress={() => setShowGroupDropdown(false)}
          />
        )}
        {groups.length >= 1 && (
          <View style={styles.groupDropdownWrapper}>
            <TouchableOpacity
              style={styles.groupDropdownBtn}
              onPress={() => setShowGroupDropdown(!showGroupDropdown)}
            >
              {isAllGroups ? (
                <Ionicons name="apps-outline" size={14} color={colors.text} />
              ) : currentGroup ? (
                <View style={[styles.groupDropdownDot, { backgroundColor: currentGroup.color ?? colors.primary }]} />
              ) : (
                <Ionicons name="cart-outline" size={14} color={colors.text} />
              )}
              <Text style={styles.groupDropdownBtnText} numberOfLines={1}>
                {isAllGroups ? '전체 그룹' : (currentGroup?.name ?? '그룹 선택')}
              </Text>
              <Ionicons name={showGroupDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {showGroupDropdown && (
              <View style={styles.groupDropdownList}>
                {/* 전체 그룹 옵션 */}
                <TouchableOpacity
                  style={[styles.groupDropdownItem, isAllGroups && styles.groupDropdownItemActive]}
                  onPress={() => { setShoppingGroupId(null); setShowGroupDropdown(false); }}
                >
                  <Ionicons name="apps-outline" size={14} color={isAllGroups ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.groupDropdownItemText, isAllGroups && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                    전체 그룹
                  </Text>
                  {isAllGroups && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
                {groups.map((g) => {
                  const isSelected = g.id === shoppingGroupId;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.groupDropdownItem, isSelected && styles.groupDropdownItemActive]}
                      onPress={() => { setShoppingGroupId(g.id); setShowGroupDropdown(false); }}
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
            <TouchableOpacity
              onPress={() => {
                if (selectedIds.size === uncheckedItems.length) setSelectedIds(new Set());
                else setSelectedIds(new Set(uncheckedItems.map((i) => i.id)));
              }}
              style={styles.selectAllBtn}
            >
              <Ionicons
                name={selectedIds.size === uncheckedItems.length && uncheckedItems.length > 0 ? 'checkbox' : 'square-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.selectAllText}>전체 선택 ({selectedIds.size})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkDeleteBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
              onPress={() => {
                if (selectedIds.size === 0) return;
                Alert.alert('일괄 삭제', `${selectedIds.size}개 항목을 삭제할까요?`, [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await Promise.all([...selectedIds].map((id) => removeShoppingItem(id)));
                      } catch {
                        Alert.alert('오류', '일부 항목 삭제에 실패했습니다.');
                      } finally {
                        setSelectMode(false);
                        setSelectedIds(new Set());
                      }
                    },
                  },
                ]);
              }}
              disabled={selectedIds.size === 0}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.bulkDeleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 이번 주 식단으로 자동 생성 배너 */}
        <TouchableOpacity
          style={[styles.generateBanner, isGenerating && styles.generateBannerDisabled]}
          onPress={handleOpenGenerateModal}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles-outline" size={16} color="#fff" />
          )}
          <Text style={styles.generateBannerText}>
            {isGenerating ? '생성 중...' : '이번 주 식단으로 쇼핑 목록 자동 생성'}
          </Text>
        </TouchableOpacity>

        {/* 항목 목록 */}
        {shoppingGroupId === undefined ? (
          <EmptyState icon="cart-outline" message="그룹을 선택하면\n쇼핑 목록이 표시됩니다." />
        ) : allItems.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            message={
              isAllGroups
                ? '모든 그룹의 쇼핑 목록이 비어있습니다.'
                : '쇼핑 목록이 비어있습니다.\n아래 입력창에서 항목을 추가해보세요!'
            }
          />
        ) : (
          <FlatList<ShoppingListItem>
            data={[
              ...uncheckedItems,
              ...(checkedItems.length > 0 ? [{ id: '__section_header__', isSection: true } as const] : []),
              ...checkedItems,
            ]}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* 하단 입력바 — 전체 그룹 모드에서는 비활성 */}
        {isAllGroups ? (
          <View style={[styles.inputBar, styles.inputBarDisabled]}>
            <Ionicons name="apps-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.inputBarDisabledText}>전체 그룹 보기 중 — 특정 그룹을 선택하면 항목을 추가할 수 있습니다</Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={shoppingGroupId ? '항목명' : '그룹을 먼저 선택하세요'}
              placeholderTextColor={colors.textSecondary}
              returnKeyType="next"
              maxLength={50}
              editable={!!shoppingGroupId}
            />
            <TextInput
              style={styles.inputQty}
              value={inputQty}
              onChangeText={(t) => setInputQty(t.replace(/[^0-9.]/g, ''))}
              placeholder="수량"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={6}
              editable={!!shoppingGroupId}
            />
            <TextInput
              style={styles.inputUnit}
              value={inputUnit}
              onChangeText={setInputUnit}
              placeholder="단위"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              maxLength={5}
              editable={!!shoppingGroupId}
            />
            <TouchableOpacity
              style={[styles.addBtn, (!inputText.trim() || isCreating || !shoppingGroupId) && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!inputText.trim() || isCreating || !shoppingGroupId}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── 자동 생성 모달 ── */}
      <Modal
        visible={generateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenerateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <Text style={styles.modalTitle}>이번 주 식단으로 자동 생성</Text>
            <Text style={styles.modalDesc}>
              이번 주(월~일) 식단 메뉴를 쇼핑 목록에 추가합니다.{'\n'}
              냉장고에 이미 있는 재료는 제외됩니다.
            </Text>

            {/* 식단 소스 그룹 선택 */}
            <Text style={styles.modalLabel}>식단 가져올 그룹</Text>
            <View style={styles.groupRadioList}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupRadioItem, genSourceGroupId === g.id && styles.groupRadioItemSelected]}
                  onPress={() => setGenSourceGroupId(g.id)}
                >
                  <View style={[styles.groupRadioDot, { backgroundColor: g.color ?? colors.primary }]} />
                  <Text style={[styles.groupRadioText, genSourceGroupId === g.id && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                  {genSourceGroupId === g.id && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* 쇼핑 목록 추가 대상 그룹 선택 */}
            <Text style={styles.modalLabel}>쇼핑 목록에 추가할 그룹</Text>
            <View style={styles.groupRadioList}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupRadioItem, genTargetGroupId === g.id && styles.groupRadioItemSelected]}
                  onPress={() => setGenTargetGroupId(g.id)}
                >
                  <View style={[styles.groupRadioDot, { backgroundColor: g.color ?? colors.primary }]} />
                  <Text style={[styles.groupRadioText, genTargetGroupId === g.id && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                  {genTargetGroupId === g.id && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setGenerateModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, isGenerating && { opacity: 0.5 }]}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                <Text style={styles.modalConfirmText}>{isGenerating ? '생성 중...' : '생성'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  // ── 헤더 ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {},
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
  // ── 선택 모드 ────────────────────────────────────────────
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
  clearBtn: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  // ── 자동 생성 배너 ────────────────────────────────────────
  generateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  generateBannerDisabled: {
    opacity: 0.6,
  },
  generateBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  // ── 항목 목록 ────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // ── 항목 행 ─────────────────────────────────────────────
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    backgroundColor: colors.background,
  },
  itemChecked: {
    opacity: 0.5,
  },
  checkboxIcon: {
    width: 28,
    height: 28,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: colors.text,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  itemQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 8,
  },
  // ── 전체 그룹 모드 항목 그룹 인디케이터 ─────────────────────
  groupIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  groupIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  groupIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // ── 하단 입력바 ─────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  input: {
    flex: 3,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 44,
    fontSize: 15,
    color: colors.text,
  },
  inputQty: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 0,
    height: 44,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  inputUnit: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 0,
    height: 44,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
  },
  inputBarDisabled: {
    opacity: 0.7,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  inputBarDisabledText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // ── 자동 생성 모달 ────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  groupRadioList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  groupRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupRadioItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  groupRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupRadioText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
