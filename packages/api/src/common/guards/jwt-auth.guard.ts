/**
 * JWT 인증 가드 (JWT Auth Guard)
 *
 * 컨트롤러나 라우트에 @UseGuards(JwtAuthGuard)를 붙이면
 * 해당 엔드포인트는 유효한 JWT 토큰이 있는 요청만 통과시킵니다.
 *
 * 인증 실패 시 401 Unauthorized 응답을 반환합니다.
 *
 * 사용 예시:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getMe(@CurrentUser() user: RequestUser) { ... }
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
