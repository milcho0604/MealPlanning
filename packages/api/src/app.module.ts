/**
 * 루트 모듈 (App Module)
 *
 * NestJS 애플리케이션의 최상위 모듈입니다.
 * 모든 기능 모듈과 전역 설정을 여기서 조합합니다.
 *
 * 모듈 구성:
 * - ConfigModule: 환경 변수 전역 로드 (.env)
 * - PrismaModule: DB 연결 전역 제공
 * - AuthModule: 인증/인가
 * - MealPlansModule: 식단 계획 CRUD
 * - GroupsModule: 그룹 공유 기능
 * - IngredientsModule: 냉장고 재료 관리
 * - ShoppingModule: 쇼핑 리스트
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MealPlansModule } from './modules/meal-plans/meal-plans.module';
import { GroupsModule } from './modules/groups/groups.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { ShoppingModule } from './modules/shopping/shopping.module';

@Module({
  imports: [
    // 환경 변수 전역 로드 - isGlobal: true 이므로 다른 모듈에서 ConfigService를 직접 주입 가능
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // 모노레포 루트의 .env 파일 참조
    }),

    // DB 연결 - 전역 모듈로 등록하여 모든 서비스에서 PrismaService 주입 가능
    PrismaModule,

    // 기능 모듈
    AuthModule,
    MealPlansModule,
    GroupsModule,
    IngredientsModule,
    ShoppingModule,
  ],
})
export class AppModule {}
