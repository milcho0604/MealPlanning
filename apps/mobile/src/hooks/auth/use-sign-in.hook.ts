/**
 * 로그인 훅 (useSignIn)
 *
 * 로그인 화면의 폼 상태 관리와 제출 로직을 담당합니다.
 * 뷰(화면)와 비즈니스 로직을 분리하기 위해 훅으로 추출합니다.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';

/** 로그인 폼 상태 타입 */
interface SignInForm {
  email: string;
  password: string;
}

/** useSignIn 훅 반환 타입 */
interface UseSignInReturn {
  form: SignInForm;
  setField: (field: keyof SignInForm, value: string) => void;
  handleSignIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSignIn(): UseSignInReturn {
  const { signIn } = useAuthStore();

  const [form, setForm] = useState<SignInForm>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 특정 필드 값 업데이트 */
  const setField = (field: keyof SignInForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // 입력 시 에러 메시지 초기화
    if (error) setError(null);
  };

  /** 로그인 제출 처리 */
  const handleSignIn = async () => {
    // 기본 유효성 검사
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!form.password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signIn({ email: form.email.trim(), password: form.password });
      // 로그인 성공 시 auth.store가 상태를 업데이트하면
      // AuthLayout의 Redirect가 자동으로 메인 화면으로 이동시킵니다.
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';

      // 이메일 미인증 → 인증 안내 화면으로 이동
      if (message === 'EMAIL_NOT_VERIFIED') {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: form.email.trim() } });
        return;
      }
      // 탈퇴 계정 → 휴면 해제 화면으로 이동
      if (message === 'ACCOUNT_DELETED') {
        router.replace({ pathname: '/(auth)/reactivate', params: { email: form.email.trim() } });
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { form, setField, handleSignIn, isLoading, error };
}
