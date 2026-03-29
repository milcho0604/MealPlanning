/**
 * 식단 카드 컴포넌트 (Meal Plan Card)
 *
 * 하나의 식단(아침/점심/저녁/간식)을 카드 형태로 표시합니다.
 * 홈 화면과 캘린더 화면에서 공통으로 사용합니다.
 *
 * Props:
 * - mealPlan: 표시할 식단 데이터
 * - onEdit: 수정 버튼 클릭 콜백
 * - onDelete: 삭제 버튼 클릭 콜백
 */

import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { colors } from '../../constants/colors';

interface MealPlanCardProps {
  mealPlan: MealPlanWithUser;
  onEdit: (mealPlan: MealPlanWithUser) => void;
  onDelete: (id: string) => void;
}

export function MealPlanCard({ mealPlan, onEdit, onDelete }: MealPlanCardProps) {
  const handleDelete = () => {
    Alert.alert(
      '식단 삭제',
      `"${mealPlan.menuName}"을(를) 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => onDelete(mealPlan.id),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* 식사 유형 뱃지 (아침/점심/저녁/간식) */}
      <View style={styles.header}>
        <View style={[styles.badge, styles[mealPlan.mealType]]}>
          <Text style={styles.badgeText}>
            {MEAL_TYPE_LABELS[mealPlan.mealType as keyof typeof MEAL_TYPE_LABELS]}
          </Text>
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(mealPlan)} style={styles.editBtn} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 메뉴 이름 */}
      <Text style={styles.menuName} numberOfLines={2}>{mealPlan.menuName}</Text>

      {/* 메모 (있는 경우만 표시) */}
      {mealPlan.memo && (
        <Text style={styles.memo} numberOfLines={2}>{mealPlan.memo}</Text>
      )}

      {/* 등록자 정보 */}
      <Text style={styles.createdBy}>
        {mealPlan.createdByUser.name} 등록
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  // 식사 유형별 색상
  breakfast: { backgroundColor: '#FFF3E0' },
  lunch:     { backgroundColor: '#E8F5E9' },
  dinner:    { backgroundColor: '#E3F2FD' },
  snack:     { backgroundColor: '#F3E5F5' },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  memo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  createdBy: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
