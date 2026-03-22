import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export class CreateMealTemplateDto {
  @IsString()
  groupId: string;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
  mealType: MealType;

  @IsString()
  @MaxLength(100)
  menuName: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  memo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  recipeUrl?: string;
}
