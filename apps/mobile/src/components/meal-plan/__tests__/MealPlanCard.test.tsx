/**
 * MealPlanCard 컴포넌트 단위 테스트
 *
 * 식단 카드 컴포넌트의 렌더링, 사용자 상호작용, 콜백 호출을 검증합니다.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert, TouchableOpacity } from 'react-native';
import { MealPlanCard } from '../MealPlanCard';
import type { MealPlanWithUser } from '../../../services/meal-plan.service';

// ── Mock 설정 ──────────────────────────────────────────────────────────────────

/**
 * @expo/vector-icons mock
 * Ionicons가 테스트 환경에서 실제 아이콘 폰트를 로드하지 않도록 합니다.
 */
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

/**
 * @mealplan/shared mock
 * 식사 유형 레이블 매핑을 제공합니다.
 */
jest.mock('@mealplan/shared', () => ({
  MEAL_TYPE_LABELS: {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
  },
}));

// ── Mock 데이터 ────────────────────────────────────────────────────────────────

/** 테스트용 식단 데이터 */
const mockMealPlan: MealPlanWithUser = {
  id: 'meal-plan-uuid-1',
  groupId: 'group-uuid-1',
  createdBy: 'user-uuid-1',
  date: '2025-03-24',
  mealType: 'lunch',
  menuName: '비빔밥',
  memo: '맛있는 점심',
  recipeUrl: null,
  calories: null,
  photoUrl: null,
  isRecurring: false,
  recurRule: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  createdByUser: {
    id: 'user-uuid-1',
    name: '테스트 유저',
    avatarUrl: null,
  },
};

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('MealPlanCard 컴포넌트', () => {
  // Alert.alert를 mock으로 교체하여 실제 대화상자 표시를 방지
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── 렌더링 테스트 ─────────────────────────────────────────────────────────────

  it('식단 메뉴 이름이 화면에 렌더링되어야 한다', () => {
    // given
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    // when
    const { getByText } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    // then
    expect(getByText('비빔밥')).toBeTruthy();
  });

  it('식단 메모가 있으면 화면에 렌더링되어야 한다', () => {
    // given & when
    const { getByText } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // then
    expect(getByText('맛있는 점심')).toBeTruthy();
  });

  it('식사 유형 뱃지(점심)가 렌더링되어야 한다', () => {
    // given & when
    const { getByText } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // then
    expect(getByText('점심')).toBeTruthy();
  });

  it('등록자 이름이 화면에 렌더링되어야 한다', () => {
    // given & when
    const { getByText } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // then
    expect(getByText('테스트 유저 등록')).toBeTruthy();
  });

  // ── 상호작용 테스트 ───────────────────────────────────────────────────────────

  it('수정 버튼 클릭 시 onEdit 콜백이 식단 데이터와 함께 호출되어야 한다', () => {
    // given
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    // when: 첫 번째 TouchableOpacity(수정 버튼) 클릭
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);

    // then
    expect(onEdit).toHaveBeenCalledWith(mockMealPlan);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('삭제 버튼 클릭 시 Alert.alert가 호출되어야 한다', () => {
    // given
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    // when: 두 번째 TouchableOpacity(삭제 버튼) 클릭
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]);

    // then: 삭제 확인 다이얼로그 표시
    expect(Alert.alert).toHaveBeenCalledWith(
      '식단 삭제',
      expect.stringContaining('비빔밥'),
      expect.any(Array),
    );
  });

  it('삭제 확인 다이얼로그에서 "삭제" 선택 시 onDelete가 호출되어야 한다', () => {
    // given
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    // Alert.alert mock을 커스터마이징하여 "삭제" 버튼 자동 실행
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      // "삭제" 옵션(destructive)의 onPress 콜백 실행
      const deleteButton = buttons?.find((btn) => btn.style === 'destructive');
      deleteButton?.onPress?.();
    });

    const { UNSAFE_getAllByType } = render(
      <MealPlanCard
        mealPlan={mockMealPlan}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    // when: 두 번째 TouchableOpacity(삭제 버튼) 클릭
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]);

    // then
    expect(onDelete).toHaveBeenCalledWith(mockMealPlan.id);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
