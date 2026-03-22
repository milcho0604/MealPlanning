/**
 * 쇼핑 리스트 컨트롤러 (Shopping Controller)
 *
 * 엔드포인트:
 * - GET    /shopping?groupId=xxx         목록 조회
 * - POST   /shopping                     항목 추가
 * - PUT    /shopping/:id                 항목 수정
 * - PATCH  /shopping/:id/check           체크 토글
 * - DELETE /shopping/:id                 항목 삭제
 * - DELETE /shopping/checked?groupId=xxx 완료 항목 일괄 삭제
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ShoppingService } from './shopping.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { GetShoppingItemsDto } from './dto/get-shopping-items.dto';
import { GenerateShoppingDto } from './dto/generate-shopping.dto';
import type { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

@Controller('shopping')
@UseGuards(JwtAuthGuard)
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  /** 쇼핑 목록 조회 */
  @Get()
  findAll(@Query() query: GetShoppingItemsDto, @CurrentUser() user: RequestUser) {
    return this.shoppingService.findAll(query.groupId, user.id);
  }

  /** 쇼핑 항목 추가 */
  @Post()
  create(@Body() dto: CreateShoppingItemDto, @CurrentUser() user: RequestUser) {
    return this.shoppingService.create(user.id, dto);
  }

  /** 주간 식단 기반 쇼핑 목록 자동 생성 */
  @Post('generate')
  generate(@Body() dto: GenerateShoppingDto, @CurrentUser() user: RequestUser) {
    return this.shoppingService.generateFromMealPlan(user.id, dto);
  }

  /** 완료 항목 일괄 삭제 - /shopping/:id 보다 먼저 선언해야 라우팅 충돌 없음 */
  @Delete('checked')
  clearChecked(@Query() query: GetShoppingItemsDto, @CurrentUser() user: RequestUser) {
    return this.shoppingService.clearChecked(query.groupId, user.id);
  }

  /** 쇼핑 항목 수정 */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShoppingItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.shoppingService.update(id, user.id, dto);
  }

  /** 체크 토글 */
  @Patch(':id/check')
  toggleCheck(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.shoppingService.toggleCheck(id, user.id);
  }

  /** 쇼핑 항목 삭제 */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.shoppingService.remove(id, user.id);
  }
}
