/**
 * 식단 컨트롤러 (Meal Plans Controller)
 *
 * 식단 관련 HTTP 엔드포인트를 정의합니다.
 * 모든 엔드포인트는 JWT 인증이 필요합니다.
 *
 * API:
 *   GET    /v1/meal-plans?groupId=&from=&to=  - 기간별 식단 조회
 *   GET    /v1/meal-plans/:id                 - 식단 단건 조회
 *   POST   /v1/meal-plans                     - 식단 생성
 *   PUT    /v1/meal-plans/:id                 - 식단 수정
 *   DELETE /v1/meal-plans/:id                 - 식단 삭제
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MealPlansService } from './meal-plans.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { GetMealPlansDto } from './dto/get-meal-plans.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Meal Plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard) // 모든 식단 API는 로그인 필수
@Controller('meal-plans')
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  /**
   * 기간별 식단 조회
   * 캘린더(월간) 또는 주간 리스트 뷰에서 사용
   */
  @Get()
  @ApiOperation({ summary: '기간별 식단 목록 조회' })
  findByDateRange(
    @CurrentUser() user: RequestUser,
    @Query() query: GetMealPlansDto,
  ) {
    return this.mealPlansService.findByDateRange(user.id, query);
  }

  /**
   * 메뉴명으로 식단 검색
   */
  @Get('search')
  @ApiOperation({ summary: '식단 검색 (메뉴명)' })
  search(
    @CurrentUser() user: RequestUser,
    @Query('groupId') groupId: string,
    @Query('query') query: string,
  ) {
    return this.mealPlansService.search(user.id, groupId, query);
  }

  /**
   * 식단 단건 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '식단 단건 조회' })
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.mealPlansService.findOne(user.id, id);
  }

  /**
   * 식단 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '식단 생성' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMealPlanDto) {
    return this.mealPlansService.create(user.id, dto);
  }

  /**
   * 식단 수정
   */
  @Put(':id')
  @ApiOperation({ summary: '식단 수정' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlansService.update(user.id, id, dto);
  }

  /**
   * 식단 삭제
   */
  @Delete(':id')
  @ApiOperation({ summary: '식단 삭제' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.mealPlansService.remove(user.id, id);
  }
}
