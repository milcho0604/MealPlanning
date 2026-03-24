/**
 * 회원가입 훅 (useSignUp)
 *
 * 회원가입 화면의 폼 상태 관리와 유효성 검사, 제출 로직을 담당합니다.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { authService } from '../../services/auth.service';

/** 회원가입 폼 상태 타입 */
interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** useSignUp 훅 반환 타입 */
interface UseSignUpReturn {
  form: SignUpForm;
  setField: (field: keyof SignUpForm, value: string) => void;
  handleSignUp: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSignUp(): UseSignUpReturn {

  const [form, setForm] = useState<SignUpForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof SignUpForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  /** 클라이언트 사이드 유효성 검사 */
  const validate = (): string | null => {
    if (!form.name.trim()) return '이름을 입력해주세요.';
    if (!form.email.trim()) return '이메일을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return '올바른 이메일 형식을 입력해주세요.';
    if (form.password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.confirmPassword) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // 가입 성공 → 인증 안내 화면으로 이동
      router.replace({ pathname: '/(auth)/verify-email', params: { email: form.email.trim() } });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? '회원가입에 실패했습니다. 다시 시도해주세요.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { form, setField, handleSignUp, isLoading, error };
}
