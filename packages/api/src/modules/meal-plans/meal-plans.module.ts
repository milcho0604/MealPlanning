/**
 * 식단 계획 모듈 (Meal Plans Module)
 */

import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';

@Module({
  controllers: [MealPlansController],
  providers: [MealPlansService],
})
export class MealPlansModule {}
