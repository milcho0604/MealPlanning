/**
 * 식단 추가/수정 모달 컴포넌트 (MealPlanFormModal)
 *
 * 식단을 새로 추가하거나 기존 식단을 수정할 때 사용합니다.
 * - 추가 모드: mealPlan props 없이 날짜(date)와 초기 식사 유형(initialMealType)만 전달
 * - 수정 모드: mealPlan props에 기존 식단 데이터를 전달
 *
 * Props:
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - date: 식단 날짜 (YYYY-MM-DD)
 * - initialMealType: 초기 식사 유형 (추가 모드에서 선택된 탭 등)
 * - mealPlan: 수정할 기존 식단 (없으면 추가 모드)
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealType } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { useMealPlanMutation } from '../../hooks/meal-plan/use-meal-plan-mutation.hook';
import { useGroupStore } from '../../stores/group.store';
import { colors } from '../../constants/colors';

/** 선택 가능한 식사 유형 목록 (순서 고정) */
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface MealPlanFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** 식단 날짜 (YYYY-MM-DD) */
  date: string;
  /** 추가 모드에서 기본 선택될 식사 유형 */
  initialMealType?: MealType;
  /** 수정 모드일 때 기존 식단 데이터 */
  mealPlan?: MealPlanWithUser;
}

export function MealPlanFormModal({
  visible,
  onClose,
  date,
  initialMealType = 'breakfast',
  mealPlan,
}: MealPlanFormModalProps) {
  const { currentGroupId } = useGroupStore();
  const { createMealPlan, updateMealPlan, isCreating, isUpdating } = useMealPlanMutation();

  // ── 폼 상태 ────────────────────────────────────────────
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [menuName, setMenuName] = useState('');
  const [memo, setMemo] = useState('');

  /** 모달이 열릴 때마다 폼을 초기화 (수정 모드면 기존 데이터로 채움) */
  useEffect(() => {
    if (visible) {
      if (mealPlan) {
        // 수정 모드
        setMealType(mealPlan.mealType);
        setMenuName(mealPlan.menuName);
        setMemo(mealPlan.memo ?? '');
      } else {
        // 추가 모드
        setMealType(initialMealType);
        setMenuName('');
        setMemo('');
      }
    }
  }, [visible, mealPlan, initialMealType]);

  /** 저장 처리 */
  const handleSubmit = async () => {
    if (!menuName.trim()) {
      Alert.alert('입력 오류', '메뉴 이름을 입력해주세요.');
      return;
    }
    if (!currentGroupId) {
      Alert.alert('오류', '그룹을 선택해주세요.');
      return;
    }

    try {
      if (mealPlan) {
        // 수정 모드
        await updateMealPlan({
          id: mealPlan.id,
          body: { menuName: menuName.trim(), memo: memo.trim() || undefined },
        });
      } else {
        // 추가 모드
        await createMealPlan({
          groupId: currentGroupId,
          date,
          mealType,
          menuName: menuName.trim(),
          memo: memo.trim() || undefined,
        });
      }
      onClose();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const isLoading = isCreating || isUpdating;
  const isEditMode = !!mealPlan;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? '식단 수정' : '식단 추가'}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerBtn}
            disabled={isLoading}
          >
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* 식사 유형 선택 (추가 모드에서만 변경 가능) */}
          <Text style={styles.label}>식사 유형</Text>
          <View style={styles.mealTypeRow}>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mealTypeBtn,
                  mealType === type && styles.mealTypeBtnActive,
                  isEditMode && styles.mealTypeBtnDisabled,
                ]}
                onPress={() => !isEditMode && setMealType(type)}
                disabled={isEditMode}
              >
                <Text
                  style={[
                    styles.mealTypeBtnText,
                    mealType === type && styles.mealTypeBtnTextActive,
                  ]}
                >
                  {MEAL_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 메뉴 이름 입력 */}
          <Text style={styles.label}>메뉴 이름 *</Text>
          <TextInput
            style={styles.input}
            value={menuName}
            onChangeText={setMenuName}
            placeholder="예: 된장찌개, 삼겹살구이"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
            returnKeyType="next"
          />

          {/* 메모 입력 */}
          <Text style={styles.label}>메모 (선택)</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="레시피 메모, 재료 등을 입력하세요"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── 헤더 ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
  },
  disabledText: {
    opacity: 0.4,
  },
  // ── 폼 본문 ─────────────────────────────────────────────
  body: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ── 식사 유형 선택 버튼 ──────────────────────────────────
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  mealTypeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  mealTypeBtnDisabled: {
    opacity: 0.6,
  },
  mealTypeBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  mealTypeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  // ── 텍스트 입력 ─────────────────────────────────────────
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  memoInput: {
    height: 100,
    paddingTop: 12,
  },
});
