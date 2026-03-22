/**
 * 사용자(User) 관련 공통 타입 정의
 */
/** DB users 테이블과 1:1 매핑되는 사용자 기본 정보 */
export interface User {
    id: string;
    email: string;
    name: string;
    /** 프로필 이미지 URL (없으면 null) */
    avatarUrl: string | null;
    createdAt: string;
}
/** 그룹 내 멤버 역할 */
export type MemberRole = 'owner' | 'editor' | 'viewer';
//# sourceMappingURL=user.types.d.ts.map