/**
 * 냉장고 재료 모듈 (Ingredients Module)
 */

import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService],
})
export class IngredientsModule {}
