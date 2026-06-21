/**
 * 인증 서비스 단위 테스트 (Auth Service Unit Tests)
 *
 * AuthService의 핵심 비즈니스 로직을 격리된 환경에서 검증합니다.
 * PrismaService, JwtService, ConfigService, MailService를 mock으로 대체합니다.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

// ── Mock 데이터 ────────────────────────────────────────────────────────────────

/** 테스트용 기본 사용자 데이터 */
const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  name: '테스트 유저',
  passwordHash: null as string | null,
  avatarUrl: null,
  isVerified: true,
  statusYn: 'Y',
  deletedAt: null as Date | null,
  provider: null,
  providerId: null,
  verifyToken: null,
  verifyTokenExpiry: null,
  pushToken: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

/** 테스트용 미인증 사용자 데이터 */
const mockUnverifiedUser = {
  ...mockUser,
  id: 'user-uuid-2',
  email: 'unverified@example.com',
  isVerified: false,
};

/** 테스트용 탈퇴 사용자 데이터 */
const mockDeletedUser = {
  ...mockUser,
  id: 'user-uuid-3',
  email: 'deleted@example.com',
  statusYn: 'N',
  deletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10일 전 탈퇴
};

// ── Mock 서비스 설정 ──────────────────────────────────────────────────────────

/** PrismaService Mock */
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

/** JwtService Mock */
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

/** ConfigService Mock */
const mockConfigService = {
  get: jest.fn().mockReturnValue('1h'),
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

/** MailService Mock */
const mockMailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
};

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // 각 테스트 전에 모듈 초기화 및 mock 초기화
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // 각 테스트 시작 전 모든 mock 초기화
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-token');
    mockConfigService.get.mockReturnValue('1h');
    mockConfigService.getOrThrow.mockReturnValue('test-secret');
    mockMailService.sendVerificationEmail.mockResolvedValue(undefined);
  });

  // ── signUp 테스트 ────────────────────────────────────────────────────────────

  describe('signUp (회원가입)', () => {
    it('정상적인 이메일/비밀번호로 회원가입에 성공해야 한다', async () => {
      // given: 이메일이 존재하지 않는 경우
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        isVerified: false,
        verifyToken: 'some-token',
      });

      // when
      const result = await service.signUp({
        email: 'new@example.com',
        name: '신규유저',
        password: 'password123',
      });

      // then
      expect(result).toEqual({ message: expect.stringContaining('인증 메일') });
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('이미 가입된 이메일로 회원가입 시 ConflictException이 발생해야 한다', async () => {
      // given: 동일 이메일이 이미 존재하는 경우
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // when & then
      await expect(
        service.signUp({
          email: 'test@example.com',
          name: '중복유저',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  // ── signIn 테스트 ────────────────────────────────────────────────────────────

  describe('signIn (로그인)', () => {
    it('올바른 이메일/비밀번호로 로그인에 성공하고 토큰을 반환해야 한다', async () => {
      // given: bcrypt로 해시된 비밀번호를 가진 인증된 사용자
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('password123', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash,
      });

      // when
      const result = await service.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      // then
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
    });

    it('잘못된 비밀번호로 로그인 시 UnauthorizedException이 발생해야 한다', async () => {
      // given: 올바른 해시가 있지만 잘못된 비밀번호를 입력하는 경우
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('correctPassword', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash,
      });

      // when & then
      await expect(
        service.signIn({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('이메일 미인증 사용자 로그인 시 EMAIL_NOT_VERIFIED 에러가 발생해야 한다', async () => {
      // given: 비밀번호는 맞지만 이메일 미인증 상태
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('password123', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUnverifiedUser,
        passwordHash,
      });

      // when & then
      await expect(
        service.signIn({
          email: 'unverified@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new UnauthorizedException('EMAIL_NOT_VERIFIED'));
    });

    it('탈퇴된 계정으로 로그인 시 ACCOUNT_DELETED 에러가 발생해야 한다', async () => {
      // given: 비밀번호는 맞지만 탈퇴 처리된 계정
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('password123', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockDeletedUser,
        isVerified: true,
        passwordHash,
      });

      // when & then
      await expect(
        service.signIn({
          email: 'deleted@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new UnauthorizedException('ACCOUNT_DELETED'));
    });

    it('존재하지 않는 이메일로 로그인 시 UnauthorizedException이 발생해야 한다', async () => {
      // given
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // when & then
      await expect(
        service.signIn({
          email: 'notexist@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── refreshToken 테스트 ──────────────────────────────────────────────────────

  describe('refreshToken (토큰 갱신)', () => {
    it('유효한 리프레시 토큰으로 새 토큰을 발급해야 한다', async () => {
      // given: 유효한 리프레시 토큰 페이로드
      mockJwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'refresh',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // when
      const result = await service.refreshToken('valid-refresh-token');

      // then
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('만료된 리프레시 토큰으로 갱신 시 UnauthorizedException이 발생해야 한다', async () => {
      // given: verify가 예외를 던지는 경우 (만료 또는 위변조)
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // when & then
      await expect(
        service.refreshToken('expired-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('액세스 토큰으로 갱신 시도 시 UnauthorizedException이 발생해야 한다', async () => {
      // given: type이 'refresh'가 아닌 토큰
      mockJwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        type: 'access', // 잘못된 type
      });

      // when & then
      await expect(
        service.refreshToken('access-token-used-as-refresh'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── verifyEmail 테스트 ────────────────────────────────────────────────────────

  describe('verifyEmail (이메일 인증)', () => {
    it('유효한 인증 토큰으로 이메일 인증에 성공해야 한다', async () => {
      // given
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        isVerified: false,
        verifyToken: 'valid-verify-token',
        verifyTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1시간 후 만료
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      // when
      const result = await service.verifyEmail('valid-verify-token');

      // then
      expect(result).toContain('인증 완료');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isVerified: true }),
        }),
      );
    });

    it('만료된 인증 토큰으로 인증 시도 시 만료 안내 HTML을 반환해야 한다', async () => {
      // given: 만료된 토큰이라 findFirst가 null 반환
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      // when
      const result = await service.verifyEmail('expired-verify-token');

      // then
      expect(result).toContain('인증 링크 만료');
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  // ── reactivateAccount 테스트 ──────────────────────────────────────────────────

  describe('reactivateAccount (휴면 해제)', () => {
    it('올바른 비밀번호로 탈퇴 계정 복구에 성공해야 한다', async () => {
      // given
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('password123', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockDeletedUser,
        passwordHash,
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockDeletedUser,
        statusYn: 'Y',
        deletedAt: null,
      });

      // when
      const result = await service.reactivateAccount(
        'deleted@example.com',
        'password123',
      );

      // then
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('잘못된 비밀번호로 복구 시도 시 UnauthorizedException이 발생해야 한다', async () => {
      // given
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('correctPassword', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockDeletedUser,
        passwordHash,
      });

      // when & then
      await expect(
        service.reactivateAccount('deleted@example.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('탈퇴된 계정이 아닌 경우 UnauthorizedException이 발생해야 한다', async () => {
      // given: 정상 계정(statusYn='Y')이 reactivate 시도
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // when & then
      await expect(
        service.reactivateAccount('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── deleteAccount 테스트 ──────────────────────────────────────────────────────

  describe('deleteAccount (회원 탈퇴)', () => {
    it('회원 탈퇴 요청 시 statusYn=N, deletedAt을 설정해야 한다', async () => {
      // given
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        statusYn: 'N',
        deletedAt: new Date(),
      });

      // when
      await service.deleteAccount(mockUser.id);

      // then: Soft Delete 처리 확인
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            statusYn: 'N',
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
