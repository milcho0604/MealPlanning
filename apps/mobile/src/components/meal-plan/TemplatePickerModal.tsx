/**
 * 템플릿 선택 모달 (TemplatePickerModal)
 *
 * 저장된 식단 템플릿 목록을 보여주고, 선택 시 해당 템플릿 데이터를 반환합니다.
 * - 템플릿 탭 → 폼에 자동 채우기
 * - 롱프레스 → 삭제 확인
 * - 템플릿이 없으면 빈 상태 안내
 */

import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MealTemplate } from '@mealplan/shared';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import { useTemplates } from '../../hooks/template/use-templates.hook';
import { useTemplateMutation } from '../../hooks/template/use-template-mutation.hook';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { colors } from '../../constants/colors';

interface TemplatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  /** 템플릿 선택 시 호출 */
  onSelect: (template: MealTemplate) => void;
}

export function TemplatePickerModal({ visible, onClose, onSelect }: TemplatePickerModalProps) {
  const { data: templates, isLoading } = useTemplates();
  const { removeTemplate } = useTemplateMutation();

  const handleDelete = (template: MealTemplate) => {
    Alert.alert('템플릿 삭제', `"${template.name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTemplate(template.id);
          } catch {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MealTemplate }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      {/* 식사 유형 배지 */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{MEAL_TYPE_LABELS[item.mealType]}</Text>
      </View>

      {/* 내용 */}
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMenu} numberOfLines={1}>
          {item.menuName}
        </Text>
        {item.memo && (
          <Text style={styles.itemMemo} numberOfLines={1}>
            {item.memo}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>템플릿 선택</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>탭하면 폼에 적용, 롱프레스하면 삭제</Text>

        {/* 목록 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : !templates || templates.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>저장된 템플릿이 없습니다.</Text>
            <Text style={styles.emptySubText}>
              식단 추가 시 "템플릿으로 저장" 버튼을 눌러보세요.
            </Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // ── 헤더 ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  closeBtn: { padding: 4 },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  // ── 목록 ──────────────────────────────────────────────────
  listContent: { paddingVertical: 8 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 70 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    gap: 12,
  },
  badge: {
    minWidth: 42,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemMenu: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  itemMemo: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  // ── 빈 상태 ───────────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySubText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
