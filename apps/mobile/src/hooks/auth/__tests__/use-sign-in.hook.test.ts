/**
 * useSignIn 훅 단위 테스트
 *
 * 로그인 폼 유효성 검사, 성공/실패 시나리오, 특수 에러 처리를 검증합니다.
 * expo-router와 auth.store를 mock으로 대체합니다.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useSignIn } from '../use-sign-in.hook';

// ── Mock 설정 ──────────────────────────────────────────────────────────────────

/** expo-router mock */
const mockRouterReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (args: unknown) => mockRouterReplace(args),
  },
}));

/** auth.store mock */
const mockSignIn = jest.fn();
jest.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({
    signIn: mockSignIn,
  }),
}));

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('useSignIn 훅', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 초기 상태 테스트 ──────────────────────────────────────────────────────────

  it('초기 렌더링 시 빈 폼과 기본 상태를 가져야 한다', () => {
    // when
    const { result } = renderHook(() => useSignIn());

    // then
    expect(result.current.form).toEqual({ email: '', password: '' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── 유효성 검사 테스트 ────────────────────────────────────────────────────────

  it('이메일이 비어있으면 유효성 검사 에러가 설정되어야 한다', async () => {
    // given
    const { result } = renderHook(() => useSignIn());

    // when: 이메일 없이 로그인 시도
    await act(async () => {
      await result.current.handleSignIn();
    });

    // then
    expect(result.current.error).toBe('이메일을 입력해주세요.');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('비밀번호가 비어있으면 유효성 검사 에러가 설정되어야 한다', async () => {
    // given
    const { result } = renderHook(() => useSignIn());

    // when: 이메일만 입력하고 비밀번호 없이 로그인 시도
    await act(async () => {
      result.current.setField('email', 'test@example.com');
    });
    await act(async () => {
      await result.current.handleSignIn();
    });

    // then
    expect(result.current.error).toBe('비밀번호를 입력해주세요.');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  // ── 성공 케이스 테스트 ────────────────────────────────────────────────────────

  it('올바른 이메일/비밀번호 입력 시 signIn을 호출해야 한다', async () => {
    // given
    mockSignIn.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSignIn());

    // when
    await act(async () => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'password123');
    });
    await act(async () => {
      await result.current.handleSignIn();
    });

    // then
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.current.error).toBeNull();
  });

  // ── 에러 처리 테스트 ──────────────────────────────────────────────────────────

  it('EMAIL_NOT_VERIFIED 에러 발생 시 verify-email 화면으로 이동해야 한다', async () => {
    // given: 이메일 미인증 에러를 던지는 mock
    const error = {
      response: { data: { error: { message: 'EMAIL_NOT_VERIFIED' } } },
    };
    mockSignIn.mockRejectedValue(error);
    const { result } = renderHook(() => useSignIn());

    // when
    await act(async () => {
      result.current.setField('email', 'unverified@example.com');
      result.current.setField('password', 'password123');
    });
    await act(async () => {
      await result.current.handleSignIn();
    });

    // then
    expect(mockRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(auth)/verify-email',
        params: expect.objectContaining({ email: 'unverified@example.com' }),
      }),
    );
  });

  it('ACCOUNT_DELETED 에러 발생 시 reactivate 화면으로 이동해야 한다', async () => {
    // given: 탈퇴 계정 에러를 던지는 mock
    const error = {
      response: { data: { error: { message: 'ACCOUNT_DELETED' } } },
    };
    mockSignIn.mockRejectedValue(error);
    const { result } = renderHook(() => useSignIn());

    // when
    await act(async () => {
      result.current.setField('email', 'deleted@example.com');
      result.current.setField('password', 'password123');
    });
    await act(async () => {
      await result.current.handleSignIn();
    });

    // then
    expect(mockRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(auth)/reactivate',
        params: expect.objectContaining({ email: 'deleted@example.com' }),
      }),
    );
  });

  it('일반 에러 발생 시 에러 메시지가 설정되어야 한다', async () => {
    // given: 일반 로그인 실패 에러
    const error = {
      response: { data: { error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } } },
    };
    mockSignIn.mockRejectedValue(error);
    const { result } = renderHook(() => useSignIn());

    // when
    await act(async () => {
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'wrongPassword');
    });
    await act(async () => {
      await result.current.handleSignIn();
    });

    // then
    expect(result.current.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    expect(result.current.isLoading).toBe(false);
  });
});
