/**
 * 인증 모듈 (Auth Module)
 *
 * 인증에 필요한 컨트롤러, 서비스, 전략을 조합합니다.
 * - JwtModule: JWT 토큰 생성/검증
 * - PassportModule: Passport 전략 통합
 * - JwtStrategy: Bearer 토큰 검증 전략
 */

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    NotificationsModule,
    MailModule,
    // Passport 기본 전략을 jwt로 설정
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule: 비동기로 설정하여 ConfigService에서 시크릿 키를 읽음
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Record<string, unknown> => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') ?? '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // @UseGuards(JwtAuthGuard) 사용 시 이 전략이 실행됨
  ],
  exports: [
    JwtModule, // 다른 모듈에서 JwtService를 사용할 수 있도록 export
    PassportModule,
  ],
})
export class AuthModule {}
