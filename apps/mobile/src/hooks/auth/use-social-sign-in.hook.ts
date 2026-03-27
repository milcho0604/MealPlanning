/**
 * 소셜 로그인 훅 (useSocialSignIn)
 *
 * Google / Kakao / Apple 소셜 로그인을 처리합니다.
 * 성공 시 auth store에 토큰과 사용자 정보를 저장합니다.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import {
  signInWithGoogle,
  signInWithKakao,
  signInWithApple,
} from '../../services/social-auth.service';
import { useAuthStore } from '../../stores/auth.store';

export function useSocialSignIn() {
  const { setAuth } = useAuthStore();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'kakao' | 'apple' | null>(null);

  const handleSocialSignIn = async (provider: 'google' | 'kakao' | 'apple') => {
    setLoadingProvider(provider);
    try {
      let result;
      if (provider === 'google') result = await signInWithGoogle();
      else if (provider === 'kakao') result = await signInWithKakao();
      else result = await signInWithApple();

      await setAuth(result.tokens, result.user);
    } catch (error: unknown) {
      // 사용자가 직접 취소한 경우 알림 생략
      const message = error instanceof Error ? error.message : '';
      if (
        message.includes('SIGN_IN_CANCELLED') ||
        message.includes('ERR_CANCELED') ||
        message.includes('com.apple.AuthenticationServices')
      ) {
        return;
      }
      // 백엔드 에러 메시지가 있으면 표시, 없으면 기본 메시지
      const axiosErr = error as { response?: { data?: { error?: { message?: string } } } };
      const detail = axiosErr?.response?.data?.error?.message;
      Alert.alert(
        '로그인 실패',
        detail ?? `${providerLabel(provider)} 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.`,
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return {
    handleSocialSignIn,
    loadingProvider,
  };
}

function providerLabel(provider: 'google' | 'kakao' | 'apple') {
  if (provider === 'google') return 'Google';
  if (provider === 'kakao') return '카카오';
  return 'Apple';
}
