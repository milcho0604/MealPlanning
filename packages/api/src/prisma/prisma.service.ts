/**
 * Prisma 서비스 (Prisma Service)
 *
 * PrismaClient를 NestJS 서비스로 감싸 의존성 주입이 가능하도록 합니다.
 * 앱 시작 시 DB에 연결하고, 종료 시 연결을 끊습니다.
 *
 * 사용 예시:
 *   constructor(private readonly prisma: PrismaService) {}
 *   const users = await this.prisma.user.findMany();
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * 모듈 초기화 시 DB 연결
   * NestJS가 모듈을 부트스트랩할 때 자동으로 호출됩니다.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 모듈 종료 시 DB 연결 해제
   * 메모리 누수 방지를 위해 반드시 연결을 끊어야 합니다.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
