/**
 * 식단 추가/수정 모달 컴포넌트 (MealPlanFormModal)
 *
 * ⚠️ 리팩토링 예정: 849줄 → 5개 파일로 분리
 *
 * 분리 계획:
 * - MealPlanFormModal.tsx         → 모달 껍데기 + 조합 (~200줄)
 * - hooks/useMealPlanForm.hook.ts → 폼 상태 + 유효성 검사 + submit 로직
 * - MealPlanDatePicker.tsx        → 날짜 뱃지 + 미니 캘린더 선택기
 * - MealPlanPhotoSection.tsx      → 사진 선택/업로드/미리보기/삭제
 * - MealPlanRepeatSection.tsx     → 여러 날짜 등록 토글 + 날짜 선택 그리드
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealTemplate, MealType, RecurRule } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { useMealPlanMutation } from '../../hooks/meal-plan/use-meal-plan-mutation.hook';
import { useTemplateMutation } from '../../hooks/template/use-template-mutation.hook';
import { useGroupStore } from '../../stores/group.store';
import { useImageUpload } from '../../hooks/use-image-upload.hook';
import { TemplatePickerModal } from './TemplatePickerModal';
import { colors } from '../../constants/colors';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const RECUR_OPTIONS: { value: RecurRule; label: string }[] = [
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
  /** 복사 모드: 이 식단의 내용을 미리 채움 (새로 생성) */
  copyFrom?: MealPlanWithUser;
}

