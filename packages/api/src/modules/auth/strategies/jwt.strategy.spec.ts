import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      mockConfigService as unknown as ConfigService,
      mockPrismaService as unknown as PrismaService,
    );
  });

  it('리프레시 토큰을 API 접근 토큰으로 허용하지 않아야 한다', async () => {
    await expect(
      strategy.validate({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        type: 'refresh',
        iat: 1,
        exp: 2,
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('탈퇴되었거나 미인증인 사용자의 토큰을 거부해야 한다', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-uuid-1',
      email: 'test@example.com',
      name: '테스트 유저',
      statusYn: 'N',
      isVerified: true,
    });

    await expect(
      strategy.validate({
        sub: 'user-uuid-1',
        email: 'test@example.com',
        type: 'access',
        iat: 1,
        exp: 2,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('정상 액세스 토큰은 요청 사용자 정보로 변환해야 한다', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-uuid-1',
      email: 'test@example.com',
      name: '테스트 유저',
      statusYn: 'Y',
      isVerified: true,
    });

    const user = await strategy.validate({
      sub: 'user-uuid-1',
      email: 'test@example.com',
      type: 'access',
      iat: 1,
      exp: 2,
    });

    expect(user).toEqual({
      id: 'user-uuid-1',
      email: 'test@example.com',
      name: '테스트 유저',
    });
  });
});
