/**
 * 인증 컨트롤러 단위 테스트 (Auth Controller Unit Tests)
 *
 * AuthController의 각 엔드포인트가 AuthService를 올바르게 호출하고
 * 응답을 반환하는지 검증합니다.
 * AuthService와 NotificationsService를 mock으로 대체합니다.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { NotificationsService } from '../notifications/notifications.service';

// ── Mock 데이터 ────────────────────────────────────────────────────────────────

/** 테스트용 사용자 응답 데이터 */
const mockUserResponse = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  name: '테스트 유저',
  avatarUrl: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
};

/** 테스트용 토큰 응답 데이터 */
const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date().toISOString(),
};

/** 테스트용 인증 응답 */
const mockAuthResponse = {
  user: mockUserResponse,
  tokens: mockTokens,
};

/** 테스트용 JWT 페이로드 (CurrentUser 데코레이터 반환값) */
const mockRequestUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
};

// ── Mock 서비스 설정 ──────────────────────────────────────────────────────────

/** AuthService Mock */
const mockAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshToken: jest.fn(),
  getMe: jest.fn(),
  deleteAccount: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  reactivateAccount: jest.fn(),
  socialSignIn: jest.fn(),
};

/** NotificationsService Mock */
const mockNotificationsService = {
  savePushToken: jest.fn(),
};

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    // 각 테스트 시작 전 모든 mock 초기화
    jest.clearAllMocks();
  });

  // ── POST /auth/signup 테스트 ──────────────────────────────────────────────────

  describe('POST /auth/signup (회원가입)', () => {
    it('signUp DTO를 AuthService.signUp에 전달하고 결과를 반환해야 한다', async () => {
      // given
      const dto = { email: 'new@example.com', name: '신규유저', password: 'password123' };
      const expectedResult = { message: '인증 메일을 발송했습니다. 이메일을 확인해주세요.' };
      mockAuthService.signUp.mockResolvedValue(expectedResult);

      // when
      const result = await controller.signUp(dto);

      // then
      expect(result).toEqual(expectedResult);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
      expect(mockAuthService.signUp).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /auth/login 테스트 ───────────────────────────────────────────────────

  describe('POST /auth/login (로그인)', () => {
    it('signIn DTO를 AuthService.signIn에 전달하고 user + tokens를 반환해야 한다', async () => {
      // given
      const dto = { email: 'test@example.com', password: 'password123' };
      mockAuthService.signIn.mockResolvedValue(mockAuthResponse);

      // when
      const result = await controller.signIn(dto);

      // then
      expect(result).toEqual(mockAuthResponse);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto);
    });
  });

  // ── GET /auth/me 테스트 ───────────────────────────────────────────────────────

  describe('GET /auth/me (내 프로필 조회)', () => {
    it('현재 사용자 ID로 AuthService.getMe를 호출하고 사용자 정보를 반환해야 한다', async () => {
      // given
      mockAuthService.getMe.mockResolvedValue(mockUserResponse);

      // when
      const result = await controller.getMe(mockRequestUser);

      // then
      expect(result).toEqual(mockUserResponse);
      expect(mockAuthService.getMe).toHaveBeenCalledWith(mockRequestUser.id);
    });
  });

  // ── DELETE /auth/account 테스트 ───────────────────────────────────────────────

  describe('DELETE /auth/account (회원 탈퇴)', () => {
    it('현재 사용자 ID로 AuthService.deleteAccount를 호출해야 한다', async () => {
      // given
      mockAuthService.deleteAccount.mockResolvedValue(undefined);

      // when
      await controller.deleteAccount(mockRequestUser);

      // then
      expect(mockAuthService.deleteAccount).toHaveBeenCalledWith(mockRequestUser.id);
      expect(mockAuthService.deleteAccount).toHaveBeenCalledTimes(1);
    });
  });
});
