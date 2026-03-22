/**
 * Prisma 모듈 (Prisma Module)
 *
 * PrismaService를 전역 모듈로 등록합니다.
 * isGlobal: true 덕분에 다른 모듈에서 imports에 PrismaModule을
 * 추가하지 않아도 PrismaService를 주입받을 수 있습니다.
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 전역 모듈 선언 - AppModule에 한 번만 등록하면 어디서든 사용 가능
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 다른 모듈에서 주입 가능하도록 export
})
export class PrismaModule {}
