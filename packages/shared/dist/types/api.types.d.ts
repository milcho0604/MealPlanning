/**
 * API 공통 응답 형태 타입 정의
 *
 * 서버는 항상 아래 구조로 응답합니다.
 * 성공: { success: true, data: T }
 * 실패: { success: false, error: { code, message } }
 */
/** 성공 응답 */
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}
/** 실패 응답 */
export interface ApiErrorResponse {
    success: false;
    error: {
        /** 에러 코드 (예: "UNAUTHORIZED", "NOT_FOUND") */
        code: string;
        /** 사람이 읽을 수 있는 에러 메시지 */
        message: string;
    };
}
/** API 응답 통합 타입 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
/** 페이지네이션 메타 정보 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
/** 페이지네이션이 포함된 목록 응답 */
export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}
//# sourceMappingURL=api.types.d.ts.map