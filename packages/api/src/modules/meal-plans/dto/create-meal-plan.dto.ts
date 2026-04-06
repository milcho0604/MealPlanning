/**
 * 식단 생성 요청 DTO
 *
 * POST /v1/meal-plans 요청 바디 유효성 검사
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import type { MealType, RecurRule } from '@mealplan/shared';

export class CreateMealPlanDto {
  @ApiProperty({ example: 'uuid-group-id', description: '그룹 ID' })
  @IsString()
  groupId: string;

  @ApiProperty({ example: '2026-03-22', description: '식단 날짜 (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    description: '식사 유형',
  })
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
  mealType: MealType;

  @ApiProperty({ example: '된장찌개', description: '메뉴 이름' })
  @IsString()
  @MinLength(1, { message: '메뉴 이름을 입력해주세요.' })
  menuName: string;

  @ApiPropertyOptional({ example: '두부 많이 넣기', description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({
    example: 'https://recipe.com/...',
    description: '레시피 URL',
  })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식을 입력해주세요.' })
  recipeUrl?: string;

  @ApiPropertyOptional({ example: 320, description: '칼로리 (kcal)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  calories?: number;

  @ApiPropertyOptional({ description: '식단 사진 URL' })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식을 입력해주세요.' })
  photoUrl?: string;

  @ApiPropertyOptional({ example: false, description: '반복 여부' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: ['weekly', 'monthly', 'custom'],
    description: '반복 규칙',
  })
  @IsOptional()
  @IsEnum(['weekly', 'monthly', 'custom'])
  recurRule?: RecurRule;

  @ApiPropertyOptional({
    example: ['2026-04-01', '2026-04-05'],
    description: '특정 날짜 반복 시 추가 등록할 날짜 목록',
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  dates?: string[];
}
