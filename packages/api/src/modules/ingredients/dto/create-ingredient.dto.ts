/**
 * 냉장고 재료 생성 요청 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import type { IngredientCategory, IngredientUnit } from '@mealplan/shared';

export class CreateIngredientDto {
  @ApiProperty({ example: 'uuid-group-id' })
  @IsString()
  groupId: string;

  @ApiProperty({ example: '삼겹살' })
  @IsString()
  @MinLength(1, { message: '재료 이름을 입력해주세요.' })
  name: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional({ enum: ['g', 'kg', 'ml', 'L', '개', '봉', '팩', '캔'] })
  @IsOptional()
  @IsEnum(['g', 'kg', 'ml', 'L', '개', '봉', '팩', '캔'])
  unit?: IngredientUnit;

  @ApiPropertyOptional({ enum: ['meat', 'vegetable', 'dairy', 'seafood', 'grain', 'sauce', 'frozen', 'other'] })
  @IsOptional()
  @IsEnum(['meat', 'vegetable', 'dairy', 'seafood', 'grain', 'sauce', 'frozen', 'other'])
  category?: IngredientCategory;

  @ApiPropertyOptional({ example: '2026-04-01', description: '유통기한 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
