/**
 * 쇼핑 리스트 모듈 (Shopping Module)
 *
 * 쇼핑 항목 추가/수정/삭제, 체크 토글, 완료 항목 일괄 삭제를 담당합니다.
 */

import { Module } from '@nestjs/common';
import { ShoppingController } from './shopping.controller';
import { ShoppingService } from './shopping.service';

@Module({
  controllers: [ShoppingController],
  providers: [ShoppingService],
})
export class ShoppingModule {}
