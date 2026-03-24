/**
 * 냉장고 재료 컨트롤러 (Ingredients Controller)
 *
 * API:
 *   GET    /v1/ingredients?groupId=&category=    - 재료 목록 조회
 *   GET    /v1/ingredients/expiring?groupId=&days= - 유통기한 임박 재료
 *   POST   /v1/ingredients                       - 재료 추가
 *   PUT    /v1/ingredients/:id                   - 재료 수정
 *   DELETE /v1/ingredients/:id                   - 재료 삭제
 *   PATCH  /v1/ingredients/:id/consume           - 소진 처리
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Ingredients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  /**
   * 재료 목록 조회
   * category 파라미터로 필터링 가능
   */
  @Get()
  @ApiOperation({ summary: '냉장고 재료 목록 조회' })
  @ApiQuery({ name: 'groupId', required: true })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('groupId') groupId: string,
    @Query('category') category?: string,
  ) {
    return this.ingredientsService.findAll(user.id, groupId, category);
  }

  /**
   * 유통기한 임박 재료 조회
   * days 파라미터로 기준 일수 설정 (기본 3일)
   */
  @Get('expiring')
  @ApiOperation({ summary: '유통기한 임박 재료 조회' })
  @ApiQuery({ name: 'groupId', required: true })
  @ApiQuery({
    name: 'days',
    required: false,
    description: '기준 일수 (기본 3)',
  })
  findExpiring(
    @CurrentUser() user: RequestUser,
    @Query('groupId') groupId: string,
    @Query('days') days?: string,
  ) {
    return this.ingredientsService.findExpiring(
      user.id,
      groupId,
      days ? parseInt(days, 10) : undefined,
    );
  }

  /**
   * 재료 추가
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '재료 추가' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(user.id, dto);
  }

  /**
   * 재료 수정
   */
  @Put(':id')
  @ApiOperation({ summary: '재료 수정' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(user.id, id, dto);
  }

  /**
   * 재료 삭제
   */
  @Delete(':id')
  @ApiOperation({ summary: '재료 삭제' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ingredientsService.remove(user.id, id);
  }

  /**
   * 재료 소진 처리
   * 목록에서 숨기고 isConsumed = true 로 변경
   */
  @Patch(':id/consume')
  @ApiOperation({ summary: '재료 소진 처리' })
  consume(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.ingredientsService.consume(user.id, id);
  }
}
