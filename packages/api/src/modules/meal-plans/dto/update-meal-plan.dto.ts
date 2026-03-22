/**
 * 식단 수정 요청 DTO
 *
 * PUT /v1/meal-plans/:id 요청 바디
 * 모든 필드가 선택적 (부분 수정 가능)
 */

import { PartialType, PickType } from '@nestjs/swagger';
import { CreateMealPlanDto } from './create-meal-plan.dto';

// CreateMealPlanDto에서 수정 가능한 필드만 선택하고, 모두 Optional로 변환
export class UpdateMealPlanDto extends PartialType(
  PickType(CreateMealPlanDto, ['menuName', 'memo', 'recipeUrl', 'isRecurring', 'recurRule'] as const),
) {}
