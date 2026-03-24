/**
 * 식단 템플릿 컨트롤러 (Meal Templates Controller)
 *
 * 엔드포인트:
 * - GET    /meal-templates?groupId=xxx    목록 조회
 * - POST   /meal-templates               템플릿 저장
 * - DELETE /meal-templates/:id           템플릿 삭제
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MealTemplatesService } from './meal-templates.service';
import { CreateMealTemplateDto } from './dto/create-meal-template.dto';
import { GetMealTemplatesDto } from './dto/get-meal-templates.dto';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@Controller('meal-templates')
@UseGuards(JwtAuthGuard)
export class MealTemplatesController {
  constructor(private readonly mealTemplatesService: MealTemplatesService) {}

  /** 템플릿 목록 조회 */
  @Get()
  findAll(
    @Query() query: GetMealTemplatesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.mealTemplatesService.findAll(query.groupId, user.id);
  }

  /** 템플릿 저장 */
  @Post()
  create(@Body() dto: CreateMealTemplateDto, @CurrentUser() user: RequestUser) {
    return this.mealTemplatesService.create(user.id, dto);
  }

  /** 템플릿 삭제 */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.mealTemplatesService.remove(id, user.id);
  }
}
