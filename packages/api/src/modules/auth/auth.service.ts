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

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 회원가입
   *
   * 1. Supabase Auth에 계정 생성 (이메일/비밀번호)
   * 2. 로컬 DB users 테이블에 사용자 정보 저장
   * 3. JWT 토큰 발급 후 반환
   *
   * @throws ConflictException - 이미 가입된 이메일인 경우
   */
  async signUp(dto: SignUpDto): Promise<{ message: string }> {
    // 이메일 소문자 정규화 (대소문자 중복 방지)
    const email = dto.email.toLowerCase().trim();

    // 이미 가입된 이메일 확인
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    // 이미 인증 완료된 계정이면 중복 가입 차단
    if (existing && existing.isVerified) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해시
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 인증 토큰 생성 (24시간 유효)
    const verifyToken = randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (existing && !existing.isVerified) {
      // 미인증 사용자: 비밀번호/이름/토큰을 갱신하여 재가입 허용
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          passwordHash,
          verifyToken,
          verifyTokenExpiry,
        },
      });
    } else {
      // 신규 사용자: DB 저장 (미인증 상태)
      await this.prisma.user.create({
        data: {
          email,
          name: dto.name,
          passwordHash,
          verifyToken,
          verifyTokenExpiry,
          isVerified: false,
        },
      });
    }

    // 인증 메일 발송 (백그라운드 - 응답을 기다리지 않음)
    this.mailService.sendVerificationEmail(email, dto.name, verifyToken).catch(() => {
      this.logger.error(`회원가입 인증 메일 발송 실패: ${email}`);
    });

    return { message: '인증 메일을 발송했습니다. 이메일을 확인해주세요.' };
  }

  /** 이메일 인증 완료 */
  async verifyEmail(token: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      // 만료/잘못된 토큰 → 에러 HTML 반환 (JSON 에러 대신)
      return `
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f5f5f5;">
          <div style="max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e0e0e0;">
            <h2 style="color:#F44336;">❌ 인증 링크 만료</h2>
            <p style="color:#555;">인증 링크가 만료되었거나 이미 사용된 링크입니다.</p>
            <p style="color:#999;font-size:13px;">앱에서 인증 메일 재발송을 요청해주세요.</p>
          </div>
        </body></html>
      `;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null, verifyTokenExpiry: null },
    });

    return `
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f5f5f5;">
        <div style="max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e0e0e0;">
          <h2 style="color:#4CAF50;">✅ 이메일 인증 완료!</h2>
          <p style="color:#555;">앱으로 돌아가서 로그인해주세요.</p>
        </div>
      </body></html>
    `;
  }

  /** 인증 메일 재발송 */
  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.isVerified) return; // 존재하지 않거나 이미 인증된 경우 무시

    const verifyToken = randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry },
    });

    await this.mailService.sendVerificationEmail(email, user.name, verifyToken);
  }

  /**
   * 로그인
   *
   * Supabase Auth로 이메일/비밀번호를 검증한 후 JWT 토큰을 발급합니다.
   *
   * @throws UnauthorizedException - 이메일/비밀번호가 틀린 경우
   */
  async signIn(dto: SignInDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid)
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );

    // 이메일 인증 여부 확인
    if (!user.isVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    // 탈퇴 상태 확인
    if (user.statusYn === 'N') {
      throw new UnauthorizedException('ACCOUNT_DELETED');
    }

    const tokens = this.generateTokens(user.id, user.email);
    return { user: this.toUserResponse(user), tokens };
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
      const payload: { sub: string; type: string } = this.jwtService.verify(
        refreshToken,
        { secret: this.configService.getOrThrow<string>('JWT_SECRET') },
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
        // 소셜 계정 정보 연동 + 소셜 인증이므로 이메일 인증도 완료 처리
        user = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: {
            provider,
            providerId: providerUser.providerId,
            isVerified: true,
            verifyToken: null,
            verifyTokenExpiry: null,
          },
        });
      }
    }

    // 4. 신규 사용자 생성
    if (!user) {
      // 이메일이 없는 경우(Apple 이메일 숨기기) 고유 이메일 생성
      const email =
        providerUser.email ??
        `${provider}_${providerUser.providerId}@social.mealplan`;
      user = await this.prisma.user.create({
        data: {
          email,
          name: providerUser.name,
          avatarUrl: providerUser.avatarUrl,
          provider,
          providerId: providerUser.providerId,
          isVerified: true, // 소셜 인증은 이메일 인증 불필요
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

  /** Google ID 토큰 검증 (웹/iOS/Android 클라이언트 ID 모두 허용) */
  private async verifyGoogleToken(idToken: string): Promise<SocialUserInfo> {
    try {
      const clientId =
        this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
      // 플랫폼별 클라이언트 ID를 모두 허용 (모바일은 webClientId로 토큰 발급)
      const allowedAudiences = [
        clientId,
        this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      ].filter((id): id is string => !!id);
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: allowedAudiences,
      });
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
      const { data } = await axios.get<{
        id: number;
        kakao_account?: {
          email?: string;
          profile?: { nickname?: string; profile_image_url?: string };
        };
      }>('https://kapi.kakao.com/v2/user/me', {
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
   * 회원 탈퇴 (Soft Delete)
   *
   * 즉시 삭제하지 않고 status_yn = N, deleted_at = now() 으로 표시.
   * 90일 후 Cron이 하드 삭제 처리.
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        statusYn: 'N',
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 휴면 해제 (탈퇴 취소)
   *
   * 탈퇴 후 90일 이내에만 가능.
   * status_yn = Y, deleted_at = null 로 복구.
   */
  async reactivateAccount(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user || user.statusYn !== 'N') {
      throw new UnauthorizedException('탈퇴된 계정을 찾을 수 없습니다.');
    }

    // 90일 복구 기간 검증
    if (!user.deletedAt || user.deletedAt.getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000) {
      throw new UnauthorizedException('복구 기간(90일)이 만료되었습니다.');
    }

    // 비밀번호 확인
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, user.passwordHash ?? '');
    if (!isValid)
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

    // 복구
    const restored = await this.prisma.user.update({
      where: { id: user.id },
      data: { statusYn: 'Y', deletedAt: null },
    });

    const tokens = this.generateTokens(restored.id, restored.email);
    return { user: this.toUserResponse(restored), tokens };
  }

  /**
   * [Cron] 매일 자정 - 탈퇴 후 90일 경과 계정 하드 삭제
   */
  @Cron('0 0 * * *', { timeZone: 'Asia/Seoul' })
  async purgeExpiredAccounts(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const expired = await this.prisma.user.findMany({
      where: { statusYn: 'N', deletedAt: { lte: cutoff } },
      select: { id: true },
    });

    for (const { id } of expired) {
      await this.prisma.user.delete({ where: { id } });
    }

    if (expired.length > 0) {
      this.logger.log(
        `[계정 정리] ${expired.length}개 탈퇴 계정 영구 삭제 완료`,
      );
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
  }

  /** 프로필 수정 (이름, 프로필 사진 URL) */
  async updateProfile(
    userId: string,
    update: { name?: string; avatarUrl?: string | null },
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(update.name !== undefined && { name: update.name }),
        ...(update.avatarUrl !== undefined && { avatarUrl: update.avatarUrl }),
      },
    });
    return this.toUserResponse(user);
  }

  /**
   * 비밀번호 변경 (로그인 상태)
   * 현재 비밀번호 확인 후 새 비밀번호로 변경
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('비밀번호를 변경할 수 없는 계정입니다.');
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  /**
   * 비밀번호 재설정 요청 (비로그인)
   * 이메일로 재설정 링크 발송
   */
  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    // 보안: 존재하지 않는 이메일이어도 동일 응답
    if (!user || !user.passwordHash) return;

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: resetToken, verifyTokenExpiry: resetTokenExpiry },
    });

    // 메일 발송 (백그라운드 - 응답을 기다리지 않음)
    this.mailService.sendPasswordResetEmail(normalizedEmail, user.name, resetToken).catch(() => {
      this.logger.error(`비밀번호 재설정 메일 발송 실패: ${normalizedEmail}`);
    });
  }

  /**
   * 비밀번호 재설정 실행 (토큰 검증 후)
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { verifyToken: token, verifyTokenExpiry: { gt: new Date() } },
    });

    if (!user) {
      throw new NotFoundException('유효하지 않거나 만료된 링크입니다.');
    }

    const bcrypt = await import('bcrypt');
    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, verifyToken: null, verifyTokenExpiry: null },
    });
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
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');

    // 액세스 토큰 (API 요청 시 사용)
    const accessToken: string = this.jwtService.sign(
      { sub: userId, email },
      { secret, expiresIn: expiresIn as import('ms').StringValue },
    );

    // 리프레시 토큰 (type: 'refresh' 필드로 액세스 토큰과 구분)
    const refreshToken: string = this.jwtService.sign(
      { sub: userId, email, type: 'refresh' },
      { secret, expiresIn: refreshExpiresIn as import('ms').StringValue },
    );

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
  private toUserResponse(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
