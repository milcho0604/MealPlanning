/**
 * 식단 추가/수정 폼 상태 훅 (useMealPlanForm)
 *
 * MealPlanFormModal의 모든 폼 상태, 유효성 검사, submit/template 로직을 담당합니다.
 */

import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { MealTemplate, MealType, RecurRule } from '@mealplan/shared';
import type { MealPlanWithUser } from '../../services/meal-plan.service';
import { useMealPlanMutation } from './use-meal-plan-mutation.hook';
import { useTemplateMutation } from '../template/use-template-mutation.hook';
import { useGroupStore } from '../../stores/group.store';
import { useImageUpload } from '../use-image-upload.hook';

interface UseMealPlanFormOptions {
  visible: boolean;
  date: string;
  initialMealType?: MealType;
  mealPlan?: MealPlanWithUser;
  copyFrom?: MealPlanWithUser;
  onClose: () => void;
}

export function useMealPlanForm({
  visible,
  date,
  initialMealType = 'breakfast',
  mealPlan,
  copyFrom,
  onClose,
}: UseMealPlanFormOptions) {
  const { currentGroupId, groups } = useGroupStore();
  const { createMealPlan, updateMealPlan, isCreating, isUpdating } = useMealPlanMutation();
  const { saveTemplate, isSaving } = useTemplateMutation();
  const imageUpload = useImageUpload({ folder: 'meal-photos' });
  const isSubmittingRef = useRef(false);

  // ── 폼 상태 ───────────────────────────────────────────────
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [selectedDate, setSelectedDate] = useState(date);
  const [menuName, setMenuName] = useState('');
  const [memo, setMemo] = useState('');
  const [caloriesText, setCaloriesText] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurRule, setRecurRule] = useState<RecurRule>('custom');
  const [customDates, setCustomDates] = useState<string[]>([]);

  // ── 템플릿 상태 ───────────────────────────────────────────
  const [isTemplatePickerVisible, setIsTemplatePickerVisible] = useState(false);
  const [templateNameModalVisible, setTemplateNameModalVisible] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (!visible) return;
    setSelectedDate(mealPlan?.date ?? date);
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
        imageUpload.setExistingUrl(mealPlan.photoUrl ?? null);
      } else {
        setIsRecurring(false);
        setRecurRule('custom');
        setCustomDates([]);
        imageUpload.clearImage();
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
      imageUpload.clearImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mealPlan, initialMealType, date]);

  /** 저장 */
  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (!menuName.trim()) {
      Alert.alert('입력 오류', '메뉴 이름을 입력해주세요.');
      return;
    }
    const targetGroupId = currentGroupId ?? groups[0]?.id;
    if (!targetGroupId) {
      Alert.alert('오류', '그룹을 먼저 생성해주세요.');
      return;
    }
    isSubmittingRef.current = true;
    try {
      const photoUrl = imageUpload.imageUrl ?? undefined;
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
            photoUrl: imageUpload.imageUri === null && mealPlan.photoUrl ? null : photoUrl,
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
    } finally {
      isSubmittingRef.current = false;
    }
  };

  /** 템플릿 선택 → 폼 자동 채우기 */
  const handleTemplateSelect = (template: MealTemplate) => {
    setMealType(template.mealType);
    setMenuName(template.menuName);
    setMemo(template.memo ?? '');
    setRecipeUrl(template.recipeUrl ?? '');
  };

  /** 템플릿 저장 실행 */
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

  /** 현재 입력 내용을 템플릿으로 저장 (iOS: prompt, Android: 커스텀 모달) */
  const handleSaveAsTemplate = () => {
    if (!menuName.trim()) {
      Alert.alert('입력 오류', '메뉴 이름을 입력한 후 저장해주세요.');
      return;
    }
    if (Platform.OS === 'ios') {
      Alert.prompt!('템플릿 이름', '이 메뉴를 어떤 이름으로 저장할까요?',
        (name) => { if (name?.trim()) doSaveTemplate(name.trim()); },
        'plain-text', menuName.trim());
    } else {
      setTemplateNameInput(menuName.trim());
      setTemplateNameModalVisible(true);
    }
  };

  return {
    // 폼 상태
    mealType, setMealType,
    selectedDate, setSelectedDate,
    menuName, setMenuName,
    memo, setMemo,
    caloriesText, setCaloriesText,
    recipeUrl, setRecipeUrl,
    isRecurring, setIsRecurring,
    recurRule, setRecurRule,
    customDates, setCustomDates,
    // 이미지
    imageUpload,
    // 템플릿
    isTemplatePickerVisible, setIsTemplatePickerVisible,
    templateNameModalVisible, setTemplateNameModalVisible,
    templateNameInput, setTemplateNameInput,
    // 핸들러
    handleSubmit,
    handleTemplateSelect,
    doSaveTemplate,
    handleSaveAsTemplate,
    // 로딩 상태
    isLoading: isCreating || isUpdating || imageUpload.uploading,
    isSaving,
    isEditMode: !!mealPlan,
  };
}
