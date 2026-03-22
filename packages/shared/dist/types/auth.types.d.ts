/**
 * 인증(Auth) 관련 공통 타입 정의
 *
 * 모바일 앱과 API 서버가 함께 사용하므로
 * 변경 시 양쪽 동작에 영향을 미칩니다.
 */
/** 회원가입 요청 바디 */
export interface SignUpRequest {
    email: string;
    password: string;
    name: string;
}
/** 로그인 요청 바디 */
export interface SignInRequest {
    email: string;
    password: string;
}
/** 인증 성공 응답 - 액세스 토큰 + 리프레시 토큰 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    /** 액세스 토큰 만료 시각 (ISO 8601) */
    expiresAt: string;
}
/** 토큰 갱신 요청 바디 */
export interface RefreshTokenRequest {
    refreshToken: string;
}
/** JWT 페이로드 구조 (서버에서 디코딩하여 사용) */
export interface JwtPayload {
    /** Supabase User UUID */
    sub: string;
    email: string;
    /** 토큰 발급 시각 (Unix timestamp) */
    iat: number;
    /** 토큰 만료 시각 (Unix timestamp) */
    exp: number;
}
//# sourceMappingURL=auth.types.d.ts.map