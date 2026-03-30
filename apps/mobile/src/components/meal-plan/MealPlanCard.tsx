/**
 * 식단 카드 컴포넌트 (Meal Plan Card)
 *
 * 하나의 식단(아침/점심/저녁/간식)을 카드 형태로 표시합니다.
 * 홈 화면과 캘린더 화면에서 공통으로 사용합니다.
 */

import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { colors } from '../../constants/colors';

/** 식사 유형별 아이콘 */
const MEAL_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

interface MealPlanCardProps {
  mealPlan: MealPlanWithUser;
  onEdit: (mealPlan: MealPlanWithUser) => void;
  onDelete: (id: string) => void;
}

export function MealPlanCard({ mealPlan, onEdit, onDelete }: MealPlanCardProps) {
  const handleDelete = () => {
    Alert.alert('식단 삭제', `"${mealPlan.menuName}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(mealPlan.id) },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* 상단: 뱃지 + 수정 */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles[mealPlan.mealType]]}>
            <Ionicons
              name={MEAL_TYPE_ICONS[mealPlan.mealType] ?? 'restaurant-outline'}
              size={12}
              color={colors.text}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.badgeText}>
              {MEAL_TYPE_LABELS[mealPlan.mealType as keyof typeof MEAL_TYPE_LABELS]}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(mealPlan)} style={styles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 메뉴 이름 */}
      <Text style={styles.menuName} numberOfLines={2}>{mealPlan.menuName}</Text>

      {/* 메모 */}
      {mealPlan.memo && (
        <Text style={styles.memo} numberOfLines={2}>{mealPlan.memo}</Text>
      )}

      {/* 하단: 등록자 */}
      <View style={styles.footer}>
        <View style={styles.authorChip}>
          <Ionicons name="person-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.authorText}>{mealPlan.createdByUser.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  breakfast: { backgroundColor: colors.warningLight },
  lunch:     { backgroundColor: colors.primaryLight },
  dinner:    { backgroundColor: colors.infoLight },
  snack:     { backgroundColor: colors.purpleLight },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
  },
  menuName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  memo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  authorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
