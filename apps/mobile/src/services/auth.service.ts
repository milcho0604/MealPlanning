/**
 * 인증 API 서비스 (Auth Service)
 *
 * 인증 관련 API 호출을 담당합니다.
 * 컴포넌트/훅에서 직접 axios를 호출하지 않고
 * 이 서비스를 통해 API를 호출합니다.
 */

import type { AuthTokens, SignInRequest, SignUpRequest } from '@mealplan/shared';
import type { User } from '@mealplan/shared';
import { apiClient } from './api.client';

/** 로그인 응답 */
interface SignInResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  /**
   * 회원가입
   * @returns 생성된 사용자 정보와 인증 토큰
   */
  signUp: async (body: SignUpRequest): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ success: true; data: { message: string } }>(
      '/auth/signup',
      body,
    );
    return data.data;
  },

  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post('/auth/resend-verification', { email });
  },

  /**
   * 로그인
   * @returns 로그인한 사용자 정보와 인증 토큰
   */
  signIn: async (body: SignInRequest): Promise<SignInResponse> => {
    const { data } = await apiClient.post<{ success: true; data: SignInResponse }>(
      '/auth/login',
      body,
    );
    return data.data;
  },

  /**
   * 로그아웃 (서버 측 토큰 무효화)
   */
  signOut: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * 내 프로필 조회
   */
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<{ success: true; data: User }>('/auth/me');
    return data.data;
  },

  /** 비밀번호 변경 (로그인 상태) */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  /** 비밀번호 찾기 (재설정 링크 발송) */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * 회원 탈퇴
   * Supabase Auth + DB의 모든 사용자 데이터 삭제
   */
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/account');
  },
};