export function MealPlanFormModal({
  visible,
  onClose,
  date,
  initialMealType = 'breakfast',
  mealPlan,
  copyFrom,
}: MealPlanFormModalProps) {
  const { currentGroupId, groups } = useGroupStore();
  const { createMealPlan, updateMealPlan, isCreating, isUpdating } = useMealPlanMutation();
  const { saveTemplate, isSaving } = useTemplateMutation();
  const {
    imageUri,
    imageUrl,
    uploading,
    error: imageError,
    pickImage,
    takePhoto,
    clearImage,
    setExistingUrl,
  } = useImageUpload({ folder: 'meal-photos' });

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedDate, setSelectedDate] = useState(date);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState(new Date().getMonth() + 1);
  const [menuName, setMenuName] = useState('');
  const [memo, setMemo] = useState('');
  const [caloriesText, setCaloriesText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurRule, setRecurRule] = useState<RecurRule>('custom');
  const [customDates, setCustomDates] = useState<string[]>([]);

  // 템플릿 관련 상태
  const [isTemplatePickerVisible, setIsTemplatePickerVisible] = useState(false);
  /** 템플릿 이름 입력 모달 (Android 대응) */
  const [templateNameModalVisible, setTemplateNameModalVisible] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedDate(mealPlan?.date ?? date);
      setShowDatePicker(false);
      // 복사 모드: 기존 식단 내용을 채우되 새로 생성
      const source = mealPlan ?? copyFrom;
      if (source) {
        setMealType(source.mealType);
        setMenuName(source.menuName);
        setMemo(source.memo ?? '');
        setCaloriesText(source.calories ? String(source.calories) : '');
        setRecipeUrl(source.recipeUrl ?? '');
        if (mealPlan) {
          setIsRecurring(mealPlan.isRecurring);
          setRecurRule((mealPlan.recurRule as RecurRule) ?? 'custom');
          setExistingUrl(mealPlan.photoUrl ?? null);
        } else {
          setIsRecurring(false);
          setRecurRule('custom');
          setCustomDates([]);
          clearImage();
        }
      } else {
        setMealType(initialMealType);
        setMenuName('');
        setMemo('');
        setCaloriesText('');
        setRecipeUrl('');
        setIsRecurring(false);
        setRecurRule('custom');
        setCustomDates([]);
        clearImage();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mealPlan, initialMealType, date]);

  const handleSubmit = async () => {
    if (!menuName.trim()) {
      Alert.alert('입력 오류', '메뉴 이름을 입력해주세요.');
      return;
    }
    const targetGroupId = currentGroupId ?? groups[0]?.id;
    if (!targetGroupId) {
      Alert.alert('오류', '그룹을 먼저 생성해주세요.');
      return;
    }

    try {
      // photoUrl: 새로 업로드한 URL, 삭제한 경우 null, 변경 없으면 기존값 유지
      const photoUrl = imageUrl ?? undefined;
      const calories = caloriesText.trim() ? parseInt(caloriesText.trim(), 10) : undefined;

      if (mealPlan) {
        await updateMealPlan({
          id: mealPlan.id,
          body: {
            mealType,
            menuName: menuName.trim(),
            memo: memo.trim() || undefined,
            recipeUrl: recipeUrl.trim() || undefined,
            calories,
            photoUrl: imageUri === null && mealPlan.photoUrl ? null : photoUrl,
            isRecurring,
            recurRule: isRecurring ? recurRule : undefined,
          },
        });
      } else {
        await createMealPlan({
          groupId: targetGroupId,
          date: selectedDate,
          mealType,
          menuName: menuName.trim(),
          memo: memo.trim() || undefined,
          recipeUrl: recipeUrl.trim() || undefined,
          calories,
          photoUrl,
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

  /** 템플릿 이름을 받아 실제 저장하는 함수 (iOS prompt / Android 모달 공통 사용) */
  const doSaveTemplate = async (templateName: string) => {
    if (!templateName?.trim()) return;
    try {
      await saveTemplate({
        groupId: currentGroupId ?? '',
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

  /** 현재 입력 내용을 템플릿으로 저장 */
  const handleSaveAsTemplate = () => {
    if (!menuName.trim()) {
      Alert.alert('입력 오류', '메뉴 이름을 입력한 후 저장해주세요.');
      return;
    }

    // Alert.prompt는 iOS 전용 — Android/웹에서는 커스텀 모달 사용
    if (typeof Alert.prompt === 'function') {
      Alert.prompt('템플릿 이름', '이 메뉴를 어떤 이름으로 저장할까요?', doSaveTemplate, 'plain-text', menuName.trim());
    } else {
      setTemplateNameInput(menuName.trim());
      setTemplateNameModalVisible(true);
    }
  };

  const isLoading = isCreating || isUpdating || uploading;
  const isEditMode = !!mealPlan;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? '식단 수정' : copyFrom ? '식단 복사' : '식단 추가'}</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={isLoading}>
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* 등록 날짜 표시 (탭하면 캘린더 선택) */}
          <TouchableOpacity
            style={styles.dateBadge}
            onPress={() => {
              const d = new Date(selectedDate + 'T00:00:00');
              setDpYear(d.getFullYear());
              setDpMonth(d.getMonth() + 1);
              setShowDatePicker(!showDatePicker);
            }}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.dateBadgeText}>
              {(() => {
                const d = new Date(selectedDate + 'T00:00:00');
                const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
              })()}
            </Text>
            <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* 미니 캘린더 날짜 선택기 */}
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <View style={styles.dpHeader}>
                <TouchableOpacity onPress={() => {
                  if (dpMonth === 1) { setDpYear(y => y - 1); setDpMonth(12); }
                  else setDpMonth(m => m - 1);
                }}>
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.dpTitle}>{dpYear}년 {dpMonth}월</Text>
                <TouchableOpacity onPress={() => {
                  if (dpMonth === 12) { setDpYear(y => y + 1); setDpMonth(1); }
                  else setDpMonth(m => m + 1);
                }}>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.dpWeekRow}>
                {['일','월','화','수','목','금','토'].map(d => (
                  <Text key={d} style={styles.dpWeekLabel}>{d}</Text>
                ))}
              </View>
              <View style={styles.dpGrid}>
                {(() => {
                  const firstDay = new Date(dpYear, dpMonth - 1, 1).getDay();
                  const lastDay = new Date(dpYear, dpMonth, 0).getDate();
                  const cells: (number | null)[] = [
                    ...Array(firstDay).fill(null),
                    ...Array.from({ length: lastDay }, (_, i) => i + 1),
                  ];
                  const rem = cells.length % 7;
                  if (rem !== 0) cells.push(...Array(7 - rem).fill(null));
                  return cells.map((day, idx) => {
                    if (day === null) return <View key={`e-${idx}`} style={styles.dpCell} />;
                    const dateStr = `${dpYear}-${String(dpMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const isSelected = selectedDate === dateStr;
                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[styles.dpCell, isSelected && styles.dpCellSelected]}
                        onPress={() => { setSelectedDate(dateStr); setShowDatePicker(false); }}
                      >
                        <Text style={[styles.dpDayText, isSelected && styles.dpDayTextSelected]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            </View>
          )}

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
                ]}
                onPress={() => setMealType(type)}
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

          {/* 칼로리 */}
          <Text style={styles.label}>칼로리 (선택)</Text>
          <TextInput
            style={styles.input}
            value={caloriesText}
            onChangeText={(t) => setCaloriesText(t.replace(/[^0-9]/g, ''))}
            placeholder="예: 320"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="next"
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

          {/* 식단 사진 */}
          <Text style={styles.label}>식단 사진 (선택)</Text>
          {imageUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: imageUri, cache: 'force-cache' }} style={styles.photoPreview} />
              {uploading && (
                <View style={styles.photoUploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.photoUploadingText}>업로드 중...</Text>
                </View>
              )}
              <TouchableOpacity style={styles.photoRemoveBtn} onPress={clearImage}>
                <Ionicons name="close-circle" size={26} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtonRow}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={22} color={colors.primary} />
                <Text style={styles.photoBtnText}>갤러리</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={takePhoto}
                disabled={uploading}
              >
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={styles.photoBtnText}>카메라</Text>
              </TouchableOpacity>
            </View>
          )}
          {imageError && (
            <Text style={styles.photoErrorText}>{imageError}</Text>
          )}

          {/* 반복 설정 */}
          <View style={styles.recurRow}>
            <View>
              <Text style={styles.recurTitle}>여러 날짜에 등록</Text>
              <Text style={styles.recurSub}>선택한 날짜에 같은 식단을 한 번에 등록합니다</Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={isRecurring ? colors.primary : '#fff'}
            />
          </View>

          {/* 날짜 선택 UI (여러 날짜 등록 ON일 때 표시) */}
          {isRecurring && (
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
      </SafeAreaView>

      {/* 템플릿 선택 모달 */}
      <TemplatePickerModal
        visible={isTemplatePickerVisible}
        onClose={() => setIsTemplatePickerVisible(false)}
        onSelect={handleTemplateSelect}
      />

      {/* 템플릿 이름 입력 모달 (Android/웹 대응) */}
      <Modal
        visible={templateNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTemplateNameModalVisible(false)}
      >
        <View style={styles.tplOverlay}>
          <View style={styles.tplBox}>
            <Text style={styles.tplTitle}>템플릿 이름</Text>
            <Text style={styles.tplDesc}>이 메뉴를 어떤 이름으로 저장할까요?</Text>
            <TextInput
              style={styles.tplInput}
              value={templateNameInput}
              onChangeText={setTemplateNameInput}
              autoFocus
              placeholder="템플릿 이름"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.tplButtons}>
              <TouchableOpacity
                style={styles.tplCancelBtn}
                onPress={() => { setTemplateNameModalVisible(false); setTemplateNameInput(''); }}
              >
                <Text style={styles.tplCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tplConfirmBtn}
                onPress={() => {
                  if (!templateNameInput.trim()) return;
                  setTemplateNameModalVisible(false);
                  doSaveTemplate(templateNameInput.trim());
                  setTemplateNameInput('');
                }}
              >
                <Text style={styles.tplConfirmText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  mealTypeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  mealTypeBtnDisabled: { opacity: 0.6 },
  mealTypeBtnText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  mealTypeBtnTextActive: { color: colors.primary, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
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
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  recurRuleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
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
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
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
    backgroundColor: colors.primaryLight,
  },
  dateChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  // ── 등록 날짜 뱃지 ──────────────────────────────────────────
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  dateBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  // ── 날짜 선택 캘린더 ──────────────────────────────────────
  datePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  dpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  dpWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dpWeekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dpCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  dpCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  dpDayText: {
    fontSize: 13,
    color: colors.text,
  },
  dpDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  // ── 식단 사진 ─────────────────────────────────────────────
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photoUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  photoUploadingText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 13,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  photoErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
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
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  templateBtnDisabled: { opacity: 0.5 },
  templateBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  // ── 템플릿 이름 입력 모달 (Android) ──────────────────────
  tplOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tplBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
  },
  tplTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  tplDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  tplInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 20,
  },
  tplButtons: { flexDirection: 'row', gap: 10 },
  tplCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tplCancelText: { fontSize: 15, color: colors.textSecondary },
  tplConfirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tplConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
