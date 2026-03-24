/**
 * 냉장고 재료 카드 컴포넌트 (IngredientCard)
 *
 * 냉장고에 등록된 재료 하나를 카드 형태로 표시합니다.
 * - 카테고리 뱃지
 * - 재료명, 수량/단위
 * - 유통기한 (임박 시 경고 색상)
 * - 수정 / 소진 / 삭제 버튼
 *
 * Props:
 * - ingredient: 표시할 재료 데이터
 * - onEdit: 수정 버튼 클릭 콜백
 * - onConsume: 소진 처리 콜백
 * - onDelete: 삭제 버튼 클릭 콜백
 */

import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPIRY_WARNING_DAYS, INGREDIENT_CATEGORY_LABELS } from '@mealplan/shared';
import type { Ingredient } from '@mealplan/shared';
import { colors } from '../../constants/colors';

interface IngredientCardProps {
  ingredient: Ingredient;
  onEdit: (ingredient: Ingredient) => void;
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
}

/** 유통기한까지 남은 일수 계산 (만료되면 음수) */
function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** 유통기한 표시 텍스트와 색상 반환 */
function getExpiryDisplay(expiryDate: string | null): { text: string; color: string } | null {
  if (!expiryDate) return null;

  const days = getDaysUntilExpiry(expiryDate);

  if (days < 0) {
    return { text: `${Math.abs(days)}일 지남`, color: colors.error };
  }
  if (days === 0) {
    return { text: '오늘 만료', color: colors.error };
  }
  if (days <= EXPIRY_WARNING_DAYS) {
    return { text: `D-${days}`, color: colors.warning };
  }
  return { text: `D-${days}`, color: colors.textSecondary };
}

export function IngredientCard({ ingredient, onEdit, onConsume, onDelete }: IngredientCardProps) {
  const expiryDisplay = getExpiryDisplay(ingredient.expiryDate);
  const isExpiringSoon =
    ingredient.expiryDate !== null &&
    getDaysUntilExpiry(ingredient.expiryDate) <= EXPIRY_WARNING_DAYS;

  const handleConsume = () => {
    Alert.alert(
      '소진 처리',
      `"${ingredient.name}"을(를) 소진 처리할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '소진', onPress: () => onConsume(ingredient.id) },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      '재료 삭제',
      `"${ingredient.name}"을(를) 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => onDelete(ingredient.id) },
      ],
    );
  };

  return (
    <View style={[styles.card, isExpiringSoon && styles.cardExpiring]}>
      <View style={styles.row}>
        {/* 카테고리 뱃지 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {ingredient.category
              ? INGREDIENT_CATEGORY_LABELS[ingredient.category]
              : '기타'}
          </Text>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(ingredient)} style={styles.editBtn}>
            <Ionicons name="create" size={13} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConsume} style={styles.consumeBtn}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash" size={13} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 재료명 */}
      <Text style={styles.name}>{ingredient.name}</Text>

      {/* 수량 + 유통기한 */}
      <View style={styles.metaRow}>
        {ingredient.quantity != null && (
          <Text style={styles.quantity}>
            {ingredient.quantity}{ingredient.unit ?? ''}
          </Text>
        )}
        {expiryDisplay && (
          <Text style={[styles.expiry, { color: expiryDisplay.color }]}>
            {expiryDisplay.text}
          </Text>
        )}
      </View>
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
  /** 유통기한 임박 시 경고 테두리 */
  cardExpiring: {
    borderColor: colors.warning,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consumeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantity: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  expiry: {
    fontSize: 13,
    fontWeight: '600',
  },
});
