/**
 * 소셜 로그인 서비스 (Social Auth Service)
 *
 * 각 플랫폼(Google, Kakao, Apple)의 네이티브 SDK를 호출하여
 * 토큰을 획득한 뒤 백엔드로 전달합니다.
 *
 * 사전 설정 필요:
 * - Google: app.json iosUrlScheme + GOOGLE_WEB_CLIENT_ID 환경변수
 * - Kakao:  app.json nativeAppKey (Kakao Developers에서 발급)
 * - Apple:  app.json usesAppleSignIn: true (iOS 전용)
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin } from '@react-native-kakao/user';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { apiClient } from './api.client';
import type { AuthTokens, User } from '@mealplan/shared';

/** 소셜 로그인 응답 (백엔드 AuthResponse와 동일) */
export interface SocialAuthResult {
  user: User;
  tokens: AuthTokens;
}

/** Google Sign-In 초기화 (앱 시작 시 1회 호출) */
export function initGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId, // Google Cloud Console > OAuth 2.0 > 웹 클라이언트 ID
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
}

/** ── Google 로그인 ─────────────────────────────────────── */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (!idToken) throw new Error('Google ID 토큰을 받지 못했습니다.');

  return sendSocialToken('google', idToken);
}

/** ── Kakao 로그인 ─────────────────────────────────────── */
export async function signInWithKakao(): Promise<SocialAuthResult> {
  let tokenInfo;
  try {
    tokenInfo = await kakaoLogin();
  } catch (err) {
    // 사용자 취소 시 에러 전파 (useSocialSignIn에서 무시 처리됨)
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('cancelled') || msg.includes('cancel')) {
      throw new Error('ERR_CANCELED');
    }
    throw new Error(`카카오 로그인 중 오류가 발생했습니다: ${msg}`);
  }
  const accessToken = tokenInfo.accessToken;
  if (!accessToken) throw new Error('Kakao 액세스 토큰을 받지 못했습니다.');

  return sendSocialToken('kakao', accessToken);
}

/** ── Apple 로그인 (iOS 전용) ──────────────────────────── */
export async function signInWithApple(): Promise<SocialAuthResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple 로그인은 iOS에서만 지원됩니다.');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('Apple Identity 토큰을 받지 못했습니다.');

  // fullName은 최초 로그인 시에만 제공됨
  const name = credential.fullName
    ? `${credential.fullName.familyName ?? ''}${credential.fullName.givenName ?? ''}`.trim()
    : undefined;

  return sendSocialToken('apple', credential.identityToken, name || undefined);
}

/** 백엔드 소셜 로그인 엔드포인트 호출 */
async function sendSocialToken(
  provider: 'google' | 'kakao' | 'apple',
  token: string,
  name?: string,
): Promise<SocialAuthResult> {
  const { data } = await apiClient.post<{ success: true; data: SocialAuthResult }>(
    `/auth/social/${provider}`,
    { token, name },
  );
  return data.data;
}
