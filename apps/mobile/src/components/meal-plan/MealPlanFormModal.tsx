/**
 * 식단 추가/수정 모달 컴포넌트 (MealPlanFormModal)
 *
 * 식단을 새로 추가하거나 기존 식단을 수정할 때 사용합니다.
 * - 추가 모드: mealPlan props 없이 날짜(date)와 초기 식사 유형(initialMealType)만 전달
 * - 수정 모드: mealPlan props에 기존 식단 데이터를 전달
 *
 * Phase 2 추가:
 * - 반복 설정: 매주 / 매월 반복 토글
 * - 레시피 URL 입력 필드
 *
 * Phase 2 (템플릿):
 * - 템플릿에서 불러오기 버튼 → TemplatePickerModal
 * - 현재 입력 내용을 템플릿으로 저장 버튼
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealTemplate, MealType, RecurRule } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { useMealPlanMutation } from '../../hooks/meal-plan/use-meal-plan-mutation.hook';
import { useTemplateMutation } from '../../hooks/template/use-template-mutation.hook';
import { useGroupStore } from '../../stores/group.store';
import { TemplatePickerModal } from './TemplatePickerModal';
import { colors } from '../../constants/colors';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const RECUR_OPTIONS: { value: RecurRule; label: string }[] = [
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
  { value: 'custom', label: '날짜 선택' },
];

/** 간단한 날짜 포맷 (M/D 요일) */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

