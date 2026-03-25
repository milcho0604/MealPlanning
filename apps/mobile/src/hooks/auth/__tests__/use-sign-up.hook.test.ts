/**
 * useSignUp 훅 단위 테스트
 *
 * 회원가입 폼 유효성 검사, 성공/실패 시나리오를 검증합니다.
 * expo-router와 auth.service를 mock으로 대체합니다.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useSignUp } from '../use-sign-up.hook';

// ── Mock 설정 ──────────────────────────────────────────────────────────────────

/** expo-router mock */
const mockRouterReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (args: unknown) => mockRouterReplace(args),
  },
}));

/** auth.service mock */
const mockSignUp = jest.fn();
jest.mock('../../../services/auth.service', () => ({
  authService: {
    signUp: (body: unknown) => mockSignUp(body),
  },
}));

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('useSignUp 훅', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 유효성 검사 테스트 ────────────────────────────────────────────────────────

  it('잘못된 이메일 형식 입력 시 에러가 설정되어야 한다', async () => {
    // given
    const { result } = renderHook(() => useSignUp());

    // when: 잘못된 이메일 형식 입력
    await act(async () => {
      result.current.setField('name', '홍길동');
      result.current.setField('email', 'invalid-email');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.handleSignUp();
    });

    // then
    expect(result.current.error).toBe('올바른 이메일 형식을 입력해주세요.');
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('비밀번호가 8자 미만이면 에러가 설정되어야 한다', async () => {
    // given
    const { result } = renderHook(() => useSignUp());

    // when: 8자 미만 비밀번호
    await act(async () => {
      result.current.setField('name', '홍길동');
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'short');
      result.current.setField('confirmPassword', 'short');
    });
    await act(async () => {
      await result.current.handleSignUp();
    });

    // then
    expect(result.current.error).toBe('비밀번호는 8자 이상이어야 합니다.');
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('비밀번호 확인이 일치하지 않으면 에러가 설정되어야 한다', async () => {
    // given
    const { result } = renderHook(() => useSignUp());

    // when: 비밀번호 불일치
    await act(async () => {
      result.current.setField('name', '홍길동');
      result.current.setField('email', 'test@example.com');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'differentPassword');
    });
    await act(async () => {
      await result.current.handleSignUp();
    });

    // then
    expect(result.current.error).toBe('비밀번호가 일치하지 않습니다.');
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  // ── 성공 케이스 테스트 ────────────────────────────────────────────────────────

  it('유효한 폼 입력 시 signUp API를 호출하고 verify-email 화면으로 이동해야 한다', async () => {
    // given
    mockSignUp.mockResolvedValue({ message: '인증 메일을 발송했습니다.' });
    const { result } = renderHook(() => useSignUp());

    // when
    await act(async () => {
      result.current.setField('name', '홍길동');
      result.current.setField('email', 'new@example.com');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.handleSignUp();
    });

    // then
    expect(mockSignUp).toHaveBeenCalledWith({
      name: '홍길동',
      email: 'new@example.com',
      password: 'password123',
    });
    expect(mockRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(auth)/verify-email',
        params: expect.objectContaining({ email: 'new@example.com' }),
      }),
    );
  });

  // ── 에러 처리 테스트 ──────────────────────────────────────────────────────────

  it('API 에러 발생 시 에러 메시지가 설정되어야 한다', async () => {
    // given: 이미 존재하는 이메일로 회원가입 시도
    const error = {
      response: { data: { error: { message: '이미 사용 중인 이메일입니다.' } } },
    };
    mockSignUp.mockRejectedValue(error);
    const { result } = renderHook(() => useSignUp());

    // when
    await act(async () => {
      result.current.setField('name', '홍길동');
      result.current.setField('email', 'existing@example.com');
      result.current.setField('password', 'password123');
      result.current.setField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.handleSignUp();
    });

    // then
    expect(result.current.error).toBe('이미 사용 중인 이메일입니다.');
    expect(result.current.isLoading).toBe(false);
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
