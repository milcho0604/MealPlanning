/**
 * 인증 컨트롤러 (Auth Controller)
 *
 * 인증 관련 HTTP 엔드포인트를 정의합니다.
 * 라우트 처리와 요청/응답 매핑만 담당하고,
 * 비즈니스 로직은 AuthService에 위임합니다.
 *
 * API:
 *   POST /v1/auth/signup   - 회원가입
 *   POST /v1/auth/login    - 로그인
 *   POST /v1/auth/logout   - 로그아웃 (인증 필요)
 *   POST /v1/auth/refresh  - 토큰 갱신
 *   GET  /v1/auth/me       - 내 프로필 조회 (인증 필요)
 *   DELETE /v1/auth/account - 회원 탈퇴 (인증 필요)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthResponse, AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from './strategies/jwt.strategy';

@ApiTags('Auth') // Swagger UI에서 "Auth" 섹션으로 그룹화
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   * 이메일/비밀번호로 새 계정을 생성하고 즉시 로그인 토큰을 반환합니다.
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '회원가입' })
  signUp(@Body() dto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(dto);
  }

  /**
   * 로그인
   * 성공 시 JWT 액세스 토큰과 리프레시 토큰을 반환합니다.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  signIn(@Body() dto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto);
  }

  /**
   * 로그아웃 (인증 필요)
   * 서버는 stateless JWT를 사용하므로, 클라이언트 측에서 토큰을 삭제합니다.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그아웃' })
  signOut() {
    return this.authService.signOut();
  }

  /**
   * 토큰 갱신
   * 리프레시 토큰을 이용해 새 액세스 토큰과 리프레시 토큰을 발급합니다.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * 내 프로필 조회 (인증 필요)
   * JWT 토큰으로 현재 로그인된 사용자의 정보를 반환합니다.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 조회' })
  getMe(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.id);
  }

  /**
   * 회원 탈퇴 (인증 필요)
   * TODO: Supabase Auth 계정 삭제 + 로컬 DB 사용자 삭제 구현
   */
  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 탈퇴' })
  deleteAccount(@CurrentUser() user: RequestUser) {
    // TODO: 회원 탈퇴 로직 구현 (Phase 1)
    return { message: `회원 탈퇴 처리 완료 (userId: ${user.id})` };
  }
}
