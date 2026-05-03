/**
 * 식단 추가/수정 모달 (MealPlanFormModal)
 *
 * 폼 로직: useMealPlanForm
 * 날짜 선택: MealPlanDatePicker
 * 사진 업로드: MealPlanPhotoSection
 * 여러 날짜 등록: MealPlanRepeatSection
 */

import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_TYPE_LABELS } from '@mealplan/shared';
import type { MealType } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { useMealPlanForm } from '../../hooks/meal-plan/use-meal-plan-form.hook';
import { MealPlanDatePicker } from './MealPlanDatePicker';
import { MealPlanPhotoSection } from './MealPlanPhotoSection';
import { MealPlanRepeatSection } from './MealPlanRepeatSection';
import { TemplatePickerModal } from './TemplatePickerModal';
import { colors } from '../../constants/colors';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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
  const {
    mealType, setMealType,
    selectedDate, setSelectedDate,
    menuName, setMenuName,
    memo, setMemo,
    caloriesText, setCaloriesText,
    recipeUrl, setRecipeUrl,
    isRecurring, setIsRecurring,
    customDates, setCustomDates,
    imageUpload,
    isTemplatePickerVisible, setIsTemplatePickerVisible,
    templateNameModalVisible, setTemplateNameModalVisible,
    templateNameInput, setTemplateNameInput,
    handleSubmit,
    handleTemplateSelect,
    doSaveTemplate,
    handleSaveAsTemplate,
    isLoading,
    isSaving,
    isEditMode,
  } = useMealPlanForm({ visible, date, initialMealType, mealPlan, copyFrom, onClose });

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
            <Text style={styles.headerTitle}>
              {isEditMode ? '식단 수정' : copyFrom ? '식단 복사' : '식단 추가'}
            </Text>
            <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={isLoading}>
              <Text style={[styles.saveText, isLoading && styles.disabledText]}>
                {isLoading ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* 날짜 선택 */}
            <MealPlanDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />

            {/* 템플릿 버튼 (추가 모드에서만) */}
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

            {/* 식사 유형 */}
            <Text style={styles.label}>식사 유형</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealTypeBtn, mealType === type && styles.mealTypeBtnActive]}
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

            {/* 사진 */}
            <Text style={styles.label}>식단 사진 (선택)</Text>
            <MealPlanPhotoSection
              imageUri={imageUpload.imageUri}
              uploading={imageUpload.uploading}
              error={imageUpload.error}
              onPick={imageUpload.pickImage}
              onTakePhoto={imageUpload.takePhoto}
              onClear={imageUpload.clearImage}
            />

            {/* 여러 날짜 등록 */}
            <MealPlanRepeatSection
              isRecurring={isRecurring}
              onToggle={setIsRecurring}
              customDates={customDates}
              onCustomDatesChange={setCustomDates}
              baseDate={date}
            />

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

      {/* 템플릿 이름 입력 모달 (Android 대응) */}
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
  templateRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 4 },
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
  // ── 템플릿 이름 입력 모달 ─────────────────────────────────
  tplOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tplBox: { width: '100%', backgroundColor: colors.background, borderRadius: 16, padding: 24 },
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
