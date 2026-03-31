/**
 * Axios HTTP 클라이언트 (API Client)
 *
 * 앱 전체에서 API 요청에 사용하는 Axios 인스턴스입니다.
 * - 요청 인터셉터: Authorization 헤더에 JWT 자동 첨부
 * - 응답 인터셉터: 401 발생 시 토큰 갱신 후 재요청
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage as SecureStore } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage-keys';

/** API 기본 URL - 환경 변수에서 읽음 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** 토큰 갱신 중복 방지: 진행 중인 refresh Promise를 공유 */
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

/** Axios 인스턴스 생성 */
export const apiClient = axios.create({
  baseURL: `${BASE_URL}/v1`,
  timeout: 60000, // 60초 타임아웃 (Render 무료 플랜 콜드 스타트 대응)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── 요청 인터셉터 ──────────────────────────────────────────────────────────────
// 모든 요청에 저장된 액세스 토큰을 Authorization 헤더에 첨부
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await SecureStore.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── 응답 인터셉터 ──────────────────────────────────────────────────────────────
// 401 Unauthorized 응답 시 리프레시 토큰으로 액세스 토큰 갱신 후 원래 요청 재시도
apiClient.interceptors.response.use(
  // 성공 응답은 그대로 반환
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401이고 아직 재시도하지 않은 경우에만 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 이미 갱신 중이면 기존 Promise 재사용 (race condition 방지)
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const rt = await SecureStore.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!rt) throw new Error('리프레시 토큰 없음');
            const { data: resp } = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken: rt });
            const tokens = resp?.data;
            if (!tokens?.accessToken || !tokens?.refreshToken) {
              throw new Error('토큰 갱신 응답 형식 오류');
            }
            await SecureStore.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
            await SecureStore.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
            return tokens;
          })().finally(() => { refreshPromise = null; });
        }

        const tokens = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        // 토큰 갱신 실패 시 저장된 인증 정보 삭제 (로그아웃 처리)
        await SecureStore.deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }

    return Promise.reject(error);
  },
);
