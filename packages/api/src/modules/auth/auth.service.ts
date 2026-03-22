/**
 * 인증 서비스 (Auth Service)
 *
 * 인증 관련 비즈니스 로직을 처리합니다.
 * - 회원가입: Supabase Auth에 계정 생성 후 로컬 DB에 사용자 정보 저장
 * - 로그인: Supabase Auth로 검증 후 JWT 토큰 발급
 * - 토큰 갱신: 리프레시 토큰으로 새 액세스 토큰 발급
 * - 로그아웃: Supabase 세션 종료
 *
 * 인증 흐름:
 *   클라이언트 → NestJS → Supabase Auth (검증) → JWT 발급 → 클라이언트
 *   이후 요청: 클라이언트 → NestJS (JWT 검증) → 처리
 */

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import type { AuthTokens, User } from '@mealplan/shared';

/** 소셜 제공자 종류 */
export type SocialProvider = 'google' | 'kakao' | 'apple';

/** 소셜 로그인 후 정규화된 사용자 정보 */
interface SocialUserInfo {
  providerId: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

/** 인증 성공 응답 타입 (사용자 정보 + 토큰) */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Supabase Admin 클라이언트 초기화 (service_role key 사용)
    // service_role key는 RLS를 우회하므로 서버에서만 사용해야 합니다.
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * 회원가입
   *
   * 1. Supabase Auth에 계정 생성 (이메일/비밀번호)
   * 2. 로컬 DB users 테이블에 사용자 정보 저장
   * 3. JWT 토큰 발급 후 반환
   *
   * @throws ConflictException - 이미 가입된 이메일인 경우
   */
  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    // 1. Supabase Auth에 계정 생성
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // 개발 환경에서는 이메일 확인 없이 즉시 활성화
    });

    if (authError) {
      // 이미 존재하는 이메일인 경우
      if (authError.message.includes('already')) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      throw new Error(authError.message);
    }

    // 2. 로컬 DB에 사용자 정보 저장 (Supabase Auth UUID를 그대로 사용)
    const user = await this.prisma.user.create({
      data: {
        id: authData.user.id, // Supabase Auth UUID와 동일한 ID 사용
        email: dto.email,
        name: dto.name,
      },
    });

    // 3. JWT 토큰 발급
    const tokens = this.generateTokens(user.id, user.email);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  /**
   * 로그인
   *
   * Supabase Auth로 이메일/비밀번호를 검증한 후 JWT 토큰을 발급합니다.
   *
   * @throws UnauthorizedException - 이메일/비밀번호가 틀린 경우
   */
  async signIn(dto: SignInDto): Promise<AuthResponse> {
    // Supabase Auth로 이메일/비밀번호 검증
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 로컬 DB에서 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: authData.user.id },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // JWT 토큰 발급
    const tokens = this.generateTokens(user.id, user.email);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  /**
   * 토큰 갱신
   *
   * 리프레시 토큰을 검증하고 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.
   * 리프레시 토큰 로테이션: 매번 새로운 리프레시 토큰을 발급하여 보안을 강화합니다.
   *
   * @throws UnauthorizedException - 리프레시 토큰이 유효하지 않은 경우
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // 리프레시 토큰 서명 검증
      const payload = this.jwtService.verify<{ sub: string; email: string; type: string }>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      // 리프레시 토큰인지 확인 (액세스 토큰으로 갱신 시도 방지)
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 토큰 타입입니다.');
      }

      // 사용자가 여전히 존재하는지 확인
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 새 토큰 발급 (리프레시 토큰 로테이션)
      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('만료되거나 유효하지 않은 토큰입니다.');
    }
  }

  /**
   * 소셜 로그인 (Google / Kakao / Apple 공통 진입점)
   *
   * 1. 제공자 토큰 검증 → 사용자 정보 획득
   * 2. providerId로 기존 사용자 조회
   * 3. 없으면 이메일로 조회 (기존 이메일 계정에 소셜 연동)
   * 4. 그것도 없으면 신규 사용자 생성
   * 5. JWT 발급 후 반환
   */
  async socialSignIn(
    provider: SocialProvider,
    token: string,
    name?: string,
  ): Promise<AuthResponse> {
    // 1. 제공자 토큰 검증
    const providerUser = await this.verifyProviderToken(provider, token, name);

    // 2. providerId로 기존 사용자 조회
    let user = await this.prisma.user.findFirst({
      where: { provider, providerId: providerUser.providerId },
    });

    // 3. 이메일로 기존 사용자 조회 (이메일 가입 계정과 연동)
    if (!user && providerUser.email) {
      const emailUser = await this.prisma.user.findUnique({
        where: { email: providerUser.email },
      });
      if (emailUser) {
        // 소셜 계정 정보 연동
        user = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: { provider, providerId: providerUser.providerId },
        });
      }
    }

    // 4. 신규 사용자 생성
    if (!user) {
      // 이메일이 없는 경우(Apple 이메일 숨기기) 고유 이메일 생성
      const email =
        providerUser.email ?? `${provider}_${providerUser.providerId}@social.mealplan`;
      user = await this.prisma.user.create({
        data: {
          email,
          name: providerUser.name,
          avatarUrl: providerUser.avatarUrl,
          provider,
          providerId: providerUser.providerId,
        },
      });
    }

    const tokens = this.generateTokens(user.id, user.email);
    return { user: this.toUserResponse(user), tokens };
  }

  /**
   * 소셜 제공자 토큰 검증 및 사용자 정보 추출
   */
  private async verifyProviderToken(
    provider: SocialProvider,
    token: string,
    displayName?: string,
  ): Promise<SocialUserInfo> {
    if (provider === 'google') return this.verifyGoogleToken(token);
    if (provider === 'kakao') return this.verifyKakaoToken(token);
    if (provider === 'apple') return this.verifyAppleToken(token, displayName);
    throw new UnauthorizedException('지원하지 않는 소셜 제공자입니다.');
  }

  /** Google ID 토큰 검증 */
  private async verifyGoogleToken(idToken: string): Promise<SocialUserInfo> {
    try {
      const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload()!;
      return {
        providerId: payload.sub,
        email: payload.email ?? null,
        name: payload.name ?? '구글 사용자',
        avatarUrl: payload.picture ?? null,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
    }
  }

  /** Kakao 액세스 토큰으로 사용자 정보 조회 */
  private async verifyKakaoToken(accessToken: string): Promise<SocialUserInfo> {
    try {
      const { data } = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const account = data.kakao_account ?? {};
      return {
        providerId: String(data.id),
        email: account.email ?? null,
        name: account.profile?.nickname ?? '카카오 사용자',
        avatarUrl: account.profile?.profile_image_url ?? null,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 Kakao 토큰입니다.');
    }
  }

  /** Apple Identity 토큰 검증 */
  private async verifyAppleToken(
    identityToken: string,
    displayName?: string,
  ): Promise<SocialUserInfo> {
    try {
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: 'com.mealplan.app', // app.json bundleIdentifier
        ignoreExpiration: false,
      });
      return {
        providerId: payload.sub,
        email: payload.email ?? null,
        name: displayName ?? 'Apple 사용자',
        avatarUrl: null,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
    }
  }

  /**
   * 로그아웃
   * 서버에서 처리할 로직 없음 (JWT는 stateless)
   * 클라이언트가 토큰을 삭제하면 로그아웃 완료
   *
   * 향후: Redis를 활용한 토큰 블랙리스트 구현 가능
   */
  async signOut(): Promise<void> {
    // stateless JWT 방식이므로 서버에서 별도 처리 없음
    // 클라이언트에서 SecureStore의 토큰을 삭제하는 것으로 충분
  }

  /**
   * 내 프로필 조회
   */
  async getMe(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return this.toUserResponse(user);
  }

  // ── Private Methods ────────────────────────────────────────────────────────

  /**
   * JWT 액세스 토큰과 리프레시 토큰을 함께 발급합니다.
   *
   * - 액세스 토큰: 짧은 유효기간 (기본 1시간), API 요청 시 사용
   * - 리프레시 토큰: 긴 유효기간 (기본 30일), 액세스 토큰 갱신 시 사용
   */
  private generateTokens(userId: string, email: string): AuthTokens {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');

    // 액세스 토큰 (API 요청 시 사용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = this.jwtService.sign({ sub: userId, email }, { secret, expiresIn: expiresIn as any });

    // 리프레시 토큰 (type: 'refresh' 필드로 액세스 토큰과 구분)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = this.jwtService.sign({ sub: userId, email, type: 'refresh' }, { secret, expiresIn: refreshExpiresIn as any });

    // 액세스 토큰 만료 시각 계산 (클라이언트 측 갱신 타이밍 결정용)
    const expiresAt = new Date();
    const hours = parseInt(expiresIn.replace('h', ''), 10) || 1;
    expiresAt.setHours(expiresAt.getHours() + hours);

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Prisma User 모델을 API 응답용 User 타입으로 변환합니다.
   * avatarUrl 필드명 변환 및 불필요한 필드 제거를 담당합니다.
   */
  private toUserResponse(user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
