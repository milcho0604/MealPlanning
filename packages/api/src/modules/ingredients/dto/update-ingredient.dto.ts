/**
 * 냉장고 재료 수정 요청 DTO
 * 모든 필드 선택적
 */

import { PartialType, PickType } from '@nestjs/swagger';
import { CreateIngredientDto } from './create-ingredient.dto';

export class UpdateIngredientDto extends PartialType(
  PickType(CreateIngredientDto, ['name', 'quantity', 'unit', 'category', 'expiryDate'] as const),
) {}
