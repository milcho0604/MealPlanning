/**
 * 쇼핑 리스트 화면 (Shopping Screen)
 *
 * 그룹 쇼핑 목록을 관리합니다.
 * - 미완료 항목 / 완료 항목 섹션으로 구분
 * - 항목 탭하면 체크 토글 (취소선 + 색상 변경)
 * - 스와이프 대신 롱프레스 → 삭제 컨텍스트 메뉴
 * - 하단 입력바: 항목명 입력 후 즉시 추가
 * - "완료 항목 지우기" 버튼으로 체크된 항목 일괄 삭제
 */

import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ShoppingItem } from '@mealplan/shared';
import { useShopping } from '../../src/hooks/shopping/use-shopping.hook';
import { useShoppingMutation } from '../../src/hooks/shopping/use-shopping-mutation.hook';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { NoGroupView } from '../../src/components/group/NoGroupView';
import { useGroupStore } from '../../src/stores/group.store';
import { colors } from '../../src/constants/colors';

export default function ShoppingScreen() {
  const { currentGroupId } = useGroupStore();
  const { data: items, isLoading } = useShopping();
  const {
    createShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearCheckedItems,
    isCreating,
  } = useShoppingMutation();

  // ── 입력바 상태 ──────────────────────────────────────────
  const [inputText, setInputText] = useState('');

  // 그룹이 없으면 안내 화면 표시
  if (!currentGroupId) return <NoGroupView />;
  if (isLoading) return <LoadingSpinner />;

  const allItems = items ?? [];
  const uncheckedItems = allItems.filter((i) => !i.isChecked);
  const checkedItems = allItems.filter((i) => i.isChecked);

  /** 항목 빠른 추가 */
  const handleAdd = async () => {
    const name = inputText.trim();
    if (!name) return;
    setInputText('');
    try {
      await createShoppingItem({ groupId: currentGroupId, name });
    } catch {
      Alert.alert('오류', '항목 추가에 실패했습니다.');
    }
  };

  /** 항목 삭제 확인 */
  const handleDelete = (item: ShoppingItem) => {
    Alert.alert('삭제', `"${item.name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => removeShoppingItem(item.id),
      },
    ]);
  };

  /** 완료 항목 일괄 삭제 */
  const handleClearChecked = () => {
    if (checkedItems.length === 0) return;
    Alert.alert('완료 항목 지우기', `${checkedItems.length}개 항목을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => clearCheckedItems(currentGroupId),
      },
    ]);
  };

  /** 쇼핑 항목 렌더링 */
  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity
      style={[styles.item, item.isChecked && styles.itemChecked]}
      onPress={() => toggleShoppingItem(item.id)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      {/* 체크 아이콘 */}
      <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
        {item.isChecked && (
          <Ionicons name="checkmark" size={14} color="#fff" />
        )}
      </View>

      {/* 항목명 + 수량 */}
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        {item.quantity != null && (
          <Text style={styles.itemQuantity}>
            {item.quantity}{item.unit ?? ''}
          </Text>
        )}
      </View>

      {/* 삭제 버튼 */}
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>쇼핑 리스트</Text>
          {checkedItems.length > 0 && (
            <TouchableOpacity onPress={handleClearChecked}>
              <Text style={styles.clearBtn}>완료 지우기 ({checkedItems.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 항목 목록 */}
        {allItems.length === 0 ? (
          <EmptyState
            message={'쇼핑 목록이 비어있습니다.\n아래 입력창에서 항목을 추가해보세요!'}
          />
        ) : (
          <FlatList
            data={[...uncheckedItems, ...checkedItems]}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            /** 완료 항목 구분선 */
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={
              checkedItems.length > 0 && uncheckedItems.length > 0 ? (
                // 미완료 / 완료 섹션 사이의 구분 텍스트
                // FlatList는 단순 배열이므로 인덱스로 위치 파악이 어렵기 때문에
                // 완료 항목이 있을 때 헤더 텍스트를 Footer로 대신 표시하지 않고
                // 완료 섹션 위에 레이블을 렌더링하는 방식으로 처리
                null
              ) : null
            }
          />
        )}

        {/* 하단 입력바 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="항목 추가..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            maxLength={50}
          />
          <TouchableOpacity
            style={[styles.addBtn, (!inputText.trim() || isCreating) && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!inputText.trim() || isCreating}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  clearBtn: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
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
  checkbox: {
    width: 22,
    height: 22,
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
  // ── 하단 입력바 ─────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
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
});
