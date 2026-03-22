/**
 * 재료 추가/수정 모달 컴포넌트 (IngredientFormModal)
 *
 * 재료를 새로 추가하거나 기존 재료를 수정할 때 사용합니다.
 * - 재료명, 카테고리, 수량, 단위, 유통기한 입력
 *
 * Props:
 * - visible: 모달 표시 여부
 * - onClose: 닫기 콜백
 * - ingredient: 수정할 기존 재료 (없으면 추가 모드)
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
import {
  INGREDIENT_CATEGORY_LABELS,
} from '@mealplan/shared';
import type { Ingredient, IngredientCategory, IngredientUnit } from '@mealplan/shared';
import { useIngredientMutation } from '../../hooks/ingredient/use-ingredient-mutation.hook';
import { useGroupStore } from '../../stores/group.store';
import { colors } from '../../constants/colors';

/** 선택 가능한 카테고리 목록 */
const CATEGORIES = Object.keys(INGREDIENT_CATEGORY_LABELS) as IngredientCategory[];

/** 선택 가능한 단위 목록 */
const UNITS: IngredientUnit[] = ['g', 'kg', 'ml', 'L', '개', '봉', '팩', '캔'];

interface IngredientFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** 수정 모드일 때 기존 재료 데이터 */
  ingredient?: Ingredient;
}

export function IngredientFormModal({ visible, onClose, ingredient }: IngredientFormModalProps) {
  const { currentGroupId } = useGroupStore();
  const { createIngredient, updateIngredient, isCreating, isUpdating } = useIngredientMutation();

  // ── 폼 상태 ─────────────────────────────────────────────
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory | ''>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<IngredientUnit | ''>('');
  const [expiryDate, setExpiryDate] = useState(''); // YYYY-MM-DD

  /** 모달이 열릴 때마다 폼 초기화 */
  useEffect(() => {
    if (visible) {
      if (ingredient) {
        setName(ingredient.name);
        setCategory(ingredient.category ?? '');
        setQuantity(ingredient.quantity != null ? String(ingredient.quantity) : '');
        setUnit(ingredient.unit ?? '');
        setExpiryDate(ingredient.expiryDate ?? '');
      } else {
        setName('');
        setCategory('');
        setQuantity('');
        setUnit('');
        setExpiryDate('');
      }
    }
  }, [visible, ingredient]);

  /** 유통기한 입력 자동 포맷 (숫자 입력 → YYYY-MM-DD) */
  const handleExpiryChange = (text: string) => {
    // 숫자만 추출
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    if (digits.length > 6) formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    setExpiryDate(formatted);
  };

  /** 저장 처리 */
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('입력 오류', '재료 이름을 입력해주세요.');
      return;
    }
    if (!currentGroupId) {
      Alert.alert('오류', '그룹을 선택해주세요.');
      return;
    }

    // 유통기한 형식 검증 (입력한 경우에만)
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert('입력 오류', '유통기한을 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }

    try {
      const body = {
        name: name.trim(),
        category: category || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit || undefined,
        expiryDate: expiryDate || undefined,
      };

      if (ingredient) {
        await updateIngredient({ id: ingredient.id, body });
      } else {
        await createIngredient({ ...body, groupId: currentGroupId });
      }
      onClose();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const isLoading = isCreating || isUpdating;
  const isEditMode = !!ingredient;

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
            {isEditMode ? '재료 수정' : '재료 추가'}
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
          {/* 재료명 */}
          <Text style={styles.label}>재료 이름 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 돼지고기, 당근, 우유"
            placeholderTextColor={colors.textSecondary}
            maxLength={30}
          />

          {/* 카테고리 선택 */}
          <Text style={styles.label}>카테고리</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(category === cat ? '' : cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {INGREDIENT_CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 수량 */}
          <Text style={styles.label}>수량</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="예: 500"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={7}
          />

          {/* 단위 선택 */}
          <Text style={styles.label}>단위</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                onPress={() => setUnit(unit === u ? '' : u)}
              >
                <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 유통기한 */}
          <Text style={styles.label}>유통기한</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={handleExpiryChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={10}
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
  headerBtn: { minWidth: 60 },
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
  disabledText: { opacity: 0.4 },
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
  // ── 카테고리 칩 (가로 스크롤) ────────────────────────────
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  // ── 단위 버튼 그리드 ─────────────────────────────────────
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  unitBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  unitBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unitBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
