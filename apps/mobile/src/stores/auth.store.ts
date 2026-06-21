/**
 * 인증 상태 스토어 (Auth Store)
 *
 * Zustand를 사용하여 앱 전체의 인증 상태를 관리합니다.
 * - 로그인/로그아웃 액션
 * - 앱 시작 시 저장된 토큰으로 자동 로그인 (initialize)
 * - 인증 상태(isAuthenticated), 사용자 정보(user) 제공
 */

import { create } from 'zustand';
import { storage } from '../utils/storage';
import type { AuthTokens, User } from '@mealplan/shared';
import type { SignInRequest, SignUpRequest } from '@mealplan/shared';
import { authService } from '../services/auth.service';
import { setCachedToken } from '../services/api.client';
import { STORAGE_KEYS } from '../constants/storage-keys';

/** 순환 참조 방지를 위해 useGroupStore를 지연 import합니다. */
const resetGroupStore = () => {
  // 런타임에 동적 import하여 순환 의존성 회피
  import('./group.store').then(({ useGroupStore }) => {
    useGroupStore.getState().reset();
  });
};

/** 스토어 상태 타입 */
interface AuthState {
  /** 현재 로그인된 사용자 정보 (비로그인 시 null) */
  user: User | null;
  /** 로그인 여부 */
  isAuthenticated: boolean;
  /** 앱 시작 시 토큰 복원 완료 여부 (스플래시 화면 제어에 사용) */
  isInitialized: boolean;

  // ── 액션 ──────────────────────────────────────────────────
  /** 앱 시작 시 저장된 토큰으로 인증 상태 복원 */
  initialize: () => Promise<void>;
  /** 회원가입 */
  signUp: (body: SignUpRequest) => Promise<void>;
  /** 로그인 */
  signIn: (body: SignInRequest) => Promise<void>;
  /** 소셜 로그인 완료 후 토큰/사용자 직접 저장 */
  setAuth: (tokens: AuthTokens, user: User) => Promise<void>;
  /** 로그아웃 */
  signOut: () => Promise<void>;
  /** 회원 탈퇴 */
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  /**
   * 앱 시작 시 SecureStore에 저장된 토큰 확인
   * 토큰이 있으면 서버에서 최신 사용자 정보를 가져와 상태 복원
   */
  initialize: async () => {
    try {
      const accessToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (accessToken) {
        setCachedToken(accessToken);
        // 토큰이 있으면 서버에서 현재 사용자 정보 조회 (토큰 유효성도 함께 검증)
        const user = await authService.getMe();
        set({ user, isAuthenticated: true });
      } else {
        setCachedToken(null);
      }
    } catch {
      // 토큰이 만료되거나 유효하지 않은 경우 → 저장된 인증 정보 삭제
      setCachedToken(null);
      await storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
      set({ user: null, isAuthenticated: false });
    } finally {
      // 성공/실패 무관하게 초기화 완료로 표시 (스플래시 화면 숨기기)
      set({ isInitialized: true });
    }
  },

  /**
   * 회원가입 (이메일 인증 필요 → 자동 로그인하지 않음)
   * 가입 후 인증 메일이 발송되며, 인증 완료 후 로그인해야 합니다.
   */
  signUp: async (body) => {
    await authService.signUp(body);
  },

  /**
   * 로그인 처리
   */
  signIn: async (body) => {
    const { user, tokens } = await authService.signIn(body);

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    setCachedToken(tokens.accessToken);

    set({ user, isAuthenticated: true });
  },

  /**
   * 소셜 로그인 후 토큰 + 사용자 정보 직접 저장
   * (Google / Kakao / Apple 로그인 완료 후 호출)
   */
  setAuth: async (tokens, user) => {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    setCachedToken(tokens.accessToken);
    set({ user, isAuthenticated: true });
  },

  /**
   * 로그아웃 처리 - 서버 토큰 무효화 + 로컬 저장소 삭제
   */
  signOut: async () => {
    try {
      await authService.signOut();
    } catch {
      // 서버 에러가 있어도 클라이언트 측은 로그아웃 진행
    } finally {
      setCachedToken(null);
      await storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
      resetGroupStore();
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * 회원 탈퇴 - 서버에서 계정 및 모든 데이터 삭제 후 로컬 상태 초기화
   */
  deleteAccount: async () => {
    await authService.deleteAccount();
    setCachedToken(null);
    await storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
    resetGroupStore();
    set({ user: null, isAuthenticated: false });
  },
}));
