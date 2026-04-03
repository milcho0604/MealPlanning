/**
 * 식단 계획 모듈 (Meal Plans Module)
 *
 * UploadModule을 import하여 식단 삭제/수정 시 S3 파일 정리를 수행합니다.
 */

import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [MealPlansController],
  providers: [MealPlansService],
})
export class MealPlansModule {}
