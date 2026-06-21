/**
 * JWT 인증 전략 (JWT Strategy)
 *
 * Passport JWT 전략을 구현합니다.
 * 모든 요청의 Authorization 헤더에서 Bearer 토큰을 추출하고,
 * 서명 검증 후 페이로드를 디코딩하여 request.user에 담습니다.
 *
 * @UseGuards(JwtAuthGuard) 데코레이터가 붙은 컨트롤러/라우트에서 동작합니다.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@mealplan/shared';

/** request.user에 담길 사용자 정보 타입 */
export interface RequestUser {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Authorization: Bearer <token> 헤더에서 토큰 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 만료된 토큰은 자동 거부
      ignoreExpiration: false,
      // 환경 변수의 JWT 시크릿 키로 서명 검증
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * 토큰 서명 검증 성공 후 호출됩니다.
   * 반환값이 request.user에 담깁니다.
   *
   * @param payload - 디코딩된 JWT 페이로드
   * @throws UnauthorizedException - DB에 사용자가 없을 경우
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException(
        '리프레시 토큰은 API 접근에 사용할 수 없습니다.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        statusYn: true,
        isVerified: true,
      },
    });

    if (!user || user.statusYn === 'N' || !user.isVerified) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return { id: user.id, email: user.email, name: user.name };
  }
}