/** 다음 30일 날짜 목록 생성 */
function getNext30Days(baseDate: string): string[] {
  const dates: string[] = [];
  const base = new Date(baseDate + 'T00:00:00');
  for (let i = 1; i <= 30; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${d.getFullYear()}-${mm}-${dd}`);
  }
  return dates;
}

interface MealPlanFormModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  initialMealType?: MealType;
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
  const { saveTemplate, isSaving } = useTemplateMutation();

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [menuName, setMenuName] = useState('');
  const [memo, setMemo] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurRule, setRecurRule] = useState<RecurRule>('weekly');
  const [customDates, setCustomDates] = useState<string[]>([]);

  // 템플릿 관련 상태
  const [isTemplatePickerVisible, setIsTemplatePickerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mealPlan) {
        setMealType(mealPlan.mealType);
        setMenuName(mealPlan.menuName);
        setMemo(mealPlan.memo ?? '');
        setRecipeUrl(mealPlan.recipeUrl ?? '');
        setIsRecurring(mealPlan.isRecurring);
        setRecurRule((mealPlan.recurRule as RecurRule) ?? 'weekly');
      } else {
        setMealType(initialMealType);
        setMenuName('');
        setMemo('');
        setRecipeUrl('');
        setIsRecurring(false);
        setRecurRule('weekly');
        setCustomDates([]);
      }
    }
  }, [visible, mealPlan, initialMealType]);

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
        await updateMealPlan({
          id: mealPlan.id,
          body: {
            menuName: menuName.trim(),
            memo: memo.trim() || undefined,
            recipeUrl: recipeUrl.trim() || undefined,
            isRecurring,
            recurRule: isRecurring ? recurRule : undefined,
          },
        });
      } else {
        await createMealPlan({
          groupId: currentGroupId,
          date,
          mealType,
          menuName: menuName.trim(),
          memo: memo.trim() || undefined,
          recipeUrl: recipeUrl.trim() || undefined,
          isRecurring,
          recurRule: isRecurring ? recurRule : undefined,
          dates: isRecurring && recurRule === 'custom' && customDates.length > 0 ? customDates : undefined,
        });
      }
      onClose();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  /** 템플릿 선택 → 폼 자동 채우기 */
  const handleTemplateSelect = (template: MealTemplate) => {
    setMealType(template.mealType);
    setMenuName(template.menuName);
    setMemo(template.memo ?? '');
    setRecipeUrl(template.recipeUrl ?? '');
  };

  /** 현재 입력 내용을 템플릿으로 저장 */
  const handleSaveAsTemplate = () => {
    if (!menuName.trim()) {
      Alert.alert('입력 오류', '메뉴 이름을 입력한 후 저장해주세요.');
      return;
    }

    const doSave = async (templateName: string) => {
      if (!templateName?.trim()) return;
      try {
        await saveTemplate({
          groupId: currentGroupId!,
          name: templateName.trim(),
          mealType,
          menuName: menuName.trim(),
          memo: memo.trim() || undefined,
          recipeUrl: recipeUrl.trim() || undefined,
        });
        Alert.alert('저장 완료', `"${templateName.trim()}" 템플릿이 저장되었습니다.`);
      } catch {
        Alert.alert('오류', '템플릿 저장에 실패했습니다.');
      }
    };

    // Alert.prompt는 iOS 전용 — 웹에서는 브라우저 prompt 사용
    if (typeof Alert.prompt === 'function') {
      Alert.prompt('템플릿 이름', '이 메뉴를 어떤 이름으로 저장할까요?', doSave, 'plain-text', menuName.trim());
    } else {
      const name = window.prompt('템플릿 이름을 입력하세요', menuName.trim());
      if (name) doSave(name);
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
          <Text style={styles.headerTitle}>{isEditMode ? '식단 수정' : '식단 추가'}</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={isLoading}>
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* 템플릿 버튼 영역 (추가 모드에서만 표시) */}
          {!isEditMode && (
            <View style={styles.templateRow}>
              <TouchableOpacity
                style={styles.templateBtn}
                onPress={() => setIsTemplatePickerVisible(true)}
              >
                <Ionicons name="bookmark-outline" size={15} color={colors.primary} />
                <Text style={styles.templateBtnText}>불러오기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.templateBtn, isSaving && styles.templateBtnDisabled]}
                onPress={handleSaveAsTemplate}
                disabled={isSaving}
              >
                <Ionicons name="save-outline" size={15} color={colors.primary} />
                <Text style={styles.templateBtnText}>
                  {isSaving ? '저장 중...' : '템플릿으로 저장'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 식사 유형 선택 */}
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
                <Text style={[styles.mealTypeBtnText, mealType === type && styles.mealTypeBtnTextActive]}>
                  {MEAL_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 메뉴 이름 */}
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

          {/* 메모 */}
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

          {/* 레시피 URL */}
          <Text style={styles.label}>레시피 URL (선택)</Text>
          <TextInput
            style={styles.input}
            value={recipeUrl}
            onChangeText={setRecipeUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
            maxLength={500}
          />

          {/* 반복 설정 */}
          <View style={styles.recurRow}>
            <View>
              <Text style={styles.recurTitle}>반복 식단</Text>
              <Text style={styles.recurSub}>매주 또는 매월 자동으로 반복됩니다</Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={isRecurring ? colors.primary : '#fff'}
            />
          </View>

          {/* 반복 규칙 선택 (반복 ON일 때만 표시) */}
          {isRecurring && (
            <View style={styles.recurRuleRow}>
              {RECUR_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.recurRuleBtn, recurRule === opt.value && styles.recurRuleBtnActive]}
                  onPress={() => { setRecurRule(opt.value); if (opt.value !== 'custom') setCustomDates([]); }}
                >
                  <Text style={[styles.recurRuleBtnText, recurRule === opt.value && styles.recurRuleBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 특정 날짜 선택 UI (custom 선택 시) */}
          {isRecurring && recurRule === 'custom' && (
            <View style={styles.customDatesSection}>
              <Text style={styles.customDatesLabel}>
                추가할 날짜를 선택하세요 ({customDates.length}개 선택됨)
              </Text>
              {/* 선택된 날짜 태그 */}
              {customDates.length > 0 && (
                <View style={styles.selectedDatesRow}>
                  {customDates.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.selectedDateTag}
                      onPress={() => setCustomDates((prev) => prev.filter((x) => x !== d))}
                    >
                      <Text style={styles.selectedDateTagText}>{formatShortDate(d)}</Text>
                      <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {/* 날짜 선택 그리드 (다음 30일) */}
              <View style={styles.dateGrid}>
                {getNext30Days(date).map((d) => {
                  const isChosen = customDates.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dateChip, isChosen && styles.dateChipSelected]}
                      onPress={() => {
                        setCustomDates((prev) =>
                          isChosen ? prev.filter((x) => x !== d) : [...prev, d],
                        );
                      }}
                    >
                      <Text style={[styles.dateChipText, isChosen && styles.dateChipTextSelected]}>
                        {formatShortDate(d)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 템플릿 선택 모달 */}
      <TemplatePickerModal
        visible={isTemplatePickerVisible}
        onClose={() => setIsTemplatePickerVisible(false)}
        onSelect={handleTemplateSelect}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
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
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cancelText: { fontSize: 16, color: colors.textSecondary },
  saveText: { fontSize: 16, fontWeight: '600', color: colors.primary, textAlign: 'right' },
  disabledText: { opacity: 0.4 },
  body: { flex: 1, padding: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealTypeRow: { flexDirection: 'row', gap: 8 },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  mealTypeBtnActive: { borderColor: colors.primary, backgroundColor: '#E8F5E9' },
  mealTypeBtnDisabled: { opacity: 0.6 },
  mealTypeBtnText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  mealTypeBtnTextActive: { color: colors.primary, fontWeight: '700' },
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
  memoInput: { height: 100, paddingTop: 12 },
  // ── 반복 설정 ─────────────────────────────────────────────
  recurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recurTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  recurSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  recurRuleRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  recurRuleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  recurRuleBtnActive: { borderColor: colors.primary, backgroundColor: '#E8F5E9' },
  recurRuleBtnText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  recurRuleBtnTextActive: { color: colors.primary, fontWeight: '700' },
  // ── 특정 날짜 선택 ──────────────────────────────────────────
  customDatesSection: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customDatesLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  selectedDatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  selectedDateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  selectedDateTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  dateChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  dateChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // ── 템플릿 버튼 ───────────────────────────────────────────
  templateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  templateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  templateBtnDisabled: { opacity: 0.5 },
  templateBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
